import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { LessonsService } from './lessons.service';
import { CreateLessonDto, UpdateLessonDto } from './dto/lesson.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('lessons')
@Controller('lessons')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new lesson (Teacher/Admin only)' })
  async create(@Body() dto: CreateLessonDto, @Request() req) {
    return this.lessonsService.create(dto, req.user.id);
  }

  @Get('timetable')
  @ApiOperation({ summary: 'Get weekly timetable for current user' })
  @ApiQuery({ name: 'grade', required: false, type: Number })
  async getTimetable(@Request() req, @Query('grade') grade?: number) {
    return this.lessonsService.getTimetable(req.user.id, grade ? Number(grade) : undefined);
  }

  @Get('next')
  @ApiOperation({ summary: 'Get next upcoming lesson' })
  async getNextLesson(@Request() req) {
    return this.lessonsService.getNextLesson(req.user.id);
  }

  @Get('live')
  @ApiOperation({ summary: 'Get today\'s live/upcoming live classes' })
  async getLiveClasses(@Request() req) {
    return this.lessonsService.getLiveClasses(req.user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get lesson statistics' })
  async getStats(@Request() req) {
    return this.lessonsService.getStats(req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all lessons (Admin only)' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  async findAll() {
    return this.lessonsService.findAll();
  }

  @Get('my-lessons')
  @ApiOperation({ summary: 'Get lessons for current teacher' })
  async findMyLessons(@Request() req) {
    return this.lessonsService.getByTeacher(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lesson by ID' })
  async findOne(@Param('id') id: string) {
    return this.lessonsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update lesson' })
  async update(@Param('id') id: string, @Body() dto: UpdateLessonDto, @Request() req) {
    return this.lessonsService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete lesson' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.lessonsService.remove(id, req.user.id);
  }
}
