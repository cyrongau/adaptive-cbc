import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from './entities/class.entity';
import { CreateClassDto, UpdateClassDto } from './dto/class.dto';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private classesRepository: Repository<Class>,
  ) {}

  async create(createClassDto: CreateClassDto, teacherId: string): Promise<Class> {
    const classEntity = this.classesRepository.create({
      ...createClassDto,
      teacherId,
    });
    return this.classesRepository.save(classEntity);
  }

  async findAllByTeacher(teacherId: string): Promise<Class[]> {
    return this.classesRepository.find({
      where: { teacherId },
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(): Promise<Class[]> {
    return this.classesRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Class> {
    const classEntity = await this.classesRepository.findOne({ where: { id } });
    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }
    return classEntity;
  }

  async update(id: string, updateClassDto: UpdateClassDto): Promise<Class> {
    const classEntity = await this.findOne(id);
    Object.assign(classEntity, updateClassDto);
    return this.classesRepository.save(classEntity);
  }

  async remove(id: string): Promise<void> {
    const classEntity = await this.findOne(id);
    await this.classesRepository.remove(classEntity);
  }

  async getClassStats(teacherId: string): Promise<{ totalClasses: number; totalStudents: number }> {
    const classes = await this.findAllByTeacher(teacherId);
    return {
      totalClasses: classes.length,
      totalStudents: classes.reduce((sum, cls) => sum + cls.studentCount, 0),
    };
  }
}