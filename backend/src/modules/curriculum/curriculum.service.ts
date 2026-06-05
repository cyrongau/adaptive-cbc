import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CbcStrand, CbcSubStrand, CbcLearningOutcome, CbcCompetency, CompetencyCategory } from './entities/cbc-taxonomy.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { CBC_SUBJECTS, CBC_COMPETENCIES } from '../../seed-data/cbc-curriculum.data';

@Injectable()
export class CurriculumService {
  private readonly logger = new Logger(CurriculumService.name);

  constructor(
    @InjectRepository(CbcStrand)
    private strandRepository: Repository<CbcStrand>,
    @InjectRepository(CbcSubStrand)
    private subStrandRepository: Repository<CbcSubStrand>,
    @InjectRepository(CbcLearningOutcome)
    private learningOutcomeRepository: Repository<CbcLearningOutcome>,
    @InjectRepository(CbcCompetency)
    private competencyRepository: Repository<CbcCompetency>,
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
    private dataSource: DataSource,
  ) {}

  async seedAll(): Promise<{ subjects: number; strands: number; subStrands: number; outcomes: number; competencies: number }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const existingSubjects = await this.subjectRepository.count();
      if (existingSubjects > 0) {
        await queryRunner.rollbackTransaction();
        this.logger.warn('Subjects already exist, skipping seed');
        return { subjects: 0, strands: 0, subStrands: 0, outcomes: 0, competencies: 0 };
      }

      let subjectCount = 0;
      let strandCount = 0;
      let subStrandCount = 0;
      let outcomeCount = 0;

      for (const subjectData of CBC_SUBJECTS) {
        const subject = this.subjectRepository.create({
          name: subjectData.name,
          code: subjectData.code,
          description: subjectData.description,
          icon: subjectData.icon,
          color: subjectData.color,
          applicableGrades: subjectData.applicableGrades,
        });
        const savedSubject = await queryRunner.manager.save(subject);
        subjectCount++;

        for (const strandData of subjectData.strands) {
          const strand = this.strandRepository.create({
            name: strandData.name,
            code: strandData.code,
            subjectId: savedSubject.id,
            description: strandData.description,
            applicableGrades: strandData.applicableGrades,
            sortOrder: strandData.sortOrder,
          });
          const savedStrand = await queryRunner.manager.save(strand);
          strandCount++;

          for (const subStrandData of strandData.subStrands) {
            const subStrand = this.subStrandRepository.create({
              name: subStrandData.name,
              code: subStrandData.code,
              strandId: savedStrand.id,
              description: subStrandData.description,
              applicableGrades: subStrandData.applicableGrades,
              sortOrder: subStrandData.sortOrder,
            });
            const savedSubStrand = await queryRunner.manager.save(subStrand);
            subStrandCount++;

            for (const outcomeData of subStrandData.learningOutcomes) {
              const outcome = this.learningOutcomeRepository.create({
                description: outcomeData.description,
                code: outcomeData.code,
                subStrandId: savedSubStrand.id,
                grade: outcomeData.grade,
                competencies: outcomeData.competencies,
                sortOrder: outcomeData.sortOrder,
              });
              await queryRunner.manager.save(outcome);
              outcomeCount++;
            }
          }
        }
      }

      let competencyCount = 0;
      for (const compData of CBC_COMPETENCIES) {
        const existing = await queryRunner.manager.findOne(CbcCompetency, { where: { code: compData.code } });
        if (!existing) {
          const comp = this.competencyRepository.create({
            ...compData,
            category: compData.category as CompetencyCategory,
          });
          await queryRunner.manager.save(comp);
          competencyCount++;
        }
      }

      await queryRunner.commitTransaction();
      this.logger.log(`Seed complete: ${subjectCount} subjects, ${strandCount} strands, ${subStrandCount} sub-strands, ${outcomeCount} outcomes, ${competencyCount} competencies`);
      return { subjects: subjectCount, strands: strandCount, subStrands: subStrandCount, outcomes: outcomeCount, competencies: competencyCount };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Seed failed, rolling back', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllStrands(subjectId?: string) {
    const query = this.strandRepository.createQueryBuilder('strand')
      .leftJoinAndSelect('strand.subStrands', 'subStrand')
      .orderBy('strand.sortOrder', 'ASC');

    if (subjectId) {
      query.where('strand.subjectId = :subjectId', { subjectId });
    }

    return query.getMany();
  }

  async createStrand(data: Partial<CbcStrand>) {
    const strand = this.strandRepository.create(data);
    return this.strandRepository.save(strand);
  }

  async getCurriculumTree(subjectId: string, grade?: number) {
    const query = this.strandRepository.createQueryBuilder('strand')
      .leftJoinAndSelect('strand.subStrands', 'subStrand')
      .leftJoinAndSelect('subStrand.learningOutcomes', 'learningOutcome')
      .where('strand.subjectId = :subjectId', { subjectId })
      .orderBy('strand.sortOrder', 'ASC')
      .addOrderBy('subStrand.sortOrder', 'ASC')
      .addOrderBy('learningOutcome.sortOrder', 'ASC');

    if (grade) {
      query.andWhere(':grade = ANY(strand.applicableGrades)', { grade })
           .andWhere(':grade = ANY(subStrand.applicableGrades)', { grade })
           .andWhere('learningOutcome.grade = :grade', { grade });
    }

    return query.getMany();
  }

  // Basic CRUD for SubStrands
  async createSubStrand(data: Partial<CbcSubStrand>) {
    const subStrand = this.subStrandRepository.create(data);
    return this.subStrandRepository.save(subStrand);
  }

  // Basic CRUD for Learning Outcomes
  async createLearningOutcome(data: Partial<CbcLearningOutcome>) {
    const outcome = this.learningOutcomeRepository.create(data);
    return this.learningOutcomeRepository.save(outcome);
  }

  // Basic CRUD for Competencies
  async createCompetency(data: Partial<CbcCompetency>) {
    const competency = this.competencyRepository.create(data);
    return this.competencyRepository.save(competency);
  }

  async findAllCompetencies() {
    return this.competencyRepository.find();
  }
}
