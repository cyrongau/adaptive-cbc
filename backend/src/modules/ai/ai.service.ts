import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AiService {
  constructor(private readonly configService: ConfigService) {}

  async getSocraticResponse(messages: { role: string; content: string }[]): Promise<string> {
    const aiServiceUrl = this.configService.get('AI_SERVICE_URL', 'http://localhost:8002');
    try {
      const response = await axios.post(`${aiServiceUrl}/api/tutor/chat`, {
        messages,
      });
      return response.data.response;
    } catch (error: any) {
      console.error('Error in AiService getSocraticResponse:', error.message);
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
}
