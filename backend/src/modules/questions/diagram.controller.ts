import { Controller, Post, Get, Body, UseGuards, UseInterceptors, UploadedFile, Request, Query, HttpException, HttpStatus } from '@nestjs/common';
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

  @Get('library')
  @ApiOperation({ summary: 'Get saved diagrams for the user' })
  getLibrary(@Request() req: any, @Query('subject') subject?: string) {
    return this.diagramService.getLibrary(req.user.id, subject);
  }

  @Post('save')
  @ApiOperation({ summary: 'Save a diagram to the library' })
  saveToLibrary(@Request() req: any, @Body() body: any) {
    return this.diagramService.saveToLibrary(body, req.user.id);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload a diagram or option image' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadDiagram(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    return this.diagramService.saveUpload(file);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate a diagram image from text prompt' })
  async generateDiagram(
    @Body('prompt') prompt: string,
    @Body('subject') subject?: string,
    @Body('grade') grade?: string,
  ) {
    if (!prompt) throw new HttpException('Prompt is required', HttpStatus.BAD_REQUEST);
    return this.diagramService.generateDiagram(prompt, subject, grade);
  }

  @Post('remix')
  @ApiOperation({ summary: 'Remix an existing diagram using AI' })
  async remixDiagram(
    @Body('imageUrl') imageUrl: string,
    @Body('prompt') prompt: string,
    @Body('subject') subject?: string,
    @Body('grade') grade?: string,
  ) {
    if (!imageUrl || !prompt) throw new HttpException('Image URL and prompt are required', HttpStatus.BAD_REQUEST);
    return this.diagramService.remixDiagram(imageUrl, prompt, subject, grade);
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

