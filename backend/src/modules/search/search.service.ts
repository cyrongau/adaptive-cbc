import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Question } from '../questions/entities/question.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { Topic } from '../topics/entities/topic.entity';
import { User } from '../users/entities/user.entity';
import { Institution } from '../institutions/entities/institution.entity';
import { PastPaper } from '../digital-library/entities/digital-library.entity';
import { TutorProfile } from '../tutors/entities/tutor.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Institution)
    private institutionRepository: Repository<Institution>,
    @InjectRepository(PastPaper)
    private pastPaperRepository: Repository<PastPaper>,
    @InjectRepository(TutorProfile)
    private tutorProfileRepository: Repository<TutorProfile>,
  ) {}

  async searchAll(query: string, limit: number = 20): Promise<any> {
    const searchTerm = `%${query}%`;

    const [questions, subjects, topics, institutions, pastPapers, tutors] = await Promise.all([
      this.questionRepository.find({
        where: [{ content: ILike(searchTerm) }, { tags: ILike(searchTerm) }],
        take: Math.min(limit, 10),
      }),
      this.subjectRepository.find({
        where: [{ name: ILike(searchTerm) }, { description: ILike(searchTerm) }],
        take: Math.min(limit, 5),
      }),
      this.topicRepository.find({
        where: [{ name: ILike(searchTerm) }, { description: ILike(searchTerm) }],
        take: Math.min(limit, 10),
      }),
      this.institutionRepository.find({
        where: [{ name: ILike(searchTerm) }, { county: ILike(searchTerm) }, { description: ILike(searchTerm) }],
        take: Math.min(limit, 5),
      }),
      this.pastPaperRepository.find({
        where: [{ title: ILike(searchTerm) }, { description: ILike(searchTerm) }],
        take: Math.min(limit, 10),
        order: { createdAt: 'DESC' },
      }),
      this.tutorProfileRepository.find({
        where: [{ bio: ILike(searchTerm) }, { headline: ILike(searchTerm) }, { qualifications: ILike(searchTerm) }],
        take: Math.min(limit, 10),
        relations: ['user'],
      }),
    ]);

    return {
      questions: questions.map(q => ({
        id: q.id,
        type: 'question',
        title: q.content?.slice(0, 100) || '',
        subject: q.subjectId,
        grade: q.grade,
        difficulty: q.difficulty,
        tags: q.tags,
      })),
      subjects: subjects.map(s => ({
        id: s.id,
        type: 'subject',
        title: s.name,
        description: s.description,
        grade: s.grade,
      })),
      topics: topics.map(t => ({
        id: t.id,
        type: 'topic',
        title: t.name,
        description: t.description,
        subject: t.subjectId,
        grade: t.grade,
      })),
      schools: institutions.map(i => ({
        id: i.id,
        type: 'school',
        title: i.name,
        description: i.description,
        county: i.county,
        type: i.type,
      })),
      materials: pastPapers.map(p => ({
        id: p.id,
        type: 'material',
        title: p.title,
        description: p.description,
        subject: p.subjectId,
        grade: p.grade,
        paperType: p.paperType,
        year: p.year,
      })),
      tutors: tutors.map(t => ({
        id: t.id,
        type: 'tutor',
        title: t.headline || `${t.user?.firstName || ''} ${t.user?.lastName || ''}`.trim(),
        description: t.bio?.slice(0, 150),
        subjects: t.subjects,
        experienceYears: t.experienceYears,
        status: t.status,
      })),
      total: questions.length + subjects.length + topics.length + institutions.length + pastPapers.length + tutors.length,
    };
  }

  async searchByType(query: string, type: string, limit: number = 20): Promise<any[]> {
    const searchTerm = `%${query}%`;

    switch (type) {
      case 'questions':
        return this.questionRepository.find({
          where: [{ content: ILike(searchTerm) }, { tags: ILike(searchTerm) }],
          take: limit,
        });
      case 'subjects':
        return this.subjectRepository.find({
          where: [{ name: ILike(searchTerm) }, { description: ILike(searchTerm) }],
          take: limit,
        });
      case 'topics':
        return this.topicRepository.find({
          where: [{ name: ILike(searchTerm) }, { description: ILike(searchTerm) }],
          take: limit,
        });
      case 'schools':
        return this.institutionRepository.find({
          where: [{ name: ILike(searchTerm) }, { county: ILike(searchTerm) }],
          take: limit,
        });
      case 'materials':
        return this.pastPaperRepository.find({
          where: [{ title: ILike(searchTerm) }, { description: ILike(searchTerm) }],
          take: limit,
          order: { createdAt: 'DESC' },
        });
      case 'tutors':
        return this.tutorProfileRepository.find({
          where: [{ bio: ILike(searchTerm) }, { headline: ILike(searchTerm) }],
          take: limit,
          relations: ['user'],
        });
      default:
        return [];
    }
  }
}
