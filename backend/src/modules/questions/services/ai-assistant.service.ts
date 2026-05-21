import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { QuotaEnforcerService } from '../../governance/services/quota-enforcer.service';
import { AICacheService } from '../../governance/services/ai-cache.service';
import { UsageTrackerService } from '../../governance/services/usage-tracker.service';
import { GovernanceServiceType, GovernanceTier } from '../../governance/entities/usage-log.entity';

export interface WordingEnhancement {
  original: string;
  enhanced: string;
  reasoning: string;
}

export interface GeneratedSolution {
  steps: string[];
  finalAnswer: string;
}

export interface CompetencyMapping {
  strand: string;
  subStrand: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  bloomTaxonomy: string;
}

export interface CurriculumSuggestion {
  strand: string;
  subStrand: string;
  learningOutcome: string;
  bloomsLevel: string;
  competencies: string[];
}

export interface VariationResult {
  content: string;
  options?: { id: string; text: string; isCorrect: boolean }[];
  correctAnswer?: string;
  explanation?: string;
  difficulty: string;
}

@Injectable()
export class AIAssistantService {
  private readonly logger = new Logger(AIAssistantService.name);
  private readonly openRouterApiKey: string;
  private readonly openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';

  private readonly fastModel = 'google/gemini-2.5-flash';
  private readonly mediumModel = 'google/gemini-2.5-flash';
  private readonly slowModel = 'google/gemini-2.5-pro';

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private quotaEnforcer: QuotaEnforcerService,
    private aiCache: AICacheService,
    private usageTracker: UsageTrackerService,
  ) {
    this.openRouterApiKey = this.configService.get<string>('OPENROUTER_API_KEY') || '';
  }

  private async checkAiQuota(userId: string, tier: GovernanceTier): Promise<void> {
    const { allowed } = await this.quotaEnforcer.checkAiQuota(userId, tier);
    if (!allowed) {
      throw new HttpException('AI quota exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private async recordUsage(userId: string): Promise<void> {
    await this.usageTracker.incrementUsage(userId, GovernanceServiceType.AI_EXPLANATION);
  }

  private async callOpenRouter(
    prompt: string,
    model: string = this.fastModel,
    systemMessage?: string,
    cacheKey?: string,
  ): Promise<any> {
    if (cacheKey) {
      const cached = await this.aiCache.get(cacheKey, prompt, model);
      if (cached) {
        this.logger.debug(`Cache hit for ${cacheKey}`);
        return cached;
      }
    }

    if (!this.openRouterApiKey) {
      this.logger.warn('No OPENROUTER_API_KEY found, returning dummy response');
      return this.dummyResponse(model);
    }

    const messages: { role: string; content: string }[] = [];
    if (systemMessage) {
      messages.push({ role: 'system', content: systemMessage });
    }
    messages.push({ role: 'user', content: prompt });

    try {
      const response = await this.httpService.axiosRef.post(
        this.openRouterUrl,
        {
          model,
          messages,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openRouterApiKey}`,
            'HTTP-Referer': 'https://adaptivecbc.co.ke',
            'X-Title': 'Adaptive Learning CBC',
            'Content-Type': 'application/json',
          },
          timeout: 20000,
        },
      );

      const content = response.data.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from AI');

      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch {
        const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
        parsed = JSON.parse(cleaned);
      }

      if (cacheKey) {
        await this.aiCache.set(cacheKey, prompt, parsed, model);
      }

      return parsed;
    } catch (error) {
      this.logger.error(`OpenRouter API call failed: ${error.message}`);
      throw new HttpException('Failed to communicate with AI provider', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  private dummyResponse(model: string): any {
    if (model === this.fastModel) {
      return {
        enhanced: 'Improved question text with clearer wording.',
        reasoning: 'Improved clarity for CBC students.',
        steps: ['Identify the key information.', 'Apply the correct formula.', 'Calculate the result.'],
        finalAnswer: 'The correct answer is determined by the steps above.',
        strand: 'Numbers',
        subStrand: 'Whole Numbers',
        topic: 'Number Operations',
        difficulty: 'medium',
        bloomTaxonomy: 'Understanding',
        learningOutcome: 'Learner should be able to solve number problems.',
        competencies: ['Critical Thinking', 'Communication'],
        content: 'Variation of the original question with new values.',
        options: [
          { id: 'a', text: 'Option A', isCorrect: false },
          { id: 'b', text: 'Option B', isCorrect: true },
          { id: 'c', text: 'Option C', isCorrect: false },
          { id: 'd', text: 'Option D', isCorrect: false },
        ],
        correctAnswer: 'Option B',
        explanation: 'Step-by-step reasoning for the answer.',
        hints: ['Start by identifying the key numbers.', 'Think about what operation to use.'],
        markingScheme: '1 mark for correct answer, 1 mark for showing working.',
      };
    }
    return {};
  }

  private getModelForTask(task: 'classification' | 'explanation' | 'generation'): string {
    if (task === 'classification') return this.fastModel;
    if (task === 'explanation') return this.mediumModel;
    return this.slowModel;
  }

  async enhanceQuestion(
    userId: string,
    content: string,
    options: string[],
    tier: GovernanceTier,
  ): Promise<WordingEnhancement> {
    await this.checkAiQuota(userId, tier);
    const model = this.getModelForTask('explanation');
    const prompt = `
      Please enhance the following multiple choice question for a CBC (Competency Based Curriculum) student.
      Original Question: "${content}"
      Options: ${JSON.stringify(options)}

      Provide a JSON object with:
      {
        "original": "${content}",
        "enhanced": "The improved, grammatically correct and clearly worded question",
        "reasoning": "Why this change makes it better for a student"
      }
    `;
    const result = await this.callOpenRouter(prompt, model, 'You are an expert CBC curriculum editor.', 'enhance');
    await this.recordUsage(userId);
    return result;
  }

  async simplifyLanguage(
    userId: string,
    questionText: string,
    targetGrade: number,
    tier: GovernanceTier,
  ): Promise<{ original: string; simplified: string; changedTerms: string[] }> {
    await this.checkAiQuota(userId, tier);
    const model = this.getModelForTask('explanation');
    const prompt = `
      Simplify the language of this question for a Grade ${targetGrade} CBC student.
      Original: "${questionText}"

      Provide a JSON object with:
      {
        "original": "${questionText}",
        "simplified": "Simplified version using grade-appropriate vocabulary",
        "changedTerms": ["list", "of", "difficult", "words", "replaced"]
      }
    `;
    const result = await this.callOpenRouter(prompt, model, 'You simplify educational content for grade-appropriate levels.', 'simplify');
    await this.recordUsage(userId);
    return result;
  }

  async alignWithCBC(
    userId: string,
    questionText: string,
    strand: string,
    tier: GovernanceTier,
  ): Promise<{ original: string; aligned: string; alignmentNotes: string }> {
    await this.checkAiQuota(userId, tier);
    const model = this.getModelForTask('explanation');
    const prompt = `
      Re-word this question to better align with the CBC strand "${strand}".
      Original: "${questionText}"

      Provide a JSON object with:
      {
        "original": "${questionText}",
        "aligned": "CBC-aligned version of the question",
        "alignmentNotes": "How this alignment improves the question"
      }
    `;
    const result = await this.callOpenRouter(prompt, model, 'You align questions with the Kenyan CBC curriculum.', 'cbc-align');
    await this.recordUsage(userId);
    return result;
  }

  async generateSolution(
    userId: string,
    question: string,
    options: string[],
    correctAnswer: string,
    tier: GovernanceTier,
  ): Promise<GeneratedSolution> {
    await this.checkAiQuota(userId, tier);
    const model = this.getModelForTask('explanation');
    const prompt = `
      Create a step-by-step solution for the following question.
      Question: "${question}"
      Options: ${JSON.stringify(options)}
      Correct Answer: "${correctAnswer}"

      Provide a JSON object with:
      {
        "steps": ["Step 1 explanation", "Step 2 explanation"],
        "finalAnswer": "A concluding statement confirming the correct answer"
      }
    `;
    const result = await this.callOpenRouter(prompt, model, 'You are a helpful teacher explaining a solution step-by-step.', 'solution');
    await this.recordUsage(userId);
    return result;
  }

  async generateExplanation(
    userId: string,
    question: string,
    correctAnswer: string,
    tier: GovernanceTier,
  ): Promise<string> {
    await this.checkAiQuota(userId, tier);
    const model = this.getModelForTask('explanation');
    const prompt = `
      Write a clear educational explanation for why this answer is correct.
      Question: "${question}"
      Correct Answer: "${correctAnswer}"

      Provide a JSON object with:
      {
        "explanation": "A detailed, educational explanation suitable for a student"
      }
    `;
    const result = await this.callOpenRouter(prompt, model, 'You explain answers clearly to students.', 'explanation');
    await this.recordUsage(userId);
    return result.explanation || result.enhanced || '';
  }

  async generateMarkingScheme(
    userId: string,
    question: string,
    correctAnswer: string,
    marks: number,
    tier: GovernanceTier,
  ): Promise<string> {
    await this.checkAiQuota(userId, tier);
    const model = this.getModelForTask('generation');
    const prompt = `
      Create a marking scheme for this ${marks}-mark question.
      Question: "${question}"
      Correct Answer: "${correctAnswer}"

      Provide a JSON object with:
      {
        "markingScheme": "Detailed marking scheme showing how marks are allocated"
      }
    `;
    const result = await this.callOpenRouter(prompt, model, 'You create fair, detailed marking schemes.', 'marking-scheme');
    await this.recordUsage(userId);
    return result.markingScheme || '';
  }

  async generateHints(
    userId: string,
    question: string,
    correctAnswer: string,
    count: number,
    tier: GovernanceTier,
  ): Promise<string[]> {
    await this.checkAiQuota(userId, tier);
    const model = this.getModelForTask('explanation');
    const prompt = `
      Generate ${count} progressive hints for the following question. Each hint should be more revealing.
      Question: "${question}"
      Correct Answer: "${correctAnswer}"

      Provide a JSON object with:
      {
        "hints": ["Hint 1 (subtle nudge)", "Hint 2 (more direct)", "Hint 3 (almost revealing the answer)"]
      }
    `;
    const result = await this.callOpenRouter(prompt, model, 'You create helpful, progressive hints for students.', 'hints');
    await this.recordUsage(userId);
    return result.hints || [];
  }

  async suggestCurriculum(
    userId: string,
    questionText: string,
    subject: string,
    grade: number,
    tier: GovernanceTier,
  ): Promise<CurriculumSuggestion> {
    await this.checkAiQuota(userId, tier);
    const model = this.getModelForTask('classification');
    const prompt = `
      Map this question to the Kenyan CBC curriculum.
      Question: "${questionText}"
      Subject: "${subject}"
      Grade: ${grade}

      Provide a JSON object with:
      {
        "strand": "Main curriculum strand",
        "subStrand": "Specific sub-strand",
        "learningOutcome": "Expected learning outcome",
        "bloomsLevel": "Remembering, Understanding, Applying, Analyzing, Evaluating, or Creating",
        "competencies": ["Relevant CBC core competency 1", "Relevant CBC core competency 2"]
      }
    `;
    const result = await this.callOpenRouter(prompt, model, 'You are an expert in Kenyan CBC curriculum mapping.', 'curriculum-suggest');
    await this.recordUsage(userId);

    const competencyMap: Record<string, string[]> = {
      remembering: ['Communication'],
      understanding: ['Communication', 'Critical Thinking'],
      applying: ['Critical Thinking', 'Creativity & Imagination'],
      analyzing: ['Critical Thinking', 'Problem Solving'],
      evaluating: ['Critical Thinking', 'Problem Solving', 'Communication'],
      creating: ['Creativity & Imagination', 'Critical Thinking', 'Problem Solving'],
    };

    const level = (result.bloomsLevel || '').toLowerCase();
    const defaultCompetencies = competencyMap[level] || ['Critical Thinking', 'Communication'];

    return {
      strand: result.strand || '',
      subStrand: result.subStrand || '',
      learningOutcome: result.learningOutcome || '',
      bloomsLevel: result.bloomsLevel || '',
      competencies: result.competencies || defaultCompetencies,
    };
  }

  async generateVariation(
    userId: string,
    question: {
      content: string;
      type: string;
      options?: { id: string; text: string; isCorrect: boolean }[];
      correctAnswer?: string;
      explanation?: string;
      difficulty: string;
      marks: number;
    },
    difficultyShift: 'easier' | 'harder' | 'same',
    tier: GovernanceTier,
  ): Promise<VariationResult> {
    await this.checkAiQuota(userId, tier);
    const model = this.getModelForTask('generation');
    const prompt = `
      Create a ${difficultyShift === 'same' ? 'similar' : difficultyShift} variation of this ${question.type} question.
      Original Question: "${question.content}"
      Options: ${JSON.stringify(question.options || [])}
      Correct Answer: "${question.correctAnswer}"
      Current Difficulty: "${question.difficulty}"

      Provide a JSON object with:
      {
        "content": "The new question variation",
        "options": [{"id": "a", "text": "Option text", "isCorrect": false}],
        "correctAnswer": "The correct answer text",
        "explanation": "Explanation for the new answer",
        "difficulty": "${difficultyShift === 'same' ? question.difficulty : difficultyShift === 'easier' ? 'easy' : 'hard'}"
      }
    `;
    const result = await this.callOpenRouter(prompt, model, 'You create variations of educational questions.', 'variation');
    await this.recordUsage(userId);

    return {
      content: result.content || question.content,
      options: result.options || question.options,
      correctAnswer: result.correctAnswer || question.correctAnswer,
      explanation: result.explanation || question.explanation,
      difficulty: result.difficulty || question.difficulty,
    };
  }

  async generateRandomizedValues(
    userId: string,
    question: {
      content: string;
      type: string;
      options?: { id: string; text: string; isCorrect: boolean }[];
      correctAnswer?: string;
    },
    tier: GovernanceTier,
  ): Promise<Partial<VariationResult>> {
    await this.checkAiQuota(userId, tier);
    const model = this.getModelForTask('generation');
    const prompt = `
      Replace numerical values in this question with new random values while keeping the same structure and difficulty.
      Original Question: "${question.content}"
      Options: ${JSON.stringify(question.options || [])}
      Correct Answer: "${question.correctAnswer}"

      Provide a JSON object with:
      {
        "content": "Question with new numerical values",
        "options": [{"id": "a", "text": "Option with new value", "isCorrect": false}],
        "correctAnswer": "New correct answer",
        "explanation": "Explanation with new values"
      }
    `;
    const result = await this.callOpenRouter(prompt, model, 'You generate new numerical variants of questions.', 'randomize');
    await this.recordUsage(userId);

    return {
      content: result.content || question.content,
      options: result.options || question.options,
      correctAnswer: result.correctAnswer || question.correctAnswer,
      explanation: result.explanation || undefined,
    };
  }

  async mapCompetency(
    userId: string,
    question: string,
    grade: number,
    subject: string,
    tier: GovernanceTier,
  ): Promise<CompetencyMapping> {
    await this.checkAiQuota(userId, tier);
    const model = this.getModelForTask('classification');
    const prompt = `
      Map the following question to the Kenyan CBC (Competency Based Curriculum).
      Question: "${question}"
      Grade: ${grade}
      Subject: "${subject}"

      Provide a JSON object with:
      {
        "strand": "The main curriculum strand",
        "subStrand": "The specific sub-strand",
        "topic": "The general topic area",
        "difficulty": "easy, medium, or hard",
        "bloomTaxonomy": "Remembering, Understanding, Applying, Analyzing, Evaluating, or Creating"
      }
    `;
    const result = await this.callOpenRouter(prompt, model, 'You are an expert in the Kenyan CBC curriculum mapping.', 'competency-map');
    await this.recordUsage(userId);
    return result;
  }
}
