import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { Course, CourseStatus } from './entities/course.entity';
import { CourseModule } from './entities/course-module.entity';
import { CourseLesson } from './entities/course-lesson.entity';
import { CourseResource } from './entities/course-resource.entity';
import { CourseReview } from './entities/course-review.entity';
import { CourseCertificate } from './entities/course-certificate.entity';
import { CourseAssessmentAttempt } from './entities/course-assessment-attempt.entity';
import { UsersService } from '../users/users.service';
import { EnrollmentService } from '../enrollment/enrollment.service';

const mockRepository = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  })),
});

const mockUsersService = () => ({
  findOne: jest.fn(),
});

const mockEnrollmentService = () => ({
  findMyActiveEnrollment: jest.fn(),
  findByCourse: jest.fn(),
});

const mockCourse = (overrides = {}) => ({
  id: 'course-1',
  title: 'Test Course',
  teacherId: 'teacher-1',
  status: CourseStatus.DRAFT,
  assessmentQuestions: null,
  modules: [],
  ...overrides,
});

describe('CoursesService', () => {
  let service: CoursesService;
  let coursesRepo: jest.Mocked<any>;
  let usersService: jest.Mocked<any>;
  let attemptsRepo: jest.Mocked<any>;
  let enrollmentService: jest.Mocked<any>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: getRepositoryToken(Course), useValue: mockRepository() },
        { provide: getRepositoryToken(CourseModule), useValue: mockRepository() },
        { provide: getRepositoryToken(CourseLesson), useValue: mockRepository() },
        { provide: getRepositoryToken(CourseResource), useValue: mockRepository() },
        { provide: getRepositoryToken(CourseReview), useValue: mockRepository() },
        { provide: getRepositoryToken(CourseCertificate), useValue: mockRepository() },
        { provide: getRepositoryToken(CourseAssessmentAttempt), useValue: mockRepository() },
        { provide: UsersService, useValue: mockUsersService() },
        { provide: EnrollmentService, useValue: mockEnrollmentService() },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
    coursesRepo = module.get(getRepositoryToken(Course));
    usersService = module.get(UsersService);
    attemptsRepo = module.get(getRepositoryToken(CourseAssessmentAttempt));
    enrollmentService = module.get(EnrollmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('assessment questions', () => {
    const multipleChoice = {
      questionType: 'multiple_choice',
      question: '<p>What is 2 + 2?</p>',
      options: ['<p>3</p>', '<p>4</p>', '<p>5</p>', '<p>6</p>'],
      correctAnswer: 1,
      marks: 2,
    };

    const multipleAnswer = {
      questionType: 'multiple_answer',
      question: '<p>Select all prime numbers</p>',
      options: ['<p>2</p>', '<p>4</p>', '<p>7</p>', '<p>9</p>'],
      correctAnswer: 0b0101,
      marks: 3,
    };

    const trueFalse = {
      questionType: 'true_false',
      question: '<p>$$E=mc^2$$</p>',
      options: ['<p>True</p>', '<p>False</p>'],
      correctAnswer: 0,
      marks: 1,
    };

    const shortAnswer = {
      questionType: 'short_answer',
      question: '<p>What is the capital of France?</p>',
      options: ['<p>Paris</p>'],
      correctAnswer: 0,
      marks: 2,
    };

    const fillInBlank = {
      questionType: 'fill_in_blank',
      question: '<p>The chemical symbol for water is \\(H_2O\\)</p>',
      options: ['<p>H<sub>2</sub>O</p>'],
      correctAnswer: 0,
      marks: 2,
    };

    const allQuestionTypes = [multipleChoice, multipleAnswer, trueFalse, shortAnswer, fillInBlank];

    it('should save and return assessment questions with all 5 question types', async () => {
      const course = mockCourse({ assessmentQuestions: null });
      coursesRepo.findOne.mockResolvedValue(course);
      coursesRepo.save.mockImplementation((c) => Promise.resolve(c));
      usersService.findOne.mockResolvedValue({ id: 'teacher-1', role: 'teacher' });

      const dto = { assessmentQuestions: allQuestionTypes };
      const result = await service.update('course-1', dto, 'teacher-1');
      const qs = result.assessmentQuestions as any[];

      expect(qs).toEqual(allQuestionTypes);
      expect(qs).toHaveLength(5);
      expect(qs[0].questionType).toBe('multiple_choice');
      expect(qs[1].questionType).toBe('multiple_answer');
      expect(qs[1].correctAnswer).toBe(0b0101);
      expect(qs[2].questionType).toBe('true_false');
      expect(qs[3].questionType).toBe('short_answer');
      expect(qs[3].options).toEqual(['<p>Paris</p>']);
      expect(qs[4].questionType).toBe('fill_in_blank');
      expect(coursesRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ assessmentQuestions: allQuestionTypes }),
      );
    });

    it('should preserve questionType in saved jsonb data', async () => {
      const course = mockCourse({ assessmentQuestions: null });
      coursesRepo.findOne.mockResolvedValue(course);
      let savedCourse: any = null;
      coursesRepo.save.mockImplementation((c) => {
        savedCourse = { ...c };
        return Promise.resolve(savedCourse);
      });
      usersService.findOne.mockResolvedValue({ id: 'teacher-1', role: 'teacher' });

      await service.update('course-1', { assessmentQuestions: allQuestionTypes }, 'teacher-1');

      expect(savedCourse.assessmentQuestions[0]).toHaveProperty('questionType', 'multiple_choice');
      expect(savedCourse.assessmentQuestions[1]).toHaveProperty('questionType', 'multiple_answer');
      expect(savedCourse.assessmentQuestions[2]).toHaveProperty('questionType', 'true_false');
      expect(savedCourse.assessmentQuestions[3]).toHaveProperty('questionType', 'short_answer');
      expect(savedCourse.assessmentQuestions[4]).toHaveProperty('questionType', 'fill_in_blank');
    });

    it('should clear assessment questions when set to null or empty', async () => {
      const existing = allQuestionTypes;
      const course = mockCourse({ assessmentQuestions: existing });
      coursesRepo.findOne.mockResolvedValue(course);
      coursesRepo.save.mockImplementation((c) => Promise.resolve(c));
      usersService.findOne.mockResolvedValue({ id: 'teacher-1', role: 'teacher' });

      const result = await service.update('course-1', { assessmentQuestions: [] }, 'teacher-1');
      expect(result.assessmentQuestions).toEqual([]);
    });

    it('should allow setting assessment questions on create', async () => {
      coursesRepo.create.mockImplementation((dto) => mockCourse(dto));
      coursesRepo.save.mockImplementation((c) => Promise.resolve(c));
      usersService.findOne.mockResolvedValue({ id: 'teacher-1', role: 'teacher' });

      const dto = {
        title: 'New Course',
        subject: 'Math',
        grade: 4,
        assessmentQuestions: allQuestionTypes,
      };
      const result = await service.create(dto, 'teacher-1');

      expect(result.assessmentQuestions).toEqual(allQuestionTypes);
      expect(result.assessmentQuestions).toHaveLength(5);
    });

    it('should persist assessment data through no-op update', async () => {
      const course = mockCourse({ assessmentQuestions: allQuestionTypes });
      coursesRepo.findOne.mockResolvedValue(course);
      coursesRepo.save.mockImplementation((c) => Promise.resolve(c));
      usersService.findOne.mockResolvedValue({ id: 'teacher-1', role: 'teacher' });

      const result = await service.update('course-1', { title: 'Updated Title' }, 'teacher-1');

      expect(result.assessmentQuestions).toEqual(allQuestionTypes);
      expect(result.assessmentQuestions).toHaveLength(5);
    });

    it('should handle multiple_answer bitmask correctly for all combinations', async () => {
      const course = mockCourse({ assessmentQuestions: null });
      coursesRepo.findOne.mockResolvedValue(course);
      coursesRepo.save.mockImplementation((c) => Promise.resolve(c));
      usersService.findOne.mockResolvedValue({ id: 'teacher-1', role: 'teacher' });

      const questions = [
        { ...multipleAnswer, correctAnswer: 0b0000 },
        { ...multipleAnswer, correctAnswer: 0b1111 },
        { ...multipleAnswer, correctAnswer: 0b1010 },
      ];
      const result = await service.update('course-1', { assessmentQuestions: questions }, 'teacher-1');

      expect(result.assessmentQuestions[0].correctAnswer).toBe(0b0000);
      expect(result.assessmentQuestions[1].correctAnswer).toBe(0b1111);
      expect(result.assessmentQuestions[2].correctAnswer).toBe(0b1010);
    });

    it('should reject update from non-owner non-admin user', async () => {
      const course = mockCourse({ teacherId: 'teacher-1' });
      coursesRepo.findOne.mockResolvedValue(course);
      usersService.findOne.mockResolvedValue({ id: 'other-user', role: 'student' });

      await expect(
        service.update('course-1', { assessmentQuestions: [multipleChoice] }, 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow update from super admin even if not the owner', async () => {
      const course = mockCourse({ teacherId: 'teacher-1', assessmentQuestions: null });
      coursesRepo.findOne.mockResolvedValue(course);
      coursesRepo.save.mockImplementation((c) => Promise.resolve(c));
      usersService.findOne.mockResolvedValue({ id: 'admin-1', role: 'super_admin' });

      const result = await service.update('course-1', { assessmentQuestions: [multipleChoice] }, 'admin-1');
      const qs = result.assessmentQuestions as any[];
      expect(qs).toHaveLength(1);
      expect(qs[0].questionType).toBe('multiple_choice');
    });
  });

  describe('assessment attempts', () => {
    const mcAnswer = { questionIndex: 0, answer: 1 };
    const maAnswer = { questionIndex: 1, answer: 0b0101 };
    const tfAnswer = { questionIndex: 2, answer: 0 };
    const saAnswer = { questionIndex: 3, answer: '<p>Paris</p>' };
    const fibAnswer = { questionIndex: 4, answer: 'H<sub>2</sub>O' };

    it('should grade and save an assessment attempt', async () => {
      const course = mockCourse({
        assessmentQuestions: [
          { questionType: 'multiple_choice', question: 'q1', options: ['a', 'b', 'c', 'd'], correctAnswer: 1, marks: 2 },
          { questionType: 'multiple_answer', question: 'q2', options: ['a', 'b', 'c', 'd'], correctAnswer: 0b0101, marks: 3 },
          { questionType: 'true_false', question: 'q3', options: ['True', 'False'], correctAnswer: 0, marks: 1 },
          { questionType: 'short_answer', question: 'q4', options: ['<p>Paris</p>'], correctAnswer: 0, marks: 2 },
          { questionType: 'fill_in_blank', question: 'q5', options: ['H<sub>2</sub>O'], correctAnswer: 0, marks: 2 },
        ],
      });
      coursesRepo.findOne.mockResolvedValue(course);
      usersService.findOne.mockResolvedValue({ id: 'student-1', role: 'student' });
      enrollmentService.findMyActiveEnrollment.mockResolvedValue({ id: 'enroll-1', status: 'active' });
      attemptsRepo.create.mockImplementation((dto) => dto);
      attemptsRepo.save.mockImplementation((c) => Promise.resolve(c));

      const result = await service.submitAssessment('course-1', 'student-1', [
        mcAnswer, maAnswer, tfAnswer, saAnswer, fibAnswer,
      ]);

      expect(result.score).toBe(10);
      expect(result.totalMarks).toBe(10);
      expect(result.passed).toBe(true);
      expect(result.studentId).toBe('student-1');
      expect(result.courseId).toBe('course-1');
      expect(result.answers).toHaveLength(5);
    });

    it('should return partial score for incorrect answers', async () => {
      const course = mockCourse({
        assessmentQuestions: [
          { questionType: 'multiple_choice', question: 'q1', options: ['a', 'b', 'c', 'd'], correctAnswer: 2, marks: 2 },
          { questionType: 'true_false', question: 'q2', options: ['True', 'False'], correctAnswer: 0, marks: 1 },
        ],
      });
      coursesRepo.findOne.mockResolvedValue(course);
      usersService.findOne.mockResolvedValue({ id: 'student-1', role: 'student' });
      enrollmentService.findMyActiveEnrollment.mockResolvedValue({ id: 'enroll-1', status: 'active' });
      attemptsRepo.create.mockImplementation((dto) => dto);
      attemptsRepo.save.mockImplementation((c) => Promise.resolve(c));

      const result = await service.submitAssessment('course-1', 'student-1', [
        { questionIndex: 0, answer: 1 },
        { questionIndex: 1, answer: 0 },
      ]);

      expect(result.score).toBe(1);
      expect(result.totalMarks).toBe(3);
      expect(result.passed).toBe(false);
    });

    it('should use custom assessmentPassThreshold from course', async () => {
      const course = mockCourse({
        assessmentPassThreshold: 30,
        assessmentQuestions: [
          { questionType: 'multiple_choice', question: 'q1', options: ['a', 'b', 'c', 'd'], correctAnswer: 2, marks: 2 },
          { questionType: 'true_false', question: 'q2', options: ['True', 'False'], correctAnswer: 0, marks: 1 },
        ],
      });
      coursesRepo.findOne.mockResolvedValue(course);
      usersService.findOne.mockResolvedValue({ id: 'student-1', role: 'student' });
      enrollmentService.findMyActiveEnrollment.mockResolvedValue({ id: 'enroll-1', status: 'active' });
      attemptsRepo.create.mockImplementation((dto) => dto);
      attemptsRepo.save.mockImplementation((c) => Promise.resolve(c));

      const result = await service.submitAssessment('course-1', 'student-1', [
        { questionIndex: 0, answer: 1 },
        { questionIndex: 1, answer: 0 },
      ]);

      expect(result.score).toBe(1);
      expect(result.totalMarks).toBe(3);
      expect(result.passed).toBe(true);
    });

    it('should throw if no assessment questions exist', async () => {
      const course = mockCourse({ assessmentQuestions: [] });
      coursesRepo.findOne.mockResolvedValue(course);

      await expect(
        service.submitAssessment('course-1', 'student-1', [{ questionIndex: 0, answer: 0 }]),
      ).rejects.toThrow('This course has no assessment questions');
    });

    it('should throw if user is not enrolled', async () => {
      const course = mockCourse({
        assessmentQuestions: [{ questionType: 'multiple_choice', question: 'q', options: ['a', 'b'], correctAnswer: 0, marks: 1 }],
      });
      coursesRepo.findOne.mockResolvedValue(course);
      usersService.findOne.mockResolvedValue({ id: 'student-1', role: 'student' });
      enrollmentService.findMyActiveEnrollment.mockResolvedValue(null);

      await expect(
        service.submitAssessment('course-1', 'student-1', [{ questionIndex: 0, answer: 0 }]),
      ).rejects.toThrow('You must be enrolled in the course to submit the assessment');
    });

    it('should throw if user is not a student', async () => {
      const course = mockCourse({
        assessmentQuestions: [{ questionType: 'multiple_choice', question: 'q', options: ['a', 'b'], correctAnswer: 0, marks: 1 }],
      });
      coursesRepo.findOne.mockResolvedValue(course);
      usersService.findOne.mockResolvedValue({ id: 'teacher-1', role: 'teacher' });

      await expect(
        service.submitAssessment('course-1', 'teacher-1', [{ questionIndex: 0, answer: 0 }]),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return attempts ordered by newest first', async () => {
      attemptsRepo.find.mockResolvedValue([
        { id: '2', submittedAt: new Date('2026-06-12') },
        { id: '1', submittedAt: new Date('2026-06-10') },
      ]);

      const result = await service.getAssessmentAttempts('course-1', 'student-1');
      expect(result).toHaveLength(2);
      expect(attemptsRepo.find).toHaveBeenCalledWith({
        where: { courseId: 'course-1', studentId: 'student-1' },
        order: { submittedAt: 'DESC' },
      });
    });

    it('should return latest attempt via getLatestAssessmentAttempt', async () => {
      attemptsRepo.find.mockResolvedValue([
        { id: '2', score: 8, submittedAt: new Date('2026-06-12') },
        { id: '1', score: 5, submittedAt: new Date('2026-06-10') },
      ]);

      const result = await service.getLatestAssessmentAttempt('course-1', 'student-1');
      expect(result).toBeDefined();
      expect(result!.id).toBe('2');
    });

    it('should return null when no attempts exist', async () => {
      attemptsRepo.find.mockResolvedValue([]);

      const result = await service.getLatestAssessmentAttempt('course-1', 'student-1');
      expect(result).toBeNull();
    });
  });
});
