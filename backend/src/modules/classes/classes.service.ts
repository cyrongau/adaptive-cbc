import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from './entities/class.entity';
import { ClassEnrollment } from './entities/class-enrollment.entity';
import { CreateClassDto, UpdateClassDto } from './dto/class.dto';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private classesRepository: Repository<Class>,
    @InjectRepository(ClassEnrollment)
    private enrollmentRepository: Repository<ClassEnrollment>,
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

  async getStudentsByClass(classId: string): Promise<ClassEnrollment[]> {
    const classEntity = await this.findOne(classId);
    return this.enrollmentRepository.find({
      where: { classId, status: 'active' },
      relations: ['student'],
      order: { createdAt: 'DESC' },
    });
  }

  async addStudentToClass(classId: string, studentId: string): Promise<ClassEnrollment> {
    const classEntity = await this.findOne(classId);

    const existing = await this.enrollmentRepository.findOne({
      where: { classId, studentId, status: 'active' },
    });
    if (existing) {
      throw new BadRequestException('Student is already enrolled in this class');
    }

    const enrollment = this.enrollmentRepository.create({
      classId,
      studentId,
      status: 'active',
    });

    const saved = await this.enrollmentRepository.save(enrollment);

    await this.classesRepository.update(classId, {
      studentCount: () => '"studentCount" + 1',
    } as any);

    return saved;
  }

  async joinClassByCode(code: string, studentId: string): Promise<ClassEnrollment> {
    const classEntity = await this.classesRepository.findOne({ where: { code } });
    if (!classEntity) {
      throw new NotFoundException('Class not found with that code');
    }
    if (!classEntity.isActive) {
      throw new BadRequestException('This class is no longer active');
    }
    return this.addStudentToClass(classEntity.id, studentId);
  }

  async removeStudentFromClass(classId: string, studentId: string): Promise<void> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { classId, studentId, status: 'active' },
    });
    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }
    enrollment.status = 'inactive';
    await this.enrollmentRepository.save(enrollment);

    await this.classesRepository.update(classId, {
      studentCount: () => '"studentCount" - 1',
    } as any);
  }

  async getMyClasses(studentId: string): Promise<ClassEnrollment[]> {
    return this.enrollmentRepository.find({
      where: { studentId, status: 'active' },
      relations: ['class', 'class.teacher'],
      order: { createdAt: 'DESC' },
    });
  }
}
