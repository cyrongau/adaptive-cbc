import { Controller, Post, Get, Body, UseGuards, UseInterceptors, UploadedFile, Request, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DiagramService } from './services/diagram.service';

@ApiTags('diagrams')
@Controller('diagrams')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class DiagramController {
  constructor(private readonly diagramService: DiagramService) {}

  @Get('templates')
  @ApiOperation({ summary: 'Get subject-specific diagram templates' })
  getTemplates() {
    return this.diagramService.getTemplates();
  }

  @Post('enhance')
  @ApiOperation({ summary: 'Upload and enhance a diagram image' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async enhanceDiagram(
    @UploadedFile() file: Express.Multer.File,
    @Body('instructions') instructions?: string,
  ) {
    if (!file) throw new Error('No file uploaded');
    return this.diagramService.enhanceDiagram(file, instructions);
  }

  @Post('vectorize')
  @ApiOperation({ summary: 'Convert raster diagram to SVG' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async vectorizeDiagram(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new Error('No file uploaded');
    return this.diagramService.vectorizeDiagram(file);
  }

  @Post('label')
  @ApiOperation({ summary: 'AI auto-label diagram elements' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async labelDiagram(
    @UploadedFile() file: Express.Multer.File,
    @Body('subject') subject?: string,
  ) {
    if (!file) throw new Error('No file uploaded');
    return this.diagramService.labelDiagram(file, subject);
  }
}
