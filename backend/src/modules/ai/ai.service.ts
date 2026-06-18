import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AiService {
  constructor(private readonly configService: ConfigService) {}

  async getSocraticResponse(messages: { role: string; content: string }[]): Promise<string> {
    const apiKey = this.configService.get('OPENROUTER_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('OpenRouter API key not configured');
    }

    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'meta-llama/llama-3.1-8b-instruct:free',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful, Socratic AI tutor. Guide the student to the answer using questions and hints rather than giving the direct answer. Be encouraging and concise.',
            },
            ...messages,
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Adaptive CBC Platform',
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error: any) {
      console.error('Error in AiService getSocraticResponse:', error.response?.data || error.message);
      throw new InternalServerErrorException('Failed to communicate with AI Service');
    }
  }

  async generateAdaptiveGame(
    subject: string,
    topic: string,
    grade: number,
    masteryLevel: string
  ): Promise<any> {
    const apiKey = this.configService.get('OPENROUTER_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('OpenRouter API key not configured');
    }

    let difficultyContext = 'balanced difficulty';
    if (masteryLevel === 'low') {
      difficultyContext = 'very easy, encouraging, and confidence-building';
    } else if (masteryLevel === 'high') {
      difficultyContext = 'challenging "boss fight" level difficulty to test their mastery';
    }

    const systemPrompt = `You are an expert Gamification AI for an adaptive learning platform.
Your job is to generate a short, fun mini-game for a Grade ${grade} student studying ${subject} (Specifically: ${topic}).
The game should have a ${difficultyContext}.

Return ONLY a raw JSON object (no markdown formatting, no code blocks) matching this schema:
{
  "type": "trivia" | "fill_in_the_blank" | "word_scramble",
  "title": "A fun title for the game",
  "questions": [
    {
      "question": "The question text",
      "options": ["A", "B", "C", "D"], // Only if type is trivia
      "correctAnswer": "The correct answer",
      "explanation": "A fun explanation when they get it right"
    }
  ] // Generate 3 questions
}`;

    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'google/gemma-4-31b-it:free',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Generate the game now.' }
          ],
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const content = response.data.choices[0].message.content;
      // Clean up markdown if the AI mistakenly includes it
      const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonString);
    } catch (error: any) {
      console.error('Error generating game:', error.message);
      throw new InternalServerErrorException('Failed to generate adaptive game');
    }
  }

  async generateAssignmentQuestions(
    subject: string,
    grade: number,
    strand: string,
    subStrand: string,
    count: number
  ): Promise<any[]> {
    const apiKey = this.configService.get('OPENROUTER_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('OpenRouter API key not configured');
    }

    const systemPrompt = `You are an expert curriculum developer for an adaptive learning platform.
Your job is to generate exactly ${count} questions for Grade ${grade} students in ${subject}.
The questions must specifically target the strand: "${strand}" and sub-strand: "${subStrand}".
Mix multiple choice, true/false, and short answer types.

Return ONLY a raw JSON array (no markdown formatting, no code blocks) matching this schema for each question:
[
  {
    "content": "The question text",
    "type": "multiple_choice" | "true_false" | "short_answer",
    "difficulty": "medium",
    "marks": 2,
    "options": [ // Only required if type is multiple_choice or true_false
      { "text": "Option text", "isCorrect": true }
    ],
    "correctAnswer": "Text answer if type is short_answer",
    "explanation": "Explanation of why the correct answer is correct."
  }
]`;

    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'google/gemma-4-31b-it:free',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Generate the ${count} questions now.` }
          ],
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const content = response.data.choices[0].message.content;
      const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonString);
    } catch (error: any) {
      console.error('Error generating questions:', error.message);
      throw new InternalServerErrorException('Failed to generate assignment questions via AI');
    }
  }
}
