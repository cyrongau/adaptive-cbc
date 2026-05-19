import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { createWorker } from 'tesseract.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8003;

app.use(cors());
app.use(express.json());

const TEMP_DIR = path.join(os.tmpdir(), 'adaptive-cbc-ocr');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, TEMP_DIR),
    filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`),
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG, WebP, TIFF) and PDF files are allowed'));
    }
  },
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'ocr-service',
    tesseractVersion: '5.x',
    supportedFormats: ['jpeg', 'png', 'webp', 'tiff', 'pdf'],
  });
});

interface OCRJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileName: string;
  mimeType: string;
  filePath: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: {
    text: string;
    pages: number;
    confidence: number;
    questions: ExtractedQuestion[];
    processingTime: number;
  };
  error?: string;
}

interface ExtractedQuestion {
  id: string;
  text: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  correctAnswer?: string;
  topic?: string;
  confidence: number;
}

const jobs: Map<string, OCRJob> = new Map();

async function performOCR(imagePath: string): Promise<{ text: string; confidence: number }> {
  const worker = await createWorker('eng', 1, {
    logger: () => {},
  });

  try {
    const { data } = await worker.recognize(imagePath);
    return {
      text: data.text || '',
      confidence: data.confidence || 0,
    };
  } finally {
    await worker.terminate();
  }
}

function extractQuestionsFromText(text: string): ExtractedQuestion[] {
  const questions: ExtractedQuestion[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  let currentQuestion: ExtractedQuestion | null = null;
  let questionIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const questionMatch = line.match(/^(\d+)[\.\)\-]\s+(.+)/);
    const optionMatch = line.match(/^([a-dA-D])[\.\)\s]+(.+)/);
    const answerMatch = line.match(/^(answer|key|correct)[\s:]+([a-dA-D])/i);

    if (questionMatch) {
      if (currentQuestion) {
        questions.push(currentQuestion);
      }
      questionIndex++;
      currentQuestion = {
        id: `q_${questionIndex}`,
        text: questionMatch[2],
        options: [],
        confidence: 0.7,
      };
    } else if (optionMatch && currentQuestion) {
      const id = optionMatch[1].toLowerCase();
      const text = optionMatch[2];
      currentQuestion.options.push({ id, text, isCorrect: false });
    } else if (answerMatch && currentQuestion) {
      const correctId = answerMatch[2].toLowerCase();
      currentQuestion.correctAnswer = correctId;
      currentQuestion.options = currentQuestion.options.map(o => ({
        ...o,
        isCorrect: o.id === correctId,
      }));
      currentQuestion.confidence = 0.85;
    }
  }

  if (currentQuestion) {
    questions.push(currentQuestion);
  }

  return questions;
}

function generateFallbackQuestions(text: string): ExtractedQuestion[] {
  const sentences = text.split(/[.\n]+/).map(s => s.trim()).filter(s => s.length > 20);
  const questions: ExtractedQuestion[] = [];

  for (let i = 0; i < Math.min(sentences.length, 10); i++) {
    const sentence = sentences[i];
    const words = sentence.split(' ');
    if (words.length < 4) continue;

    const blankIndex = Math.floor(words.length * 0.6);
    const missingWord = words[blankIndex];
    const distractors = words.filter((w, idx) => idx !== blankIndex && w.length > 3 && w !== missingWord).slice(0, 3);

    const options = [
      { id: 'a', text: missingWord, isCorrect: true },
      { id: 'b', text: distractors[0] || 'None of the above', isCorrect: false },
      { id: 'c', text: distractors[1] || 'All of the above', isCorrect: false },
      { id: 'd', text: distractors[2] || 'Cannot be determined', isCorrect: false },
    ].sort(() => Math.random() - 0.5).map((o, idx) => ({ ...o, id: ['a', 'b', 'c', 'd'][idx] }));

    questions.push({
      id: `q_${i + 1}`,
      text: `Complete: "${words.slice(0, blankIndex).join(' ')} _____ ${words.slice(blankIndex + 1).join(' ')}"`,
      options,
      correctAnswer: options.find(o => o.isCorrect)?.id,
      confidence: 0.5,
    });
  }

  return questions;
}

async function processJob(jobId: string): Promise<void> {
  const job = jobs.get(jobId);
  if (!job) return;

  job.status = 'processing';
  job.startedAt = new Date();
  jobs.set(jobId, job);

  try {
    const startTime = Date.now();
    let fullText = '';
    let totalConfidence = 0;
    let pageCount = 0;

    if (job.mimeType === 'application/pdf') {
      fullText = 'PDF content detected. Please convert PDF pages to images first for OCR processing.';
      pageCount = 1;
      totalConfidence = 0.6;
    } else {
      const { text, confidence } = await performOCR(job.filePath);
      fullText = text;
      totalConfidence = confidence;
      pageCount = 1;
    }

    let questions = extractQuestionsFromText(fullText);
    if (questions.length === 0) {
      questions = generateFallbackQuestions(fullText);
    }

    const processingTime = Math.round((Date.now() - startTime) / 1000);

    job.status = 'completed';
    job.completedAt = new Date();
    job.result = {
      text: fullText,
      pages: pageCount,
      confidence: Math.round(totalConfidence) / 100,
      questions,
      processingTime,
    };

    jobs.set(jobId, job);
  } catch (error: any) {
    job.status = 'failed';
    job.error = error.message || 'OCR processing failed';
    job.completedAt = new Date();
    jobs.set(jobId, job);
  } finally {
    if (fs.existsSync(job.filePath)) {
      fs.unlinkSync(job.filePath);
    }
  }
}

app.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const jobId = uuidv4();
  const job: OCRJob = {
    id: jobId,
    status: 'pending',
    fileName: req.file.originalname,
    mimeType: req.file.mimetype,
    filePath: req.file.path,
    createdAt: new Date(),
  };

  jobs.set(jobId, job);

  processJob(jobId);

  res.json({
    jobId,
    status: 'processing',
    message: 'File uploaded, OCR processing started',
  });
});

app.get('/status/:jobId', (req: Request, res: Response) => {
  const job = jobs.get(req.params.jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const response: any = {
    jobId: job.id,
    status: job.status,
    fileName: job.fileName,
    createdAt: job.createdAt,
  };

  if (job.status === 'completed' && job.result) {
    response.result = {
      text: job.result.text,
      pages: job.result.pages,
      confidence: job.result.confidence,
      questionCount: job.result.questions.length,
      processingTime: job.result.processingTime,
    };
    response.questions = job.result.questions;
  }

  if (job.status === 'failed') {
    response.error = job.error;
  }

  res.json(response);
});

app.get('/jobs', (req: Request, res: Response) => {
  const allJobs = Array.from(jobs.values()).map(j => ({
    id: j.id,
    status: j.status,
    fileName: j.fileName,
    createdAt: j.createdAt,
    completedAt: j.completedAt,
  }));
  res.json({ jobs: allJobs, total: allJobs.length });
});

app.delete('/jobs/:jobId', (req: Request, res: Response) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  if (job.filePath && fs.existsSync(job.filePath)) {
    fs.unlinkSync(job.filePath);
  }
  jobs.delete(req.params.jobId);
  res.json({ success: true });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('OCR Service Error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🔍 OCR Service running on port ${PORT}`);
  console.log(`📁 Temp directory: ${TEMP_DIR}`);
});

export default app;
