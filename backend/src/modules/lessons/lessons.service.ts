import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Lesson, LessonStatus, DayOfWeek } from './entities/lesson.entity';
import { CreateLessonDto, UpdateLessonDto } from './dto/lesson.dto';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lesson)
    private lessonsRepository: Repository<Lesson>,
    private usersService: UsersService,
  ) {}

  async create(dto: CreateLessonDto, userId: string): Promise<Lesson> {
    const user = await this.usersService.findOne(userId);
    if (user.role !== UserRole.TEACHER && user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.INSTITUTION_ADMIN) {
      throw new ForbiddenException('Only teachers and admins can create lessons');
    }

    const lesson = this.lessonsRepository.create({
      ...dto,
      teacherId: userId,
      status: LessonStatus.SCHEDULED,
    });

    return this.lessonsRepository.save(lesson);
  }

  async findAll(): Promise<Lesson[]> {
    return this.lessonsRepository.find({
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
      relations: ['teacher'],
    });
  }

  async findOne(id: string): Promise<Lesson> {
    const lesson = await this.lessonsRepository.findOne({
      where: { id },
      relations: ['teacher'],
    });
    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }
    return lesson;
  }

  async update(id: string, dto: UpdateLessonDto, userId: string): Promise<Lesson> {
    const lesson = await this.findOne(id);

    const user = await this.usersService.findOne(userId);
    if (lesson.teacherId !== userId && user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.INSTITUTION_ADMIN) {
      throw new ForbiddenException('You can only update your own lessons');
    }

    Object.assign(lesson, dto);
    return this.lessonsRepository.save(lesson);
  }

  async remove(id: string, userId: string): Promise<void> {
    const lesson = await this.findOne(id);

    const user = await this.usersService.findOne(userId);
    if (lesson.teacherId !== userId && user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.INSTITUTION_ADMIN) {
      throw new ForbiddenException('You can only delete your own lessons');
    }

    await this.lessonsRepository.remove(lesson);
  }

  async getTimetable(userId: string, grade?: number): Promise<any> {
    const user = await this.usersService.findOne(userId);

    let lessons: Lesson[];

    if (user.role === UserRole.TEACHER) {
      lessons = await this.lessonsRepository.find({
        where: { teacherId: userId },
        order: { dayOfWeek: 'ASC', startTime: 'ASC' },
        relations: ['teacher'],
      });
    } else if (grade || user.grade) {
      lessons = await this.lessonsRepository.find({
        where: { grade: grade || user.grade },
        order: { dayOfWeek: 'ASC', startTime: 'ASC' },
        relations: ['teacher'],
      });
    } else {
      lessons = [];
    }

    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    const timetable = dayOrder.map((day) => {
      const dayLessons = lessons
        .filter((l) => l.dayOfWeek === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      return {
        day,
        lessons: dayLessons,
      };
    });

    return {
      timetable,
      totalLessons: lessons.length,
    };
  }

  async getNextLesson(userId: string): Promise<Lesson | null> {
    const user = await this.usersService.findOne(userId);

    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[today.getDay()];
    const currentTime = today.toTimeString().slice(0, 5);

    const grade = user.grade;

    if (!grade) return null;

    const todayLessons = await this.lessonsRepository.find({
      where: {
        dayOfWeek: currentDay as DayOfWeek,
        grade,
        status: LessonStatus.SCHEDULED,
      },
      order: { startTime: 'ASC' },
      relations: ['teacher'],
    });

    const nextToday = todayLessons.find((l) => l.startTime >= currentTime);
    if (nextToday) return nextToday;

    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const currentIndex = dayOrder.indexOf(currentDay);

    for (let i = 1; i <= 7; i++) {
      const nextDay = dayOrder[(currentIndex + i) % 7];
      const nextDayLessons = await this.lessonsRepository.findOne({
        where: {
          dayOfWeek: nextDay as DayOfWeek,
          grade,
          status: LessonStatus.SCHEDULED,
        },
        order: { startTime: 'ASC' },
        relations: ['teacher'],
      });
      if (nextDayLessons) return nextDayLessons;
    }

    return null;
  }

  async getLiveClasses(userId: string): Promise<Lesson[]> {
    const user = await this.usersService.findOne(userId);

    const grade = user.grade;
    if (!grade) return [];

    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[today.getDay()];
    const currentTime = today.toTimeString().slice(0, 5);

    const liveToday = await this.lessonsRepository.find({
      where: {
        dayOfWeek: currentDay as DayOfWeek,
        grade,
        isLive: true,
        status: LessonStatus.SCHEDULED,
      },
      order: { startTime: 'ASC' },
      relations: ['teacher'],
    });

    const ongoing = liveToday.filter(
      (l) => l.startTime <= currentTime && l.endTime >= currentTime,
    );

    const upcoming = liveToday.filter(
      (l) => l.startTime > currentTime,
    ).slice(0, 3);

    const past = liveToday.filter(
      (l) => l.endTime < currentTime,
    );

    return [...ongoing, ...upcoming, ...past];
  }

  async getByTeacher(teacherId: string): Promise<Lesson[]> {
    return this.lessonsRepository.find({
      where: { teacherId },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async getStats(userId: string): Promise<any> {
    const user = await this.usersService.findOne(userId);
    const grade = user.grade;

    const total = await this.lessonsRepository.count({
      where: grade ? { grade } : {},
    });

    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[today.getDay()];

    const todayCount = await this.lessonsRepository.count({
      where: {
        dayOfWeek: currentDay as DayOfWeek,
        ...(grade ? { grade } : {}),
      },
    });

    return { totalLessons: total, todayLessons: todayCount };
  }
}
