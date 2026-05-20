import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { createWorker } from 'tesseract.js';
import { fromPath } from 'pdf2pic';
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
  progress: number;
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
  questionType: 'mcq' | 'structured' | 'true_false' | 'fill_blank';
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

async function convertPdfToImages(pdfPath: string, outputDir: string): Promise<string[]> {
  const options = {
    density: 300,
    saveFilename: 'page',
    savePath: outputDir,
    format: 'png',
    width: 2480,
    height: 3508,
  };

  const storeAsImage = fromPath(pdfPath, options);
  const pages: string[] = [];

  try {
    const pageCount = (await storeAsImage.bulk(-1)).length;
    for (let i = 1; i <= Math.min(pageCount, 20); i++) {
      const result = await storeAsImage(i);
      if (result.path) {
        pages.push(result.path);
      }
    }
  } catch (err) {
    console.error('PDF conversion error:', err);
  }

  return pages;
}

function extractQuestionsFromText(text: string): ExtractedQuestion[] {
  const questions: ExtractedQuestion[] = [];
  const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 10);

  let questionIndex = 0;

  for (const paragraph of paragraphs) {
    const lines = paragraph.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    for (const line of lines) {
      const numberedQuestion = line.match(/^(\d+)[\.\)\-]\s+(.+)/);
      const letteredQuestion = line.match(/^([A-Z])[\.\)\-]\s+(.+)/);

      if (numberedQuestion || letteredQuestion) {
        questionIndex++;
        const questionText = numberedQuestion ? numberedQuestion[2] : letteredQuestion![2];
        const q: ExtractedQuestion = {
          id: `q_${questionIndex}`,
          text: questionText,
          options: [],
          questionType: 'structured',
          confidence: 0.65,
        };

        const paraLines = paragraph.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const lineIdx = paraLines.indexOf(line);

        for (let j = lineIdx + 1; j < paraLines.length; j++) {
          const nextLine = paraLines[j];
          const optionMatch = nextLine.match(/^([a-dA-D])[\.\)\s]+\s*(.+)/);
          const answerMatch = nextLine.match(/^(answer|key|correct|solution)[\s:]+([a-dA-D])/i);
          const trueFalseMatch = nextLine.match(/^(true|false|t|f)[\s\.)]/i);

          if (optionMatch) {
            if (q.options.length === 0) {
              q.questionType = 'mcq';
              q.confidence = 0.75;
            }
            q.options.push({
              id: optionMatch[1].toLowerCase(),
              text: optionMatch[2],
              isCorrect: false,
            });
          } else if (answerMatch) {
            const correctId = answerMatch[2].toLowerCase();
            q.correctAnswer = correctId;
            q.options = q.options.map(o => ({ ...o, isCorrect: o.id === correctId }));
            q.confidence = 0.85;
          } else if (trueFalseMatch && q.options.length === 0) {
            q.questionType = 'true_false';
            q.options = [
              { id: 'a', text: 'True', isCorrect: trueFalseMatch[1].toLowerCase().startsWith('t') },
              { id: 'b', text: 'False', isCorrect: !trueFalseMatch[1].toLowerCase().startsWith('t') },
            ];
            q.confidence = 0.7;
          } else if (nextLine.match(/^(\d+)[\.\)\-]/) || nextLine.match(/^([A-Z])[\.\)\-]/)) {
            break;
          }
        }

        if (q.options.length === 0 && q.text.length > 10) {
          const fillBlankMatch = q.text.match(/_____|blank|\(\s*\)/i);
          if (fillBlankMatch) {
            q.questionType = 'fill_blank';
          }
        }

        questions.push(q);
      }
    }
  }

  if (questions.length === 0) {
    questions.push(...generateFallbackQuestions(text));
  }

  return questions;
}

function generateFallbackQuestions(text: string): ExtractedQuestion[] {
  const sentences = text.split(/[.\n]+/).map(s => s.trim()).filter(s => s.length > 25 && s.length < 200);
  const questions: ExtractedQuestion[] = [];

  const keyTerms = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
  const uniqueTerms = [...new Set(keyTerms)].filter(t => t.length > 3).slice(0, 10);

  for (let i = 0; i < Math.min(sentences.length, 8); i++) {
    const sentence = sentences[i];
    const words = sentence.split(' ');
    if (words.length < 5) continue;

    const blankIndex = Math.floor(words.length * 0.5);
    const missingWord = words[blankIndex].replace(/[^a-zA-Z]/g, '');
    if (missingWord.length < 3) continue;

    const distractors = uniqueTerms.filter(t => t !== missingWord && t.length > 3).slice(0, 3);

    const options = [
      { id: 'a', text: missingWord, isCorrect: true },
      { id: 'b', text: distractors[0] || 'None of the above', isCorrect: false },
      { id: 'c', text: distractors[1] || 'All of the above', isCorrect: false },
      { id: 'd', text: distractors[2] || 'Cannot be determined', isCorrect: false },
    ].sort(() => Math.random() - 0.5).map((o, idx) => ({ ...o, id: ['a', 'b', 'c', 'd'][idx] }));

    questions.push({
      id: `q_${i + 1}`,
      text: `Fill in the blank: "${words.slice(0, blankIndex).join(' ')} _____ ${words.slice(blankIndex + 1).join(' ')}"`,
      options,
      correctAnswer: options.find(o => o.isCorrect)?.id,
      questionType: 'fill_blank',
      confidence: 0.45,
    });
  }

  return questions;
}

async function processJob(jobId: string): Promise<void> {
  const job = jobs.get(jobId);
  if (!job) return;

  job.status = 'processing';
  job.startedAt = new Date();
  job.progress = 5;
  jobs.set(jobId, job);

  try {
    const startTime = Date.now();
    let fullText = '';
    let totalConfidence = 0;
    let pageCount = 0;
    const imagePaths: string[] = [];

    if (job.mimeType === 'application/pdf') {
      const pdfImageDir = path.join(TEMP_DIR, `pdf-${jobId}`);
      if (!fs.existsSync(pdfImageDir)) {
        fs.mkdirSync(pdfImageDir, { recursive: true });
      }

      job.progress = 10;
      jobs.set(jobId, job);

      const pdfImages = await convertPdfToImages(job.filePath, pdfImageDir);
      pageCount = pdfImages.length;

      if (pageCount === 0) {
        throw new Error('Failed to convert PDF to images. Ensure GraphicsMagick is installed.');
      }

      job.progress = 20;
      jobs.set(jobId, job);

      for (let i = 0; i < pdfImages.length; i++) {
        const { text, confidence } = await performOCR(pdfImages[i]);
        fullText += `\n--- Page ${i + 1} ---\n${text}`;
        totalConfidence += confidence;
        imagePaths.push(pdfImages[i]);

        job.progress = 20 + Math.round((i + 1) / pdfImages.length * 60);
        jobs.set(jobId, job);
      }

      for (const imgPath of imagePaths) {
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }
      if (fs.existsSync(pdfImageDir)) fs.rmSync(pdfImageDir, { recursive: true });
    } else {
      job.progress = 30;
      jobs.set(jobId, job);

      const { text, confidence } = await performOCR(job.filePath);
      fullText = text;
      totalConfidence = confidence;
      pageCount = 1;

      job.progress = 80;
      jobs.set(jobId, job);
    }

    job.progress = 85;
    jobs.set(jobId, job);

    let questions = extractQuestionsFromText(fullText);

    job.progress = 95;
    jobs.set(jobId, job);

    const processingTime = Math.round((Date.now() - startTime) / 1000);

    job.status = 'completed';
    job.progress = 100;
    job.completedAt = new Date();
    job.result = {
      text: fullText,
      pages: pageCount,
      confidence: pageCount > 0 ? Math.round(totalConfidence / pageCount) / 100 : 0,
      questions,
      processingTime,
    };

    jobs.set(jobId, job);
  } catch (error: any) {
    job.status = 'failed';
    job.progress = 0;
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
    progress: 0,
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
    progress: job.progress,
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
      questions: job.result.questions,
    };
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
    progress: j.progress,
    fileName: j.fileName,
    createdAt: j.createdAt,
    completedAt: j.completedAt,
  }));
  res.json({ jobs: allJobs, total: allJobs.length });
});

app.delete('/jobs/:jobId', (req: Request, res: Response) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    return res.status(400).json({ error: 'Job not found' });
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
  console.log(`OCR Service running on port ${PORT}`);
  console.log(`Temp directory: ${TEMP_DIR}`);
});

export default app;
