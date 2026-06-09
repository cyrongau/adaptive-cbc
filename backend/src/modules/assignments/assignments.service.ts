import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignment } from './entities/assignment.entity';
import { AssignmentSubmission } from './entities/assignment-submission.entity';
import { CreateAssignmentDto, UpdateAssignmentDto } from './dto/assignment.dto';
import { QuestionsService } from '../questions/questions.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(Assignment)
    private assignmentsRepository: Repository<Assignment>,
    @InjectRepository(AssignmentSubmission)
    private submissionRepository: Repository<AssignmentSubmission>,
    private questionsService: QuestionsService,
    private usersService: UsersService,
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

  async findForStudent(grade: number): Promise<Assignment[]> {
    return this.assignmentsRepository.find({
      where: { grade, status: 'published' },
      order: { dueDate: 'ASC' },
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

  async getStudentSubmission(assignmentId: string, studentId: string): Promise<AssignmentSubmission | null> {
    return this.submissionRepository.findOne({
      where: { assignmentId, studentId },
    });
  }

  async submitAssignment(
    assignmentId: string,
    studentId: string,
    answers: { questionId: string; answer: string }[],
  ): Promise<AssignmentSubmission> {
    const assignment = await this.findOne(assignmentId);

    if (assignment.status !== 'published') {
      throw new BadRequestException('This assignment is not open for submissions');
    }

    const existing = await this.getStudentSubmission(assignmentId, studentId);
    if (existing) {
      throw new BadRequestException('You have already submitted this assignment');
    }

    const submission = this.submissionRepository.create({
      assignmentId,
      studentId,
      answers: answers.map((a) => ({ ...a, isCorrect: false })),
      totalPoints: assignment.totalPoints,
      status: 'submitted',
      submittedAt: new Date(),
    });

    const saved = await this.submissionRepository.save(submission);

    await this.assignmentsRepository.update(assignmentId, {
      submittedCount: () => '"submittedCount" + 1',
    } as any);

    return saved;
  }

  async getSubmissionsForAssignment(assignmentId: string): Promise<AssignmentSubmission[]> {
    await this.findOne(assignmentId);
    return this.submissionRepository.find({
      where: { assignmentId },
      order: { submittedAt: 'DESC' },
    });
  }

  async getMySubmissions(studentId: string): Promise<AssignmentSubmission[]> {
    return this.submissionRepository.find({
      where: { studentId },
      order: { submittedAt: 'DESC' },
      relations: ['assignment'],
    });
  }

  async autoGradeSubmission(assignmentId: string, submissionId: string): Promise<AssignmentSubmission> {
    const submission = await this.submissionRepository.findOne({ where: { id: submissionId, assignmentId } });
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    const assignment = await this.findOne(assignmentId);

    let correctCount = 0;
    const gradedAnswers = await Promise.all(
      (submission.answers || []).map(async (a) => {
        try {
          const question = await this.questionsService.findOne(a.questionId);
          const isCorrect = question.options?.some((o) => o.isCorrect && o.id === a.answer) ?? false;
          if (isCorrect) correctCount++;
          return { ...a, isCorrect };
        } catch {
          return { ...a, isCorrect: false };
        }
      }),
    );

    const percentage = gradedAnswers.length > 0 ? (correctCount / gradedAnswers.length) * 100 : 0;
    const score = Math.round((assignment.totalPoints * percentage) / 100);

    submission.answers = gradedAnswers;
    submission.score = score;
    submission.status = 'graded';
    submission.gradedAt = new Date();
    submission.gradedBy = 'auto';

    const saved = await this.submissionRepository.save(submission);

    const xpAwarded = correctCount * 10;
    await this.usersService.addXpPoints(submission.studentId, xpAwarded);

    await this.assignmentsRepository.update(assignmentId, {
      gradedCount: () => '"gradedCount" + 1',
    } as any);

    return saved;
  }

  async gradeSubmission(
    assignmentId: string,
    submissionId: string,
    teacherId: string,
    score: number,
  ): Promise<AssignmentSubmission> {
    const submission = await this.submissionRepository.findOne({ where: { id: submissionId, assignmentId } });
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    const assignment = await this.findOne(assignmentId);

    if (score < 0 || score > assignment.totalPoints) {
      throw new BadRequestException(`Score must be between 0 and ${assignment.totalPoints}`);
    }

    submission.score = score;
    submission.status = 'graded';
    submission.gradedAt = new Date();
    submission.gradedBy = teacherId;

    const saved = await this.submissionRepository.save(submission);

    const percentage = assignment.totalPoints > 0 ? (score / assignment.totalPoints) * 100 : 0;
    const xpAwarded = Math.floor(percentage / 10);
    await this.usersService.addXpPoints(submission.studentId, xpAwarded);

    await this.assignmentsRepository.update(assignmentId, {
      gradedCount: () => '"gradedCount" + 1',
    } as any);

    return saved;
  }
}
