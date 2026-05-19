import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;

app.use(cors());
app.use(express.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GenerateExplanationRequest {
  question: string;
  correctAnswer: string;
  userAnswer?: string;
  isCorrect: boolean;
  questionType?: string;
}

interface GenerateSimilarQuestionRequest {
  originalQuestion: string;
  topic: string;
  grade: number;
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: string;
  count?: number;
}

interface GenerateQuizRequest {
  topic: string;
  subject: string;
  grade: number;
  questionCount: number;
  difficulty?: string;
}

interface SimplifyConceptRequest {
  concept: string;
  learnerLevel: string;
  includeExamples?: boolean;
}

interface ValidateAnswerRequest {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  questionType: string;
}

async function callOpenRouter(messages: ChatMessage[], model: string = 'anthropic/claude-3.5-sonnet'): Promise<string> {
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'placeholder_key') {
    throw new Error('OpenRouter API key not configured');
  }

  try {
    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error: any) {
    console.error('OpenRouter API Error:', error.response?.data || error.message);
    throw new Error('Failed to generate AI response');
  }
}

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'ai-service',
    openrouterConfigured: !!OPENROUTER_API_KEY && OPENROUTER_API_KEY !== 'placeholder_key',
  });
});

// Generate explanation
app.post('/api/explain', async (req: Request, res: Response) => {
  try {
    const { question, correctAnswer, userAnswer, isCorrect, questionType } = req.body as GenerateExplanationRequest;

    const systemMessage: ChatMessage = {
      role: 'system',
      content: `You are an expert educational tutor for the Kenyan CBC curriculum. 
        Provide clear, encouraging, and educational explanations.
        Adapt your explanation style based on whether the student got the answer right or wrong.
        Use simple language and include step-by-step breakdowns when applicable.`,
    };

    const userMessage: ChatMessage = {
      role: 'user',
      content: isCorrect
        ? `Great work! Explain this question and its answer to reinforce learning:\n\nQuestion: ${question}\nCorrect Answer: ${correctAnswer}`
        : `The student got this question wrong. Provide a detailed explanation with the correct answer and explain the common mistake:\n\nQuestion: ${question}\nCorrect Answer: ${correctAnswer}${userAnswer ? `\n Student's Answer: ${userAnswer}` : ''}`,
    };

    const explanation = await callOpenRouter([systemMessage, userMessage]);

    res.json({
      success: true,
      explanation,
      metadata: {
        questionType,
        wasCorrect: isCorrect,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate explanation',
    });
  }
});

// Generate similar questions
app.post('/api/questions/similar', async (req: Request, res: Response) => {
  try {
    const { originalQuestion, topic, grade, difficulty, questionType, count = 5 } = req.body as GenerateSimilarQuestionRequest;

    const systemMessage: ChatMessage = {
      role: 'system',
      content: `You are an expert at creating educational questions for the Kenyan CBC curriculum.
        Generate multiple choice questions that test the same concept as the original question.
        Each question should have 4 options with one correct answer.
        Return the questions in JSON format.`,
    };

    const userMessage: ChatMessage = {
      role: 'user',
      content: `Generate ${count} similar questions to this one:\n\nOriginal Question: ${originalQuestion}\n\nTopic: ${topic}\nGrade: ${grade}\nDifficulty: ${difficulty}\nQuestion Type: ${questionType}\n\nReturn in JSON format: { "questions": [{ "question": "...", "options": [{"id": "a", "text": "...", "isCorrect": false}, ...], "explanation": "..." }, ...] }`,
    };

    const response = await callOpenRouter([systemMessage, userMessage], 'anthropic/claude-3.5-sonnet');

    let questions;
    try {
      questions = JSON.parse(response);
    } catch {
      questions = { questions: [{ question: response, options: [], explanation: 'Unable to generate structured questions' }] };
    }

    res.json({
      success: true,
      questions: questions.questions || [],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate similar questions',
    });
  }
});

// Generate quiz
app.post('/api/quiz/generate', async (req: Request, res: Response) => {
  try {
    const { topic, subject, grade, questionCount, difficulty = 'medium' } = req.body as GenerateQuizRequest;

    const systemMessage: ChatMessage = {
      role: 'system',
      content: `You are an expert educational content creator for the Kenyan CBC curriculum.
        Create a quiz with diverse question types including multiple choice, true/false, and short answer.
        Return questions in proper JSON format.`,
    };

    const userMessage: ChatMessage = {
      role: 'user',
      content: `Create a ${questionCount}-question quiz for:\n\nSubject: ${subject}\nTopic: ${topic}\nGrade: ${grade}\nDifficulty: ${difficulty}\n\nReturn in JSON format: { "title": "...", "description": "...", "questions": [{ "type": "multiple_choice|true_false|short_answer", "content": "...", "options": [...], "correctAnswer": "...", "explanation": "...", "difficulty": "easy|medium|hard" }, ...] }`,
    };

    const response = await callOpenRouter([systemMessage, userMessage], 'anthropic/claude-3.5-sonnet');

    let quiz;
    try {
      quiz = JSON.parse(response);
    } catch {
      quiz = { title: 'Generated Quiz', description: 'Quiz content', questions: [] };
    }

    res.json({
      success: true,
      quiz,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate quiz',
    });
  }
});

// Simplify concept
app.post('/api/concept/simplify', async (req: Request, res: Response) => {
  try {
    const { concept, learnerLevel, includeExamples = true } = req.body as SimplifyConceptRequest;

    const systemMessage: ChatMessage = {
      role: 'system',
      content: `You are a patient and skilled educator who excels at breaking down complex concepts into simple, digestible explanations.
        Use analogies and real-world examples appropriate for the learner's level.`,
    };

    const userMessage: ChatMessage = {
      role: 'user',
      content: `Simplify this concept for a ${learnerLevel} student${includeExamples ? ', including practical examples' : ''}:\n\nConcept: ${concept}`,
    };

    const simplified = await callOpenRouter([systemMessage, userMessage]);

    res.json({
      success: true,
      simplified,
      metadata: {
        learnerLevel,
        includeExamples,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to simplify concept',
    });
  }
});

// Validate answer
app.post('/api/answer/validate', async (req: Request, res: Response) => {
  try {
    const { question, userAnswer, correctAnswer, questionType } = req.body as ValidateAnswerRequest;

    const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

    const feedback = isCorrect
      ? `Correct! The answer "${correctAnswer}" is right.`
      : `Not quite. The correct answer is "${correctAnswer}".`;

    res.json({
      success: true,
      isCorrect,
      feedback,
      metadata: {
        questionType,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to validate answer',
    });
  }
});

// Generate onboarding assessment questions
app.post('/api/onboarding/assessment/generate', async (req: Request, res: Response) => {
  try {
    const { grade, subjects, previousAnswers, count = 10 } = req.body;

    let difficultyDistribution = '3 easy, 4 medium, 3 hard';
    let focusAreas = 'Cover fundamental concepts appropriate for this grade level';

    if (previousAnswers && previousAnswers.length > 0) {
      const correctCount = previousAnswers.filter((a: any) => a.isCorrect).length;
      const ratio = correctCount / previousAnswers.length;
      if (ratio > 0.8) {
        difficultyDistribution = '2 easy, 3 medium, 5 hard';
        focusAreas = 'Focus on advanced application and critical thinking';
      } else if (ratio > 0.5) {
        difficultyDistribution = '3 easy, 4 medium, 3 hard';
        focusAreas = 'Mix of foundational and intermediate concepts';
      } else {
        difficultyDistribution = '5 easy, 3 medium, 2 hard';
        focusAreas = 'Focus on core foundational concepts and basic understanding';
      }
    }

    const systemMessage: ChatMessage = {
      role: 'system',
      content: `You are an expert CBC curriculum assessor creating a baseline diagnostic assessment for Kenyan students. 
        Generate questions that assess the student's current understanding across multiple subjects.
        Each question must be multiple choice with exactly 4 options (a, b, c, d) and exactly one correct answer.
        Return ONLY valid JSON without any markdown formatting or code fences.`,
    };

    const userMessage: ChatMessage = {
      role: 'user',
      content: `Create a ${count}-question baseline assessment for a Grade ${grade} student studying these subjects: ${subjects?.join(', ') || 'Mathematics, English, Science, Social Studies'}.
        
        Difficulty distribution: ${difficultyDistribution}
        Focus: ${focusAreas}
        
        For each question include:
        - id: unique string (e.g. "q1", "q2")
        - subjectId: which subject this question belongs to (one of the listed subjects)
        - content: the question text
        - options: array of 4 objects with "id": "a"/"b"/"c"/"d" and "text": the option text
        - correctAnswer: "a", "b", "c", or "d"
        - explanation: brief explanation of the correct answer
        - difficulty: "easy", "medium", or "hard"
        - topic: the specific topic within the subject
        
        Return in JSON format: { "questions": [ { "id", "subjectId", "content", "options": [{"id","text"}], "correctAnswer", "explanation", "difficulty", "topic" } ] }`,
    };

    const response = await callOpenRouter([systemMessage, userMessage], 'anthropic/claude-3.5-sonnet');

    function getFallbackQuestions(grade: number, subjects: string[]): any[] {
      const fallbacks: any[] = [];
      const easyMath = [
        { content: `What is 5 + 3?`, options: [{ id: 'a', text: '7' }, { id: 'b', text: '8' }, { id: 'c', text: '9' }, { id: 'd', text: '10' }], correctAnswer: 'b', explanation: '5 + 3 = 8', difficulty: 'easy', topic: 'Addition' },
        { content: `If you have 12 apples and eat 4, how many remain?`, options: [{ id: 'a', text: '6' }, { id: 'b', text: '7' }, { id: 'c', text: '8' }, { id: 'd', text: '9' }], correctAnswer: 'c', explanation: '12 - 4 = 8', difficulty: 'easy', topic: 'Subtraction' },
      ];
      const mediumMath = [
        { content: `What is 3/4 as a decimal?`, options: [{ id: 'a', text: '0.25' }, { id: 'b', text: '0.5' }, { id: 'c', text: '0.75' }, { id: 'd', text: '0.8' }], correctAnswer: 'c', explanation: '3/4 = 0.75', difficulty: 'medium', topic: 'Fractions' },
        { content: `Solve: x + 7 = 15`, options: [{ id: 'a', text: 'x = 7' }, { id: 'b', text: 'x = 8' }, { id: 'c', text: 'x = 15' }, { id: 'd', text: 'x = 22' }], correctAnswer: 'b', explanation: 'x = 15 - 7 = 8', difficulty: 'medium', topic: 'Algebra' },
      ];
      const hardMath = [
        { content: `What is the area of a rectangle with length 8cm and width 5cm?`, options: [{ id: 'a', text: '13 cm²' }, { id: 'b', text: '26 cm²' }, { id: 'c', text: '40 cm²' }, { id: 'd', text: '45 cm²' }], correctAnswer: 'c', explanation: 'Area = length × width = 8 × 5 = 40 cm²', difficulty: 'hard', topic: 'Measurement' },
      ];
      const englishQ = [
        { content: `Which word is a noun?`, options: [{ id: 'a', text: 'Run' }, { id: 'b', text: 'Beautiful' }, { id: 'c', text: 'Table' }, { id: 'd', text: 'Quickly' }], correctAnswer: 'c', explanation: 'A noun names a person, place, or thing. "Table" is a thing.', difficulty: 'easy', topic: 'Parts of Speech' },
        { content: `What is the past tense of "go"?`, options: [{ id: 'a', text: 'Goed' }, { id: 'b', text: 'Going' }, { id: 'c', text: 'Went' }, { id: 'd', text: 'Gone' }], correctAnswer: 'c', explanation: 'The past tense of "go" is "went".', difficulty: 'medium', topic: 'Grammar' },
      ];
      const scienceQ = [
        { content: `Which is a source of light?`, options: [{ id: 'a', text: 'Moon' }, { id: 'b', text: 'Sun' }, { id: 'c', text: 'Mirror' }, { id: 'd', text: 'Book' }], correctAnswer: 'b', explanation: 'The Sun produces its own light.', difficulty: 'easy', topic: 'Energy' },
      ];

      const subjectPool: Record<string, any[]> = { Mathematics: [...easyMath, ...mediumMath, ...hardMath], English: englishQ, Science: scienceQ };
      subjects.forEach((subj) => {
        const pool = subjectPool[subj] || [{ content: `What is the capital of Kenya?`, options: [{ id: 'a', text: 'Mombasa' }, { id: 'b', text: 'Nairobi' }, { id: 'c', text: 'Kisumu' }, { id: 'd', text: 'Nakuru' }], correctAnswer: 'b', explanation: 'Nairobi is the capital city of Kenya.', difficulty: 'easy', topic: 'General Knowledge' }];
        pool.forEach((q: any, i: number) => {
          fallbacks.push({ id: `${subj.toLowerCase().slice(0, 3)}_q${i + 1}`, subjectId: subj, ...q });
        });
      });
      return fallbacks.slice(0, count);
    }

    let result;
    try {
      result = JSON.parse(response);
    } catch {
      result = { questions: getFallbackQuestions(grade, subjects || ['Mathematics', 'English', 'Science', 'Social Studies']) };
    }

    res.json({
      success: true,
      questions: result.questions || [],
      metadata: {
        grade,
        subjects,
        totalQuestions: (result.questions || []).length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Onboarding assessment generation error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate assessment questions',
    });
  }
});

// Generate learning recommendations
app.post('/api/recommendations', async (req: Request, res: Response) => {
  try {
    const { weakAreas, strongAreas, grade, learningGoals } = req.body;

    const systemMessage: ChatMessage = {
      role: 'system',
      content: `You are an educational advisor specialized in the Kenyan CBC curriculum.
        Provide personalized learning recommendations based on the student's performance data.`,
    };

    const userMessage: ChatMessage = {
      role: 'user',
      content: `Based on this student data, provide learning recommendations:\n\nGrade: ${grade}\nStrong Areas: ${strongAreas?.join(', ') || 'None identified'}\nWeak Areas: ${weakAreas?.join(', ') || 'None identified'}\nLearning Goals: ${learningGoals || 'General improvement'}\n\nProvide recommendations in JSON format: { "recommendations": [{ "type": "topic|skill|practice", "title": "...", "description": "...", "priority": "high|medium|low", "estimatedTime": "..." }], "studyPlan": [{ "week": 1, "focus": "...", "activities": [...] }] }`,
    };

    const response = await callOpenRouter([systemMessage, userMessage], 'anthropic/claude-3.5-sonnet');

    let recommendations;
    try {
      recommendations = JSON.parse(response);
    } catch {
      recommendations = { recommendations: [], studyPlan: [] };
    }

    res.json({
      success: true,
      recommendations,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate recommendations',
    });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`🤖 AI Service running on port ${PORT}`);
  console.log(`📡 OpenRouter configured: ${!!OPENROUTER_API_KEY && OPENROUTER_API_KEY !== 'placeholder_key'}`);
});

export default app;