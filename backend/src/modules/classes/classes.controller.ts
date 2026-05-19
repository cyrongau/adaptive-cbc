import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { CreateClassDto, UpdateClassDto } from './dto/class.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('classes')
@Controller('classes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new class (Teacher only)' })
  async create(@Body() createClassDto: CreateClassDto, @Request() req) {
    return this.classesService.create(createClassDto, req.user.id);
  }

  @Get('my-classes')
  @ApiOperation({ summary: 'Get all classes for current teacher' })
  async findMyClasses(@Request() req) {
    return this.classesService.findAllByTeacher(req.user.id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Get all classes (Admin only)' })
  async findAll() {
    return this.classesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get class by ID' })
  async findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update class' })
  async update(@Param('id') id: string, @Body() updateClassDto: UpdateClassDto, @Request() req) {
    const classEntity = await this.classesService.findOne(id);
    if (classEntity.teacherId !== req.user.id) {
      throw new Error('You can only update your own classes');
    }
    return this.classesService.update(id, updateClassDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete class' })
  async remove(@Param('id') id: string, @Request() req) {
    const classEntity = await this.classesService.findOne(id);
    if (classEntity.teacherId !== req.user.id) {
      throw new Error('You can only delete your own classes');
    }
    return this.classesService.remove(id);
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get class statistics for teacher' })
  async getStats(@Request() req) {
    return this.classesService.getClassStats(req.user.id);
  }
}