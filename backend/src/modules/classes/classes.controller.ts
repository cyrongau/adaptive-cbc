import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { CreateClassDto, UpdateClassDto } from './dto/class.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('classes')
@Controller('classes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new class' })
  async create(@Body() createDto: CreateClassDto, @Request() req) {
    return this.classesService.create(createDto, req.user.id);
  }

  @Get('my-classes')
  @ApiOperation({ summary: 'Get all classes for current teacher' })
  async findMyClasses(@Request() req) {
    return this.classesService.findAllByTeacher(req.user.id);
  }

  @Get('my-enrollments')
  @ApiOperation({ summary: 'Get all classes the current student is enrolled in' })
  async findMyEnrollments(@Request() req) {
    return this.classesService.getMyClasses(req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all classes' })
  async findAll() {
    return this.classesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get class by ID' })
  async findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }

  @Get(':id/students')
  @ApiOperation({ summary: 'Get students enrolled in a class' })
  async getStudents(@Param('id') id: string) {
    return this.classesService.getStudentsByClass(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update class' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateClassDto) {
    return this.classesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete class' })
  async remove(@Param('id') id: string) {
    return this.classesService.remove(id);
  }

  @Post(':id/students')
  @ApiOperation({ summary: 'Add a student to a class (teacher)' })
  async addStudent(@Param('id') id: string, @Body() body: { studentId: string }) {
    return this.classesService.addStudentToClass(id, body.studentId);
  }

  @Delete(':id/students/:studentId')
  @ApiOperation({ summary: 'Remove a student from a class' })
  async removeStudent(@Param('id') id: string, @Param('studentId') studentId: string) {
    await this.classesService.removeStudentFromClass(id, studentId);
    return { message: 'Student removed from class' };
  }

  @Post('join')
  @ApiOperation({ summary: 'Join a class by code (student)' })
  async joinByCode(@Body() body: { code: string }, @Request() req) {
    return this.classesService.joinClassByCode(body.code, req.user.id);
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get class statistics' })
  async getStats(@Request() req) {
    return this.classesService.getClassStats(req.user.id);
  }
}
