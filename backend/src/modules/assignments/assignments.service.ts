import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Assignment } from './entities/assignment.entity';
import { AssignmentSubmission } from './entities/assignment-submission.entity';
import { AssignmentComment } from './entities/assignment-comment.entity';
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
    @InjectRepository(AssignmentComment)
    private commentRepository: Repository<AssignmentComment>,
    private questionsService: QuestionsService,
    private usersService: UsersService,
    @InjectEntityManager() private entityManager: EntityManager,
  ) {}

  async create(createDto: CreateAssignmentDto, teacherId: string): Promise<Assignment> {
    const questionCount = createDto.questionIds?.length || createDto.questionCount || 5;
    const assignment = this.assignmentsRepository.create({
      ...createDto as any,
      teacherId,
      questionCount,
      questionIds: createDto.questionIds || undefined,
    } as Assignment);
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
      where: [
        { grade, status: 'published' },
        { grade, status: 'approved' },
      ],
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
      pending: assignments.filter(a => a.status === 'published' || a.status === 'pending_approval').length,
      completed: assignments.filter(a => a.status === 'closed').length,
    };
  }

  async submitForApproval(id: string, teacherId: string): Promise<Assignment> {
    const assignment = await this.findOne(id);
    if (assignment.teacherId !== teacherId) {
      throw new ForbiddenException('You can only submit your own assignments for approval');
    }
    if (assignment.status !== 'draft' && assignment.status !== 'rejected') {
      throw new BadRequestException('Only draft or rejected assignments can be submitted for approval');
    }
    assignment.status = 'pending_approval';
    return this.assignmentsRepository.save(assignment);
  }

  async approveAssignment(id: string): Promise<Assignment> {
    const assignment = await this.findOne(id);
    if (assignment.status !== 'pending_approval') {
      throw new BadRequestException('Only pending approval assignments can be approved');
    }
    assignment.status = 'approved';
    return this.assignmentsRepository.save(assignment);
  }

  async rejectAssignment(id: string): Promise<Assignment> {
    const assignment = await this.findOne(id);
    if (assignment.status !== 'pending_approval') {
      throw new BadRequestException('Only pending approval assignments can be rejected');
    }
    assignment.status = 'rejected';
    return this.assignmentsRepository.save(assignment);
  }

  async findPendingApproval(institutionId: string, status?: string): Promise<Assignment[]> {
    try {
      const statusFilter = status || 'pending_approval';
      return await this.assignmentsRepository.find({
        where: { status: statusFilter },
        order: { createdAt: 'DESC' },
        relations: ['teacher'],
      });
    } catch (error) {
      console.error('findPendingApproval error:', error);
      throw error;
    }
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

    if (assignment.status !== 'published' && assignment.status !== 'approved') {
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

  async getAssignmentQuestions(assignmentId: string): Promise<any[]> {
    const assignment = await this.findOne(assignmentId);
    if (assignment.questionIds && assignment.questionIds.length > 0) {
      const ids = assignment.questionIds.join(',');
      const result = await this.questionsService.findAll({ ids, status: undefined as any, limit: 100 });
      return result.questions;
    }
    return [];
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
    await this.usersService.updateStreak(submission.studentId);

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
    await this.usersService.updateStreak(submission.studentId);

    await this.assignmentsRepository.update(assignmentId, {
      gradedCount: () => '"gradedCount" + 1',
    } as any);

    return saved;
  }

  async addComment(
    assignmentId: string,
    submissionId: string,
    authorId: string,
    content: string,
    authorRole: string,
    questionId?: string,
    parentId?: string,
  ): Promise<AssignmentComment> {
    const submission = await this.submissionRepository.findOne({ where: { id: submissionId, assignmentId } });
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    const comment = this.commentRepository.create({
      assignmentId,
      submissionId,
      authorId,
      content,
      authorRole,
      questionId,
      parentId,
    });
    return this.commentRepository.save(comment);
  }

  async getCommentsForSubmission(submissionId: string): Promise<AssignmentComment[]> {
    return this.commentRepository.find({
      where: { submissionId },
      order: { createdAt: 'ASC' },
    });
  }

  async getCommentsForAssignment(assignmentId: string): Promise<AssignmentComment[]> {
    return this.commentRepository.find({
      where: { assignmentId },
      order: { createdAt: 'DESC' },
    });
  }

  async markCommentAsRead(commentId: string): Promise<void> {
    await this.commentRepository.update(commentId, { isRead: true });
  }

  async getUnreadCommentCount(authorId: string): Promise<number> {
    return this.commentRepository.count({
      where: { authorId, isRead: false },
    });
  }

  async getSubmissionWithStudent(id: string, assignmentId: string): Promise<AssignmentSubmission & { student?: any }> {
    const submission = await this.submissionRepository.findOne({
      where: { id, assignmentId },
    });
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }
    try {
      const user = await this.usersService.findOne(submission.studentId);
      return { ...submission, student: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, grade: user.grade } };
    } catch {
      return submission;
    }
  }

  async getSubmissionDetail(submissionId: string, assignmentId: string): Promise<{
    submission: AssignmentSubmission;
    questions: any[];
    student: any;
    performanceReport: string;
  }> {
    const submission = await this.submissionRepository.findOne({ where: { id: submissionId, assignmentId } });
    if (!submission) throw new NotFoundException('Submission not found');

    let student: any = { id: submission.studentId };
    try {
      const user = await this.usersService.findOne(submission.studentId);
      student = { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, grade: user.grade, xpPoints: user.xpPoints, level: user.level, streakDays: user.streakDays };
    } catch {}

    const questionIds = (submission.answers || []).map((a) => a.questionId).filter(Boolean);
    let questions: any[] = [];
    if (questionIds.length > 0) {
      const result = await this.questionsService.findAll({ ids: questionIds.join(','), status: undefined as any, limit: 100 });
      questions = result.questions.map((q) => {
        const answer = submission.answers?.find((a) => a.questionId === q.id);
        const correctOption = q.options?.find((o) => o.isCorrect);
        const selectedOption = q.options?.find((o) => o.id === answer?.answer);
        return {
          id: q.id,
          content: q.content,
          options: q.options,
          correctAnswer: q.correctAnswer || correctOption?.id || '',
          correctAnswerText: correctOption?.text || q.correctAnswer || '',
          explanation: q.explanation,
          difficulty: q.difficulty,
          marks: q.marks,
          topic: q.topic,
          strandId: q.strandId,
          subStrandId: q.subStrandId,
          studentAnswer: answer?.answer || '',
          studentAnswerText: selectedOption?.text || answer?.answer || '',
          isCorrect: answer?.isCorrect ?? false,
        };
      });
    }

    const correctCount = (submission.answers || []).filter((a) => a.isCorrect).length;
    const totalCount = (submission.answers || []).length;
    const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    const weakTopics = questions
      .filter((q) => !q.isCorrect && q.topic)
      .map((q) => q.topic?.name || 'Unknown')
      .filter((v, i, a) => a.indexOf(v) === i);

    const strongTopics = questions
      .filter((q) => q.isCorrect && q.topic)
      .map((q) => q.topic?.name || 'Unknown')
      .filter((v, i, a) => a.indexOf(v) === i);

    let performanceReport = '';
    if (percentage >= 80) {
      performanceReport = `Excellent performance! The student scored ${percentage}% (${correctCount}/${totalCount}). `;
      if (weakTopics.length > 0) {
        performanceReport += `Minor areas to review: ${weakTopics.join(', ')}. `;
      }
      performanceReport += `Strong areas: ${strongTopics.join(', ') || 'general understanding'}. Recommend challenging extension work to deepen mastery.`;
    } else if (percentage >= 60) {
      performanceReport = `Good effort! The student scored ${percentage}% (${correctCount}/${totalCount}). `;
      performanceReport += `Areas needing attention: ${weakTopics.join(', ') || 'mixed accuracy across questions'}. `;
      performanceReport += `Strengths: ${strongTopics.join(', ') || 'some topics showing good grasp'}. Recommend targeted practice on weak topics and review of incorrect answers.`;
    } else if (percentage >= 40) {
      performanceReport = `The student scored ${percentage}% (${correctCount}/${totalCount}), indicating partial understanding. `;
      performanceReport += `Key areas to re-teach: ${weakTopics.join(', ') || 'most of the covered topics'}. `;
      performanceReport += `Consider one-on-one tutoring session focusing on foundational concepts in these areas before moving forward.`;
    } else {
      performanceReport = `The student scored ${percentage}% (${correctCount}/${totalCount}). This suggests significant gaps in understanding. `;
      performanceReport += `Topics requiring immediate intervention: ${weakTopics.join(', ') || 'the majority of tested concepts'}. `;
      performanceReport += `Recommended actions: (1) Re-teach foundational concepts, (2) Provide simplified practice exercises, (3) Schedule regular progress checks.`;
    }

    if (submission.status === 'submitted') {
      performanceReport += `\n\nNote: This submission has not been graded yet. The analysis above is based on auto-detected correctness.`;
    }

    return { submission, questions, student, performanceReport };
  }

  async getStudentProgressSummary(studentId: string): Promise<any> {
    const [user, submissions, attempts, practiceSessions, courseAssessments] = await Promise.all([
      this.usersService.findOne(studentId).catch(() => null),
      this.submissionRepository.find({ where: { studentId }, order: { submittedAt: 'DESC' } }),
      this.questionsService.getStreakBreakdown(studentId).catch(() => null),
      this.getPracticeSessionsForStudent(studentId).catch(() => []),
      this.getCourseAssessmentStats(studentId).catch(() => null),
    ]);

    const assignmentStats = {
      total: submissions.length,
      graded: submissions.filter((s) => s.status === 'graded').length,
      pending: submissions.filter((s) => s.status === 'submitted').length,
      averageScore: submissions.filter((s) => s.status === 'graded').reduce((sum, s) => sum + (s.score || 0), 0) /
        Math.max(submissions.filter((s) => s.status === 'graded').length, 1),
      totalPoints: submissions.filter((s) => s.status === 'graded').reduce((sum, s) => sum + (s.totalPoints || 0), 0),
      submissions: submissions.map((s) => ({
        id: s.id,
        assignmentId: s.assignmentId,
        score: s.score,
        totalPoints: s.totalPoints,
        status: s.status,
        submittedAt: s.submittedAt,
        gradedAt: s.gradedAt,
        correctCount: (s.answers || []).filter((a) => a.isCorrect).length,
        totalCount: (s.answers || []).length,
      })),
    };

    return {
      userInfo: user ? { xp: user.xpPoints || 0, level: user.level || 1, streak: user.streakDays || 0, firstName: user.firstName, lastName: user.lastName } : null,
      assignments: assignmentStats,
      questionAttempts: attempts,
      practiceSessions: practiceSessions,
      courseAssessments: courseAssessments,
    };
  }

  private async getCourseAssessmentStats(studentId: string): Promise<{ total: number; passed: number; averageScore: number; totalMarks: number; recent: any[] } | null> {
    try {
      const raw = await this.entityManager.query(
        `SELECT id, course_id, score, total_marks, passed, submitted_at FROM course_assessment_attempts WHERE student_id = $1 ORDER BY submitted_at DESC`,
        [studentId],
      );
      if (!raw || raw.length === 0) return null;

      const total = raw.length;
      const passed = raw.filter((r: any) => r.passed).length;
      const totalScore = raw.reduce((sum: number, r: any) => sum + Number(r.score), 0);
      const totalMarks = raw.reduce((sum: number, r: any) => sum + Number(r.total_marks), 0);

      return {
        total,
        passed,
        averageScore: total && totalMarks ? Math.round((totalScore / totalMarks) * 100) : 0,
        totalMarks,
        recent: raw.slice(0, 10).map((r: any) => ({
          id: r.id,
          courseId: r.course_id,
          score: Number(r.score),
          totalMarks: Number(r.total_marks),
          passed: r.passed,
          submittedAt: r.submitted_at,
        })),
      };
    } catch {
      return null;
    }
  }

  private async getPracticeSessionsForStudent(studentId: string): Promise<any[]> {
    try {
      const mod = require('../practice/entities/practice.entity');
      const Entity = mod.PracticeSession;
      if (!Entity) return [];
      const repo = this.submissionRepository.manager.getRepository(Entity);
      return await repo.find({
        where: { userId: studentId },
        order: { createdAt: 'DESC' } as any,
        take: 50,
      });
    } catch {
      return [];
    }
  }
}
