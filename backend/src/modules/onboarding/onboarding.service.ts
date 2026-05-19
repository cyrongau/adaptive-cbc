import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { OnboardingSession, OnboardingQuestion, OnboardingStep, AssessmentStatus } from './entities/onboarding.entity';
import { UsersService } from '../users/users.service';

const SUBJECTS_BY_GRADE: Record<number, string[]> = {
  1: ['Mathematics', 'English', 'Kiswahili', 'Environmental Activities'],
  2: ['Mathematics', 'English', 'Kiswahili', 'Environmental Activities'],
  3: ['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies'],
  4: ['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies'],
  5: ['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies'],
  6: ['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies', 'Creative Arts'],
  7: ['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies', 'Creative Arts'],
  8: ['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies', 'Creative Arts'],
  9: ['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies', 'Creative Arts', 'Agriculture'],
};

const STATIC_QUESTIONS: Record<string, any[]> = {
  Mathematics: [
    { content: 'What is 5 + 3?', options: [{ id: 'a', text: '7' }, { id: 'b', text: '8' }, { id: 'c', text: '9' }, { id: 'd', text: '10' }], correctAnswer: 'b', explanation: '5 + 3 = 8', difficulty: 'easy', topic: 'Addition' },
    { content: 'If you have 12 apples and eat 4, how many remain?', options: [{ id: 'a', text: '6' }, { id: 'b', text: '7' }, { id: 'c', text: '8' }, { id: 'd', text: '9' }], correctAnswer: 'c', explanation: '12 - 4 = 8', difficulty: 'easy', topic: 'Subtraction' },
    { content: 'What is 3/4 as a decimal?', options: [{ id: 'a', text: '0.25' }, { id: 'b', text: '0.5' }, { id: 'c', text: '0.75' }, { id: 'd', text: '0.8' }], correctAnswer: 'c', explanation: '3/4 = 0.75', difficulty: 'medium', topic: 'Fractions' },
    { content: 'Solve: x + 7 = 15', options: [{ id: 'a', text: 'x = 7' }, { id: 'b', text: 'x = 8' }, { id: 'c', text: 'x = 15' }, { id: 'd', text: 'x = 22' }], correctAnswer: 'b', explanation: 'x = 15 - 7 = 8', difficulty: 'medium', topic: 'Algebra' },
    { content: 'What is the area of a rectangle with length 8cm and width 5cm?', options: [{ id: 'a', text: '13 cm²' }, { id: 'b', text: '26 cm²' }, { id: 'c', text: '40 cm²' }, { id: 'd', text: '45 cm²' }], correctAnswer: 'c', explanation: 'Area = length × width = 8 × 5 = 40 cm²', difficulty: 'hard', topic: 'Measurement' },
    { content: 'What is 2/3 of 18?', options: [{ id: 'a', text: '6' }, { id: 'b', text: '9' }, { id: 'c', text: '12' }, { id: 'd', text: '15' }], correctAnswer: 'c', explanation: '2/3 × 18 = 12', difficulty: 'medium', topic: 'Fractions' },
    { content: 'Round 4.67 to the nearest whole number', options: [{ id: 'a', text: '4' }, { id: 'b', text: '4.5' }, { id: 'c', text: '5' }, { id: 'd', text: '6' }], correctAnswer: 'c', explanation: '4.67 rounds up to 5 because the tenths digit is 6 ≥ 5', difficulty: 'hard', topic: 'Decimals' },
  ],
  English: [
    { content: 'Which word is a noun?', options: [{ id: 'a', text: 'Run' }, { id: 'b', text: 'Beautiful' }, { id: 'c', text: 'Table' }, { id: 'd', text: 'Quickly' }], correctAnswer: 'c', explanation: 'A noun names a person, place, or thing. "Table" is a thing.', difficulty: 'easy', topic: 'Parts of Speech' },
    { content: 'What is the past tense of "go"?', options: [{ id: 'a', text: 'Goed' }, { id: 'b', text: 'Going' }, { id: 'c', text: 'Went' }, { id: 'd', text: 'Gone' }], correctAnswer: 'c', explanation: 'The past tense of "go" is "went".', difficulty: 'medium', topic: 'Grammar' },
    { content: 'Choose the correct sentence:', options: [{ id: 'a', text: 'She don\'t like apples' }, { id: 'b', text: 'She doesn\'t like apples' }, { id: 'c', text: 'She not like apples' }, { id: 'd', text: 'She no like apples' }], correctAnswer: 'b', explanation: 'With third person singular (she/he/it), we use "doesn\'t".', difficulty: 'easy', topic: 'Grammar' },
    { content: 'What does "generous" mean?', options: [{ id: 'a', text: 'Selfish' }, { id: 'b', text: 'Willing to give and share' }, { id: 'c', text: 'Angry' }, { id: 'd', text: 'Shy' }], correctAnswer: 'b', explanation: 'A generous person is willing to give and share freely.', difficulty: 'medium', topic: 'Vocabulary' },
    { content: 'Identify the simile: "Her smile was as bright as the sun"', options: [{ id: 'a', text: 'Metaphor' }, { id: 'b', text: 'Simile' }, { id: 'c', text: 'Personification' }, { id: 'd', text: 'Alliteration' }], correctAnswer: 'b', explanation: 'A simile uses "like" or "as" to compare two things.', difficulty: 'medium', topic: 'Literary Devices' },
  ],
  Science: [
    { content: 'Which is a source of light?', options: [{ id: 'a', text: 'Moon' }, { id: 'b', text: 'Sun' }, { id: 'c', text: 'Mirror' }, { id: 'd', text: 'Book' }], correctAnswer: 'b', explanation: 'The Sun produces its own light.', difficulty: 'easy', topic: 'Energy' },
    { content: 'What do plants need for photosynthesis?', options: [{ id: 'a', text: 'Water only' }, { id: 'b', text: 'Sunlight, water, and carbon dioxide' }, { id: 'c', text: 'Soil and air' }, { id: 'd', text: 'Fertilizer only' }], correctAnswer: 'b', explanation: 'Plants need sunlight, water, and carbon dioxide to make food through photosynthesis.', difficulty: 'medium', topic: 'Plants' },
    { content: 'Which sense organ detects sound?', options: [{ id: 'a', text: 'Eye' }, { id: 'b', text: 'Ear' }, { id: 'c', text: 'Nose' }, { id: 'd', text: 'Skin' }], correctAnswer: 'b', explanation: 'The ear is the sense organ for hearing sound.', difficulty: 'easy', topic: 'Human Body' },
    { content: 'What is the boiling point of water?', options: [{ id: 'a', text: '50°C' }, { id: 'b', text: '100°C' }, { id: 'c', text: '150°C' }, { id: 'd', text: '0°C' }], correctAnswer: 'b', explanation: 'Water boils at 100°C at sea level.', difficulty: 'medium', topic: 'Matter' },
  ],
  Kiswahili: [
    { content: '"Mbao" ni neno la ngeli gani?', options: [{ id: 'a', text: 'I-I' }, { id: 'b', text: 'U-I' }, { id: 'c', text: 'LI-YA' }, { id: 'd', text: 'A-WA' }], correctAnswer: 'c', explanation: 'Mbao iko katika ngeli ya LI-YA.', difficulty: 'medium', topic: 'Ngeli' },
    { content: 'Tafsiri: "How are you?"', options: [{ id: 'a', text: 'Unaitwa nani?' }, { id: 'b', text: 'Unafanya nini?' }, { id: 'c', text: 'Habari yako?' }, { id: 'd', text: 'Unatoka wapi?' }], correctAnswer: 'c', explanation: '"Habari yako" means "How are you?"', difficulty: 'easy', topic: 'Msamiati' },
  ],
  'Social Studies': [
    { content: 'What is the capital of Kenya?', options: [{ id: 'a', text: 'Mombasa' }, { id: 'b', text: 'Nairobi' }, { id: 'c', text: 'Kisumu' }, { id: 'd', text: 'Nakuru' }], correctAnswer: 'b', explanation: 'Nairobi is the capital city of Kenya.', difficulty: 'easy', topic: 'Geography' },
    { content: 'Which document contains the laws of Kenya?', options: [{ id: 'a', text: 'The Bible' }, { id: 'b', text: 'The Constitution' }, { id: 'c', text: 'The flag' }, { id: 'd', text: 'The national anthem' }], correctAnswer: 'b', explanation: 'The Constitution of Kenya contains the supreme laws of the land.', difficulty: 'medium', topic: 'Governance' },
  ],
  'Creative Arts': [
    { content: 'Which colors are primary?', options: [{ id: 'a', text: 'Red, blue, yellow' }, { id: 'b', text: 'Green, orange, purple' }, { id: 'c', text: 'Black, white, grey' }, { id: 'd', text: 'Red, white, blue' }], correctAnswer: 'a', explanation: 'Red, blue, and yellow are primary colors that cannot be made by mixing.', difficulty: 'easy', topic: 'Art' },
  ],
  Agriculture: [
    { content: 'What is crop rotation?', options: [{ id: 'a', text: 'Planting the same crop every year' }, { id: 'b', text: 'Growing different crops in a planned sequence' }, { id: 'c', text: 'Watering crops daily' }, { id: 'd', text: 'Harvesting all at once' }], correctAnswer: 'b', explanation: 'Crop rotation means growing different types of crops in a planned sequence to maintain soil fertility.', difficulty: 'medium', topic: 'Farming' },
  ],
};

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(OnboardingSession)
    private sessionRepository: Repository<OnboardingSession>,
    @InjectRepository(OnboardingQuestion)
    private questionsRepository: Repository<OnboardingQuestion>,
    private usersService: UsersService,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async createSession(userId: string): Promise<OnboardingSession> {
    let session = await this.sessionRepository.findOne({ where: { userId } });
    if (session) {
      return session;
    }

    session = this.sessionRepository.create({
      userId,
      currentStep: OnboardingStep.PERSONAL_INFO,
      assessmentStatus: AssessmentStatus.NOT_STARTED,
      currentQuestionIndex: 0,
    });

    return this.sessionRepository.save(session);
  }

  async getSession(userId: string): Promise<OnboardingSession> {
    let session = await this.sessionRepository.findOne({ where: { userId } });
    if (!session) {
      session = await this.createSession(userId);
    }
    return session;
  }

  async updatePersonalInfo(userId: string, data: {
    grade: number;
    term: number;
    stream?: string;
    dateOfBirth?: Date;
    parentName?: string;
    parentContact?: string;
  }): Promise<OnboardingSession> {
    const session = await this.getSession(userId);
    session.personalInfo = data;
    session.currentStep = OnboardingStep.GRADE_SELECTION;

    await this.usersService.update(userId, {
      grade: data.grade,
      term: data.term,
      stream: data.stream,
    });

    return this.sessionRepository.save(session);
  }

  async getBaselineQuestions(subjectId: string, grade: number): Promise<OnboardingQuestion[]> {
    return this.questionsRepository.find({
      where: { subjectId, grade, isActive: true },
      take: 10,
      order: { createdAt: 'ASC' },
    });
  }

  async generateAIAssessmentQuestions(userId: string): Promise<any[]> {
    const session = await this.getSession(userId);
    const grade = session.personalInfo?.grade || 1;
    const subjects = SUBJECTS_BY_GRADE[grade] || ['Mathematics', 'English', 'Science'];

    const aiServiceUrl = this.configService.get('AI_SERVICE_URL', 'http://ai-service:8002');

    try {
      const response = await this.httpService.axiosRef.post(
        `${aiServiceUrl}/api/onboarding/assessment/generate`,
        { grade, subjects, count: 10 },
        { timeout: 30000 },
      );

      if (response.data?.success && response.data?.questions?.length > 0) {
        session.generatedQuestions = response.data.questions.map((q: any, i: number) => ({
          ...q,
          id: q.id || `ai_q_${i + 1}`,
        }));
        session.currentQuestionIndex = 0;
        await this.sessionRepository.save(session);
        return session.generatedQuestions;
      }
    } catch (error) {
      console.warn('AI service unavailable, using static questions:', error.message);
    }

    const staticQs: any[] = [];
    let id = 0;
    for (const subject of subjects) {
      const pool = STATIC_QUESTIONS[subject];
      if (pool) {
        for (const q of pool) {
          staticQs.push({ id: `q_${++id}`, subjectId: subject, ...q });
        }
      }
    }

    const shuffled = staticQs.sort(() => Math.random() - 0.5).slice(0, 10);
    session.generatedQuestions = shuffled;
    session.currentQuestionIndex = 0;
    await this.sessionRepository.save(session);
    return shuffled;
  }

  async startAssessment(userId: string): Promise<OnboardingSession> {
    const session = await this.getSession(userId);
    session.assessmentStatus = AssessmentStatus.IN_PROGRESS;
    session.currentStep = OnboardingStep.BASELINE_ASSESSMENT;
    session.assessmentResults = [];
    session.generatedQuestions = [];
    session.currentQuestionIndex = 0;
    return this.sessionRepository.save(session);
  }

  async getCurrentQuestion(userId: string): Promise<{ question: any | null; total: number; currentIndex: number; progress: number }> {
    const session = await this.getSession(userId);

    if (!session.generatedQuestions || session.generatedQuestions.length === 0) {
      await this.generateAIAssessmentQuestions(userId);
    }

    const refreshed = await this.getSession(userId);
    const questions = refreshed.generatedQuestions || [];
    const index = refreshed.currentQuestionIndex || 0;

    if (index >= questions.length) {
      return { question: null, total: questions.length, currentIndex: index, progress: 100 };
    }

    const q = questions[index];
    return {
      question: {
        id: q.id,
        subjectId: q.subjectId,
        content: q.content,
        options: q.options,
        difficulty: q.difficulty,
        topic: q.topic,
      },
      total: questions.length,
      currentIndex: index,
      progress: Math.round((index / questions.length) * 100),
    };
  }

  async submitAnswer(userId: string, answer: {
    subjectId: string;
    questionId: string;
    answer: string;
    timeSpent: number;
  }): Promise<{ nextQuestion: any | null; total: number; currentIndex: number; progress: number; isComplete: boolean }> {
    const session = await this.getSession(userId);

    if (session.assessmentStatus !== AssessmentStatus.IN_PROGRESS) {
      throw new BadRequestException('Assessment not started');
    }

    const question = session.generatedQuestions?.find(q => q.id === answer.questionId);
    const isCorrect = question ? question.correctAnswer === answer.answer : false;

    const result = {
      subjectId: answer.subjectId,
      questionId: answer.questionId,
      answer: answer.answer,
      isCorrect,
      timeSpent: answer.timeSpent,
    };

    session.assessmentResults = [...(session.assessmentResults || []), result];

    const nextIndex = session.currentQuestionIndex + 1;
    session.currentQuestionIndex = nextIndex;

    await this.sessionRepository.save(session);

    const total = session.generatedQuestions?.length || 0;
    const isComplete = nextIndex >= total;

    if (isComplete) {
      return { nextQuestion: null, total, currentIndex: nextIndex, progress: 100, isComplete: true };
    }

    const nextQ = session.generatedQuestions[nextIndex];
    return {
      nextQuestion: {
        id: nextQ.id,
        subjectId: nextQ.subjectId,
        content: nextQ.content,
        options: nextQ.options,
        difficulty: nextQ.difficulty,
        topic: nextQ.topic,
      },
      total,
      currentIndex: nextIndex,
      progress: Math.round((nextIndex / total) * 100),
      isComplete: false,
    };
  }

  async completeAssessment(userId: string): Promise<OnboardingSession> {
    const session = await this.getSession(userId);

    if (!session.assessmentResults || session.assessmentResults.length === 0) {
      throw new BadRequestException('No assessment results to submit');
    }

    session.assessmentStatus = AssessmentStatus.COMPLETED;
    session.currentStep = OnboardingStep.SUBJECT_PREFERENCES;

    session.baselineCompetency = this.calculateBaselineCompetency(session.assessmentResults, session.generatedQuestions);

    session.adaptiveSettings = this.generateAdaptiveSettings(session.baselineCompetency);

    await this.sessionRepository.save(session);

    try {
      await this.generateAIRecommendations(userId, session.baselineCompetency, session.personalInfo?.grade || 1);
    } catch (e) {
      console.warn('AI recommendations generation failed:', e.message);
    }

    return session;
  }

  private calculateBaselineCompetency(results: any[], questions: any[]): any[] {
    const subjectResults = new Map<string, { correct: number; total: number; weakAreas: string[]; questions: any[] }>();

    results.forEach((result) => {
      if (!subjectResults.has(result.subjectId)) {
        subjectResults.set(result.subjectId, { correct: 0, total: 0, weakAreas: [], questions: [] });
      }
      const subject = subjectResults.get(result.subjectId)!;
      subject.total += 1;
      if (result.isCorrect) {
        subject.correct += 1;
      }
      const question = questions?.find(q => q.id === result.questionId);
      if (question) {
        subject.questions.push({ ...question, userCorrect: result.isCorrect });
      }
    });

    const competencies: any[] = [];
    subjectResults.forEach((value, subjectId) => {
      const pct = (value.correct / value.total) * 100;

      const weakAreas: string[] = [];
      value.questions.forEach(q => {
        if (!q.userCorrect) {
          weakAreas.push(q.topic || q.content.slice(0, 50));
        }
      });

      let level: string;
      let recommendations: string[];
      if (pct >= 80) {
        level = 'advanced';
        recommendations = ['Progress to advanced topics', 'Challenge with harder questions', 'Explore cross-curricular applications'];
      } else if (pct >= 50) {
        level = 'intermediate';
        recommendations = ['Reinforce foundational concepts', 'Practice intermediate exercises', 'Focus on weak topics identified'];
      } else {
        level = 'beginner';
        recommendations = ['Start with foundational lessons', 'Practice basic exercises daily', 'Use visual aids and hands-on learning'];
      }

      competencies.push({
        subjectId,
        competencyLevel: Math.round(pct),
        level,
        weakAreas: [...new Set(weakAreas)],
        recommendations,
        totalQuestions: value.total,
        correctAnswers: value.correct,
      });
    });

    return competencies;
  }

  private generateAdaptiveSettings(competencies: any[]): any {
    const avgLevel = competencies.reduce((sum, c) => sum + c.competencyLevel, 0) / competencies.length;

    return {
      difficultyPreference: avgLevel >= 70 ? 'advanced' : avgLevel >= 40 ? 'intermediate' : 'beginner',
      pacePreference: avgLevel >= 70 ? 'fast' : avgLevel >= 40 ? 'moderate' : 'slow',
      sessionDuration: avgLevel >= 70 ? 45 : avgLevel >= 40 ? 30 : 20,
      preferredTimeOfDay: 'morning',
      overallCompetency: Math.round(avgLevel),
    };
  }

  private async generateAIRecommendations(userId: string, competencies: any[], grade: number): Promise<void> {
    const aiServiceUrl = this.configService.get('AI_SERVICE_URL', 'http://ai-service:8002');

    const weakAreas = competencies.filter(c => c.competencyLevel < 60).map(c => c.subjectId);
    const strongAreas = competencies.filter(c => c.competencyLevel >= 70).map(c => c.subjectId);

    try {
      const response = await this.httpService.axiosRef.post(
        `${aiServiceUrl}/api/recommendations`,
        { weakAreas, strongAreas, grade, learningGoals: 'Improve overall CBC competency' },
        { timeout: 15000 },
      );

      if (response.data?.success) {
        const session = await this.getSession(userId);
        (session as any).aiRecommendations = response.data.recommendations;
        await this.sessionRepository.save(session);
      }
    } catch (e) {
      console.warn('AI recommendations unavailable:', e.message);
    }
  }

  async updateSubjectPreferences(userId: string, preferences: {
    subjectId: string;
    interestLevel: number;
    currentLevel: string;
  }[]): Promise<OnboardingSession> {
    const session = await this.getSession(userId);
    session.subjectPreferences = preferences;
    session.currentStep = OnboardingStep.LEARNING_GOALS;
    return this.sessionRepository.save(session);
  }

  async updateLearningGoals(userId: string, goals: {
    goalType: string;
    targetDate: Date;
    description: string;
  }[]): Promise<OnboardingSession> {
    const session = await this.getSession(userId);
    session.learningGoals = goals;
    session.currentStep = OnboardingStep.COMPLETED;

    await this.usersService.update(userId, { onboardingStatus: 'completed' as any });

    return this.sessionRepository.save(session);
  }

  async completeOnboarding(userId: string): Promise<OnboardingSession> {
    const session = await this.getSession(userId);
    session.currentStep = OnboardingStep.COMPLETED;

    await this.usersService.update(userId, { onboardingStatus: 'completed' as any });

    return this.sessionRepository.save(session);
  }

  async getBaselineCompetency(userId: string): Promise<any[]> {
    const session = await this.getSession(userId);
    return session.baselineCompetency || [];
  }
}
