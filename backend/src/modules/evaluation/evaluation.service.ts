import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CbcRubricLevel, CbcStudentAssessment, CbcRubricCategory } from './entities';

@Injectable()
export class EvaluationService {
  private readonly logger = new Logger(EvaluationService.name);

  constructor(
    @InjectRepository(CbcRubricLevel)
    private rubricLevelRepository: Repository<CbcRubricLevel>,
    @InjectRepository(CbcStudentAssessment)
    private assessmentRepository: Repository<CbcStudentAssessment>,
  ) {}

  async seedRubricLevels(): Promise<{ count: number }> {
    const existing = await this.rubricLevelRepository.count();
    if (existing > 0) {
      return { count: 0 };
    }

    const levels = [
      { code: 'EE2', name: 'Exceeding Expectation (Level 2)', category: 'exceeding', numericScore: 4.5, subLevel: 2, description: 'Consistently exceeds expectations with exceptional performance', color: '#16A34A', sortOrder: 1 },
      { code: 'EE1', name: 'Exceeding Expectation (Level 1)', category: 'exceeding', numericScore: 4.0, subLevel: 1, description: 'Exceeds expectations in most areas', color: '#22C55E', sortOrder: 2 },
      { code: 'ME2', name: 'Meeting Expectation (Level 2)', category: 'meeting', numericScore: 3.5, subLevel: 2, description: 'Meets expectations with some areas of strength', color: '#3B82F6', sortOrder: 3 },
      { code: 'ME1', name: 'Meeting Expectation (Level 1)', category: 'meeting', numericScore: 3.0, subLevel: 1, description: 'Meets expectations adequately', color: '#60A5FA', sortOrder: 4 },
      { code: 'AE2', name: 'Approaching Expectation (Level 2)', category: 'approaching', numericScore: 2.5, subLevel: 2, description: 'Approaching expectations with growing consistency', color: '#F59E0B', sortOrder: 5 },
      { code: 'AE1', name: 'Approaching Expectation (Level 1)', category: 'approaching', numericScore: 2.0, subLevel: 1, description: 'Beginning to approach expectations', color: '#FBBF24', sortOrder: 6 },
      { code: 'BE', name: 'Below Expectation', category: 'below', numericScore: 1.0, subLevel: null, description: 'Below expected performance, requires support', color: '#EF4444', sortOrder: 7 },
    ];

    const saved = await this.rubricLevelRepository.save(
      levels.map(l => this.rubricLevelRepository.create({
        ...l,
        category: l.category as CbcRubricCategory,
      }))
    );
    this.logger.log(`Seeded ${saved.length} CBC rubric levels`);
    return { count: saved.length };
  }

  async getAllRubricLevels(): Promise<CbcRubricLevel[]> {
    return this.rubricLevelRepository.find({ order: { sortOrder: 'ASC' } });
  }

  async recordAssessment(data: Partial<CbcStudentAssessment>): Promise<CbcStudentAssessment> {
    const rubricLevel = await this.rubricLevelRepository.findOne({ where: { id: data.rubricLevelId } });
    if (!rubricLevel) {
      throw new NotFoundException('Rubric level not found');
    }
    const assessment = this.assessmentRepository.create(data);
    return this.assessmentRepository.save(assessment);
  }

  async bulkRecordAssessments(assessments: Partial<CbcStudentAssessment>[]): Promise<CbcStudentAssessment[]> {
    const created: CbcStudentAssessment[] = [];
    for (const data of assessments) {
      const rubricLevel = await this.rubricLevelRepository.findOne({ where: { id: data.rubricLevelId } });
      if (!rubricLevel) continue;
      const assessment = this.assessmentRepository.create(data);
      created.push(await this.assessmentRepository.save(assessment));
    }
    return created;
  }

  async getStudentAssessments(studentId: string, subjectId?: string, term?: string): Promise<CbcStudentAssessment[]> {
    const query = this.assessmentRepository.createQueryBuilder('a')
      .leftJoinAndSelect('a.rubricLevel', 'rubricLevel')
      .where('a.studentId = :studentId', { studentId })
      .orderBy('a.assessmentDate', 'DESC');

    if (subjectId) {
      query.andWhere('a.subjectId = :subjectId', { subjectId });
    }
    if (term) {
      query.andWhere('a.term = :term', { term });
    }

    return query.getMany();
  }

  async getChildrenAssessments(parentId: string): Promise<any[]> {
    const relations = await this.assessmentRepository.query(
      `SELECT r.user_id as student_id, u.id, u.email, u."firstName", u."lastName", u.grade, u.stream
       FROM user_relationships r
       JOIN users u ON u.id::text = r.user_id
       WHERE r.related_user_id = $1
         AND r.is_active = true
         AND r."relationshipType" IN ('parent', 'mother', 'father', 'guardian')
         AND u.role = 'student'`,
      [parentId],
    );

    const results: any[] = [];
    for (const child of relations) {
      const assessments = await this.assessmentRepository.createQueryBuilder('a')
        .leftJoinAndSelect('a.rubricLevel', 'rubricLevel')
        .where('a.studentId = :studentId', { studentId: child.student_id })
        .orderBy('a.assessmentDate', 'DESC')
        .getMany();

      const subjectSummary = this.computeSubjectSummary(assessments);

      results.push({
        child: {
          id: child.student_id,
          firstName: child.firstName,
          lastName: child.lastName,
          grade: child.grade,
          stream: child.stream,
        },
        assessments,
        subjectSummary,
        totalAssessments: assessments.length,
      });
    }
    return results;
  }

  async getStudentSubjectReport(studentId: string, subjectId: string): Promise<any> {
    const assessments = await this.assessmentRepository.createQueryBuilder('a')
      .leftJoinAndSelect('a.rubricLevel', 'rubricLevel')
      .where('a.studentId = :studentId', { studentId })
      .andWhere('a.subjectId = :subjectId', { subjectId })
      .orderBy('a.assessmentDate', 'DESC')
      .getMany();

    const subjectSummary = this.computeSubjectSummary(assessments);

    return {
      studentId,
      subjectId,
      assessments,
      summary: subjectSummary,
      totalAssessments: assessments.length,
    };
  }

  private computeSubjectSummary(assessments: CbcStudentAssessment[]): any {
    if (!assessments.length) return null;

    const byCategory: Record<string, { count: number; scores: number[] }> = {};
    for (const a of assessments) {
      const cat = a.rubricLevel?.category || 'unknown';
      if (!byCategory[cat]) {
        byCategory[cat] = { count: 0, scores: [] };
      }
      byCategory[cat].count++;
      byCategory[cat].scores.push(Number(a.rubricLevel?.numericScore || 0));
    }

    const totalScore = assessments.reduce((sum, a) => sum + Number(a.rubricLevel?.numericScore || 0), 0);
    const averageScore = assessments.length > 0 ? totalScore / assessments.length : 0;

    const highestAssessment = assessments.reduce((best, a) =>
      Number(a.rubricLevel?.numericScore || 0) > Number(best?.rubricLevel?.numericScore || 0) ? a : best
    , assessments[0]);

    const lowestAssessment = assessments.reduce((worst, a) =>
      Number(a.rubricLevel?.numericScore || 0) < Number(worst?.rubricLevel?.numericScore || 0) ? a : worst
    , assessments[0]);

    const categoryCount = Object.keys(byCategory).length;

    const dominantCategory = Object.entries(byCategory)
      .sort(([, a], [, b]) => b.count - a.count || b.scores.reduce((s, v) => s + v, 0) / b.scores.length - a.scores.reduce((s, v) => s + v, 0) / a.scores.length)[0];

    return {
      totalScore: Math.round(totalScore * 10) / 10,
      averageScore: Math.round(averageScore * 100) / 100,
      highestRubricLevel: highestAssessment.rubricLevel?.code || null,
      lowestRubricLevel: lowestAssessment.rubricLevel?.code || null,
      dominantCategory: dominantCategory ? dominantCategory[0] : null,
      byCategory,
    };
  }
}
