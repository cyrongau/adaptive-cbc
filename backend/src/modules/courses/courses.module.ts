import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { Course } from './entities/course.entity';
import { CourseModule } from './entities/course-module.entity';
import { CourseLesson } from './entities/course-lesson.entity';
import { CourseResource } from './entities/course-resource.entity';
import { CourseReview } from './entities/course-review.entity';
import { CourseCertificate } from './entities/course-certificate.entity';
import { UsersModule } from '../users/users.module';
import { EnrollmentModule } from '../enrollment/enrollment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, CourseModule, CourseLesson, CourseResource, CourseReview, CourseCertificate]),
    UsersModule,
    EnrollmentModule,
  ],
  providers: [CoursesService],
  controllers: [CoursesController],
  exports: [CoursesService],
})
export class CoursesModule {}
