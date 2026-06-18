import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
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

  @Post('generate-questions')
  @ApiOperation({ summary: 'Smart pick or Generate questions using AI for assignment' })
  async generateQuestions(
    @Body() body: { subject: string; grade: number; strand: string; subStrand: string; count: number; forceAi?: boolean },
    @Request() req
  ) {
    return this.assignmentsService.generateQuestions(
      body.subject,
      body.grade,
      body.strand,
      body.subStrand,
      body.count,
      req.user.id,
      body.forceAi
    );
  }

  @Get('my-assignments')
  @ApiOperation({ summary: 'Get all assignments for current teacher' })
  async findMyAssignments(@Request() req) {
    return this.assignmentsService.findAllByTeacher(req.user.id);
  }

  @Get('student')
  @ApiOperation({ summary: 'Get published assignments for student grade' })
  async findForStudent(@Request() req) {
    return this.assignmentsService.findForStudent(Number(req.user.grade));
  }

  @Get('submissions/my')
  @ApiOperation({ summary: 'Get my submissions as a student' })
  async getMySubmissions(@Request() req) {
    return this.assignmentsService.getMySubmissions(req.user.id);
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get assignment statistics' })
  async getStats(@Request() req) {
    return this.assignmentsService.getStats(req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all assignments' })
  async findAll() {
    return this.assignmentsService.findAll();
  }

  @Get('pending-approval')
  @ApiOperation({ summary: 'Get assignments by status (default: pending_approval)' })
  async findPendingApproval(@Request() req, @Query('status') status?: string) {
    return this.assignmentsService.findPendingApproval(req.user.institutionId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assignment by ID' })
  async findOne(@Param('id') id: string) {
    return this.assignmentsService.findOne(id);
  }

  @Get(':id/questions')
  @ApiOperation({ summary: 'Get questions for an assignment (teacher-defined or random)' })
  async getAssignmentQuestions(@Param('id') id: string) {
    return this.assignmentsService.getAssignmentQuestions(id);
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

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit answers for an assignment' })
  async submit(
    @Param('id') id: string,
    @Body() body: { answers: { questionId: string; answer: string }[] },
    @Request() req,
  ) {
    return this.assignmentsService.submitAssignment(id, req.user.id, body.answers);
  }

  @Post(':id/submit-for-approval')
  @ApiOperation({ summary: 'Submit assignment for admin approval' })
  async submitForApproval(@Param('id') id: string, @Request() req) {
    return this.assignmentsService.submitForApproval(id, req.user.id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a pending assignment as admin' })
  async approveAssignment(@Param('id') id: string) {
    return this.assignmentsService.approveAssignment(id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a pending assignment back to draft' })
  async rejectAssignment(@Param('id') id: string) {
    return this.assignmentsService.rejectAssignment(id);
  }

  @Get(':id/submissions')
  @ApiOperation({ summary: 'Get all submissions for an assignment (teacher)' })
  async getSubmissions(@Param('id') id: string) {
    return this.assignmentsService.getSubmissionsForAssignment(id);
  }

  @Post(':id/submissions/:submissionId/auto-grade')
  @ApiOperation({ summary: 'Auto-grade a submission' })
  async autoGrade(
    @Param('id') id: string,
    @Param('submissionId') submissionId: string,
  ) {
    return this.assignmentsService.autoGradeSubmission(id, submissionId);
  }

  @Post(':id/submissions/:submissionId/grade')
  @ApiOperation({ summary: 'Manually grade a submission' })
  async grade(
    @Param('id') id: string,
    @Param('submissionId') submissionId: string,
    @Body() body: { score: number },
    @Request() req,
  ) {
    return this.assignmentsService.gradeSubmission(id, submissionId, req.user.id, body.score);
  }

  @Post(':id/submissions/:submissionId/evaluate-answers')
  @ApiOperation({ summary: 'Evaluate individual answers (mark correct/incorrect) for drawing_canvas and long_answer questions' })
  async evaluateAnswers(
    @Param('id') id: string,
    @Param('submissionId') submissionId: string,
    @Body() body: { evaluations: { questionId: string; isCorrect: boolean }[] },
    @Request() req,
  ) {
    return this.assignmentsService.evaluateAnswers(id, submissionId, req.user.id, body.evaluations);
  }

  @Get(':id/submissions/:submissionId')
  @ApiOperation({ summary: 'Get submission with student details' })
  async getSubmissionWithStudent(
    @Param('id') id: string,
    @Param('submissionId') submissionId: string,
  ) {
    return this.assignmentsService.getSubmissionWithStudent(submissionId, id);
  }

  @Post(':id/submissions/:submissionId/comments')
  @ApiOperation({ summary: 'Add a comment to a submission' })
  async addComment(
    @Param('id') id: string,
    @Param('submissionId') submissionId: string,
    @Body() body: { content: string; questionId?: string; parentId?: string },
    @Request() req,
  ) {
    return this.assignmentsService.addComment(
      id, submissionId, req.user.id, body.content, req.user.role,
      body.questionId, body.parentId,
    );
  }

  @Get(':id/submissions/:submissionId/comments')
  @ApiOperation({ summary: 'Get comments for a submission' })
  async getComments(
    @Param('id') id: string,
    @Param('submissionId') submissionId: string,
  ) {
    return this.assignmentsService.getCommentsForSubmission(submissionId);
  }

  @Get('comments/unread')
  @ApiOperation({ summary: 'Get unread comment count for current user' })
  async getUnreadCommentCount(@Request() req) {
    const count = await this.assignmentsService.getUnreadCommentCount(req.user.id);
    return { count };
  }

  @Get(':id/submissions/:submissionId/detail')
  @ApiOperation({ summary: 'Get full submission detail with questions and AI report' })
  async getSubmissionDetail(
    @Param('id') id: string,
    @Param('submissionId') submissionId: string,
  ) {
    return this.assignmentsService.getSubmissionDetail(submissionId, id);
  }

  @Get('student/:studentId/progress')
  @ApiOperation({ summary: 'Get comprehensive progress summary for a student' })
  async getStudentProgress(@Param('studentId') studentId: string) {
    return this.assignmentsService.getStudentProgressSummary(studentId);
  }
}
