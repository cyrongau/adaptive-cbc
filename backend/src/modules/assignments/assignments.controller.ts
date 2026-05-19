import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto, UpdateAssignmentDto } from './dto/assignment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('assignments')
@Controller('assignments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new assignment' })
  async create(@Body() createDto: CreateAssignmentDto, @Request() req) {
    return this.assignmentsService.create(createDto, req.user.id);
  }

  @Get('my-assignments')
  @ApiOperation({ summary: 'Get all assignments for current teacher' })
  async findMyAssignments(@Request() req) {
    return this.assignmentsService.findAllByTeacher(req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all assignments' })
  async findAll() {
    return this.assignmentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assignment by ID' })
  async findOne(@Param('id') id: string) {
    return this.assignmentsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update assignment' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateAssignmentDto) {
    return this.assignmentsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete assignment' })
  async remove(@Param('id') id: string) {
    return this.assignmentsService.remove(id);
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get assignment statistics' })
  async getStats(@Request() req) {
    return this.assignmentsService.getStats(req.user.id);
  }
}