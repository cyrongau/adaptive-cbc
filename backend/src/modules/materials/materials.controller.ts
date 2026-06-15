import {
  Controller, Get, Post, Put, Delete, Param, Query, Body, Request,
  UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { MinioService } from '../../common/minio.service';
import { extname } from 'path';

@ApiTags('materials')
@Controller('materials')
export class MaterialsController {
  constructor(
    private readonly materialsService: MaterialsService,
    private readonly minioService: MinioService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List published materials' })
  async findAll(
    @Query('subjectId') subjectId?: string,
    @Query('grade') grade?: number,
    @Query('category') category?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Request() req?: any,
  ) {
    return this.materialsService.findAll({
      subjectId, grade, category, type, search, page, limit,
      userInstitutionId: req?.user?.institutionId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get material by ID' })
  async findOne(@Param('id') id: string) {
    return this.materialsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.TUTOR, UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new material' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        title: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string' },
        type: { type: 'string' },
        subjectId: { type: 'string' },
        grade: { type: 'number' },
        visibility: { type: 'string' },
        isPremium: { type: 'boolean' },
        price: { type: 'number' },
        tags: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }))
  async create(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() createDto: CreateMaterialDto,
  ) {
    let fileUrl: string | undefined;
    let fileSize = 0;

    if (file) {
      const timestamp = Date.now();
      const ext = extname(file.originalname);
      const filename = `${timestamp}-${Math.random().toString(36).substring(2)}${ext}`;
      const { url } = await this.minioService.uploadFile('materials', filename, file.buffer, file.mimetype);
      fileUrl = url;
      fileSize = file.size;
    }

    if (createDto.tags && typeof createDto.tags === 'string') {
      try {
        createDto.tags = JSON.parse(createDto.tags as any);
      } catch {
        createDto.tags = (createDto.tags as any).split(',').map((t: string) => t.trim());
      }
    }

    return this.materialsService.create(
      { ...createDto, fileUrl, fileSize },
      req.user.id,
      req.user.institutionId,
    );
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.TUTOR, UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update material' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateMaterialDto) {
    return this.materialsService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.TUTOR, UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete material' })
  async remove(@Param('id') id: string) {
    return this.materialsService.remove(id);
  }

  @Post(':id/download')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Record download and return material with file URL' })
  async download(@Param('id') id: string) {
    return this.materialsService.incrementDownloadCount(id);
  }
}
