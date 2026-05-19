import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignment } from './entities/assignment.entity';
import { CreateAssignmentDto, UpdateAssignmentDto } from './dto/assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(Assignment)
    private assignmentsRepository: Repository<Assignment>,
  ) {}

  async create(createDto: CreateAssignmentDto, teacherId: string): Promise<Assignment> {
    const assignment = this.assignmentsRepository.create({
      ...createDto,
      teacherId,
    });
    return this.assignmentsRepository.save(assignment);
  }

  async findAllByTeacher(teacherId: string): Promise<Assignment[]> {
    return this.assignmentsRepository.find({
      where: { teacherId },
      order: { dueDate: 'ASC' },
    });
  }

  async findAll(): Promise<Assignment[]> {
    return this.assignmentsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Assignment> {
    const assignment = await this.assignmentsRepository.findOne({ where: { id } });
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    }
    return assignment;
  }

  async update(id: string, updateDto: UpdateAssignmentDto): Promise<Assignment> {
    const assignment = await this.findOne(id);
    Object.assign(assignment, updateDto);
    return this.assignmentsRepository.save(assignment);
  }

  async remove(id: string): Promise<void> {
    const assignment = await this.findOne(id);
    await this.assignmentsRepository.remove(assignment);
  }

  async getStats(teacherId: string): Promise<{ total: number; pending: number; completed: number }> {
    const assignments = await this.findAllByTeacher(teacherId);
    return {
      total: assignments.length,
      pending: assignments.filter(a => a.status === 'published').length,
      completed: assignments.filter(a => a.status === 'closed').length,
    };
  }
}