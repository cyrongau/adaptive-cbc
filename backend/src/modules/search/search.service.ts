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
import { Course, CourseStatus } from '../courses/entities/course.entity';
import { Product, ProductStatus } from '../store/entities/store.entity';
import { Assignment } from '../assignments/entities/assignment.entity';

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
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Assignment)
    private assignmentRepository: Repository<Assignment>,
  ) {}

  async searchAll(query: string, limit: number = 20): Promise<any> {
    const searchTerm = `%${query}%`;

    const [questions, subjects, topics, institutions, pastPapers, tutors, courses, products, assignments] = await Promise.all([
      this.questionRepository.find({
        where: [{ content: ILike(searchTerm) }],
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
      this.courseRepository.find({
        where: [
          { title: ILike(searchTerm), status: CourseStatus.PUBLISHED },
          { description: ILike(searchTerm), status: CourseStatus.PUBLISHED },
          { subtitle: ILike(searchTerm), status: CourseStatus.PUBLISHED },
        ],
        take: Math.min(limit, 10),
      }),
      this.productRepository.find({
        where: [
          { title: ILike(searchTerm), status: ProductStatus.PUBLISHED },
          { description: ILike(searchTerm), status: ProductStatus.PUBLISHED },
        ],
        take: Math.min(limit, 10),
      }),
      this.assignmentRepository.find({
        where: [
          { title: ILike(searchTerm), status: 'published' },
          { description: ILike(searchTerm), status: 'published' },
        ],
        take: Math.min(limit, 10),
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
      })),
      subjects: subjects.map(s => ({
        id: s.id,
        type: 'subject',
        title: s.name,
        description: s.description,
      })),
      topics: topics.map(t => ({
        id: t.id,
        type: 'topic',
        title: t.name,
        description: t.description,
        subject: t.subjectId,
      })),
      schools: institutions.map(i => ({
        id: i.id,
        type: 'school',
        title: i.name,
        description: i.description,
        county: i.county,
        schoolType: i.type,
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
      courses: courses.map(c => ({
        id: c.id,
        type: 'course',
        title: c.title,
        description: c.description?.slice(0, 150),
        subject: c.subject,
        grade: c.grade,
        thumbnail: c.thumbnail,
        featuredImage: c.featuredImage,
        price: c.price,
        averageRating: c.averageRating,
        totalLessons: c.totalLessons,
        level: c.level,
      })),
      products: products.map(p => ({
        id: p.id,
        type: 'product',
        title: p.title,
        description: p.description?.slice(0, 150),
        productType: p.productType,
        category: p.category,
        price: p.price,
        originalPrice: p.originalPrice,
        thumbnailUrl: p.thumbnailUrl,
        images: p.images,
      })),
      assignments: assignments.map(a => ({
        id: a.id,
        type: 'assignment',
        title: a.title,
        description: a.description?.slice(0, 150),
        subject: a.subject,
        topic: a.topic,
        grade: a.grade,
        dueDate: a.dueDate,
        totalPoints: a.totalPoints,
      })),
      total: questions.length + subjects.length + topics.length + institutions.length + pastPapers.length + tutors.length + courses.length + products.length + assignments.length,
    };
  }

  async searchByType(query: string, type: string, limit: number = 20): Promise<any[]> {
    const searchTerm = `%${query}%`;

    switch (type) {
      case 'questions':
        return this.questionRepository.find({
          where: [{ content: ILike(searchTerm) }],
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
      case 'courses':
        return this.courseRepository.find({
          where: [
            { title: ILike(searchTerm), status: CourseStatus.PUBLISHED },
            { description: ILike(searchTerm), status: CourseStatus.PUBLISHED },
          ],
          take: limit,
        });
      case 'products':
        return this.productRepository.find({
          where: [
            { title: ILike(searchTerm), status: ProductStatus.PUBLISHED },
            { description: ILike(searchTerm), status: ProductStatus.PUBLISHED },
          ],
          take: limit,
        });
      case 'assignments':
        return this.assignmentRepository.find({
          where: [
            { title: ILike(searchTerm), status: 'published' },
            { description: ILike(searchTerm), status: 'published' },
          ],
          take: limit,
        });
      default:
        return [];
    }
  }
}
