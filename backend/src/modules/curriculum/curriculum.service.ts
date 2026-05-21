import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CbcStrand, CbcSubStrand, CbcLearningOutcome, CbcCompetency } from './entities/cbc-taxonomy.entity';

@Injectable()
export class CurriculumService {
  constructor(
    @InjectRepository(CbcStrand)
    private strandRepository: Repository<CbcStrand>,
    @InjectRepository(CbcSubStrand)
    private subStrandRepository: Repository<CbcSubStrand>,
    @InjectRepository(CbcLearningOutcome)
    private learningOutcomeRepository: Repository<CbcLearningOutcome>,
    @InjectRepository(CbcCompetency)
    private competencyRepository: Repository<CbcCompetency>,
  ) {}

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
