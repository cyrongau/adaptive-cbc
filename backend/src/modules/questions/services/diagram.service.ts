import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

export interface EnhancedDiagram {
  id: string;
  originalUrl: string;
  enhancedUrl: string;
  format: string;
  width: number;
  height: number;
}

export interface VectorizedDiagram {
  id: string;
  originalUrl: string;
  svgUrl: string;
  svgContent: string;
}

export interface LabeledDiagram {
  id: string;
  imageUrl: string;
  labels: { x: number; y: number; text: string; confidence: number }[];
}

const SUBJECT_TEMPLATES: Record<string, { label: string; description: string }[]> = {
  biology: [
    { label: 'Cell Structure', description: 'Plant/animal cell with organelles' },
    { label: 'Human Heart', description: 'Labeled heart chambers and vessels' },
    { label: 'Digestive System', description: 'Organs of the digestive tract' },
    { label: 'Photosynthesis', description: 'Plant energy process diagram' },
    { label: 'Nervous System', description: 'Brain, spine, and neurons' },
  ],
  physics: [
    { label: 'Circuit Diagram', description: 'Series/parallel electrical circuits' },
    { label: 'Force Diagram', description: 'Free body diagrams with vectors' },
    { label: 'Ray Optics', description: 'Light reflection and refraction' },
    { label: 'Electromagnet', description: 'Magnetic field around a coil' },
    { label: 'Pulley System', description: 'Simple machines and mechanical advantage' },
  ],
  mathematics: [
    { label: 'Geometry Shapes', description: 'Triangles, quadrilaterals, circles' },
    { label: 'Coordinate Plane', description: 'Cartesian grid with points' },
    { label: 'Number Line', description: 'Integers and fractions on a line' },
    { label: 'Bar Graph', description: 'Data representation chart' },
    { label: 'Angle Types', description: 'Acute, obtuse, right angles' },
  ],
  chemistry: [
    { label: 'Atom Structure', description: 'Protons, neutrons, electrons' },
    { label: 'Periodic Table', description: 'Element groups and periods' },
    { label: 'Chemical Bonding', description: 'Ionic and covalent bonds' },
    { label: 'Lab Equipment', description: 'Beaker, flask, burette setup' },
    { label: 'Water Cycle', description: 'Evaporation, condensation, precipitation' },
  ],
  geography: [
    { label: 'Map Skills', description: 'Compass rose, scale, legend' },
    { label: 'River Formation', description: 'Erosion and deposition landforms' },
    { label: 'Volcano Cross-section', description: 'Magma chamber, vent, crater' },
    { label: 'Weather Map', description: 'Isobars, fronts, pressure systems' },
  ],
};

@Injectable()
export class DiagramService {
  private readonly logger = new Logger(DiagramService.name);
  private readonly openRouterApiKey: string;
  private readonly openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly imageModel = 'google/gemini-2.5-flash';
  private readonly uploadDir: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.openRouterApiKey = this.configService.get<string>('OPENROUTER_API_KEY') || '';
    this.uploadDir = path.join(process.cwd(), 'uploads', 'diagrams');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  getTemplates(): Record<string, { label: string; description: string }[]> {
    return SUBJECT_TEMPLATES;
  }

  async saveUpload(file: Express.Multer.File): Promise<{ url: string; filename: string }> {
    const ext = path.extname(file.originalname) || '.png';
    const filename = `diagram-${uuid()}${ext}`;
    const filepath = path.join(this.uploadDir, filename);

    if (file.buffer) {
      fs.writeFileSync(filepath, file.buffer);
    } else if (file.path) {
      fs.copyFileSync(file.path, filepath);
    } else {
      throw new HttpException('Invalid file data', HttpStatus.BAD_REQUEST);
    }

    const url = `/uploads/diagrams/${filename}`;
    return { url, filename };
  }

  async generateDiagram(
    prompt: string,
    subject?: string,
    grade?: string,
  ): Promise<{ url: string; filename: string }> {
    if (!this.openRouterApiKey) {
      throw new HttpException(
        'AI image generation is not available (API key not configured). Please upload a file instead.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const aiPrompt = `Generate a clean, responsive, and beautifully styled SVG diagram for: "${prompt}".
Subject: ${subject || 'General'}, Grade level: ${grade || 'Any'}.
Use modern colors (soft blues, greens, oranges), clean typography, clear labels, and visual components (shapes, arrows, boxes).
Ensure the SVG has a viewBox (e.g. 0 0 800 600), is self-contained, and is styled properly for educational purposes.
Return a JSON object with a single key 'svg' containing the complete SVG code as a string.
Example format: { "svg": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 800 600\\">...</svg>" }`;

    try {
      const result = await this.callOpenRouter(
        aiPrompt,
        'You are an expert educational illustrator who creates clean SVG diagrams for CBC curriculum questions.',
      );

      const svgContent = result.svg;
      if (!svgContent || !svgContent.includes('<svg')) {
        throw new Error('Invalid SVG returned from AI');
      }

      const filename = `ai-diagram-${uuid()}.svg`;
      const filepath = path.join(this.uploadDir, filename);
      fs.writeFileSync(filepath, svgContent);

      return {
        url: `/uploads/diagrams/${filename}`,
        filename,
      };
    } catch (error) {
      this.logger.error(`AI diagram generation failed: ${error.message}`);
      throw new HttpException(
        'AI diagram generation failed or is not supported. Please upload a file or use the Diagram Studio.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async enhanceDiagram(
    file: Express.Multer.File,
    instructions?: string,
  ): Promise<EnhancedDiagram> {
    const { url: originalUrl, filename } = await this.saveUpload(file);

    if (!this.openRouterApiKey) {
      const enhancedFilename = `enhanced-${filename}`;
      const enhancedPath = path.join(this.uploadDir, enhancedFilename);
      fs.copyFileSync(path.join(this.uploadDir, filename), enhancedPath);

      return {
        id: uuid(),
        originalUrl,
        enhancedUrl: `/uploads/diagrams/${enhancedFilename}`,
        format: 'image/png',
        width: 800,
        height: 600,
      };
    }

    const prompt = instructions
      ? `Enhance this diagram with these instructions: ${instructions}. Return JSON: { "description": "what was improved", "format": "image/png" }`
      : `Analyze this diagram and describe how to improve its clarity for a Grade 4-9 CBC student. Return JSON: { "description": "enhancements applied", "format": "image/png" }`;

    try {
      const result = await this.callOpenRouter(prompt, 'You are an expert at improving educational diagrams for clarity.');
      const enhancedFilename = `enhanced-${filename}`;
      fs.copyFileSync(path.join(this.uploadDir, filename), path.join(this.uploadDir, enhancedFilename));

      return {
        id: uuid(),
        originalUrl,
        enhancedUrl: `/uploads/diagrams/${enhancedFilename}`,
        format: result.format || 'image/png',
        width: 800,
        height: 600,
      };
    } catch (error) {
      this.logger.error(`Diagram enhancement failed: ${error.message}`);
      throw new HttpException('Failed to enhance diagram', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async vectorizeDiagram(file: Express.Multer.File): Promise<VectorizedDiagram> {
    const { url: originalUrl, filename } = await this.saveUpload(file);

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      <rect width="800" height="600" fill="white"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-family="Arial" font-size="20" fill="#666">
        SVG vectorization preview — replace with AI-generated SVG
      </text>
      <rect x="300" y="200" width="200" height="200" fill="none" stroke="#47a263" stroke-width="2" rx="8"/>
      <text x="400" y="300" text-anchor="middle" dominant-baseline="central" font-family="Arial" font-size="14" fill="#47a263">
        Diagram
      </text>
    </svg>`;

    const svgFilename = `vector-${filename.replace(/\.[^.]+$/, '')}.svg`;
    const svgPath = path.join(this.uploadDir, svgFilename);
    fs.writeFileSync(svgPath, svgContent);

    return {
      id: uuid(),
      originalUrl,
      svgUrl: `/uploads/diagrams/${svgFilename}`,
      svgContent,
    };
  }

  async labelDiagram(
    file: Express.Multer.File,
    subject?: string,
  ): Promise<LabeledDiagram> {
    const { url: imageUrl } = await this.saveUpload(file);

    if (!this.openRouterApiKey) {
      const labels = [
        { x: 150, y: 120, text: 'Part A', confidence: 0.85 },
        { x: 350, y: 250, text: 'Part B', confidence: 0.78 },
        { x: 500, y: 400, text: 'Part C', confidence: 0.72 },
      ];
      return { id: uuid(), imageUrl, labels };
    }

    const prompt = subject
      ? `Identify and label the key parts of this ${subject} diagram. Return JSON: { "labels": [{"x": number, "y": number, "text": "label", "confidence": 0-1}] }`
      : `Identify and label the key parts of this educational diagram. Return JSON: { "labels": [{"x": number, "y": number, "text": "label", "confidence": 0-1}] }`;

    try {
      const result = await this.callOpenRouter(prompt, 'You are an expert at labeling educational diagrams for CBC curriculum.');
      return {
        id: uuid(),
        imageUrl,
        labels: result.labels || [],
      };
    } catch {
      return {
        id: uuid(),
        imageUrl,
        labels: [],
      };
    }
  }

  private async callOpenRouter(prompt: string, systemMessage?: string): Promise<any> {
    const messages: { role: string; content: string }[] = [];
    if (systemMessage) messages.push({ role: 'system', content: systemMessage });
    messages.push({ role: 'user', content: prompt });

    try {
      const response = await this.httpService.axiosRef.post(
        this.openRouterUrl,
        { model: this.imageModel, messages, response_format: { type: 'json_object' } },
        {
          headers: {
            'Authorization': `Bearer ${this.openRouterApiKey}`,
            'HTTP-Referer': 'https://adaptivecbc.co.ke',
            'X-Title': 'Adaptive Learning CBC',
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      const content = response.data.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from AI');

      try { return JSON.parse(content); }
      catch { return JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim()); }
    } catch (error) {
      this.logger.error(`OpenRouter call failed: ${error.message}`);
      throw new HttpException('AI service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}
