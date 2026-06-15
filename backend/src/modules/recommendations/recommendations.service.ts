import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudyGoal } from './entities/study-goal.entity';
import { Recommendation, RecommendationType } from './entities/recommendation.entity';
import { QuestionsService } from '../questions/questions.service';

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectRepository(StudyGoal)
    private studyGoalRepository: Repository<StudyGoal>,
    @InjectRepository(Recommendation)
    private recommendationRepository: Repository<Recommendation>,
    private questionsService: QuestionsService,
  ) {}

  async createGoal(userId: string, data: { title: string; description?: string; subjectId?: string; topicId?: string; targetScore?: number; deadline?: Date }): Promise<StudyGoal> {
    const goal = this.studyGoalRepository.create({
      userId,
      title: data.title,
      description: data.description,
      subjectId: data.subjectId,
      topicId: data.topicId,
      targetScore: data.targetScore || 80,
      status: 'active',
      deadline: data.deadline,
    });
    return this.studyGoalRepository.save(goal);
  }

  async getUserGoals(userId: string): Promise<StudyGoal[]> {
    return this.studyGoalRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateGoal(id: string, userId: string, data: Partial<StudyGoal>): Promise<StudyGoal> {
    const goal = await this.studyGoalRepository.findOne({ where: { id, userId } });
    if (!goal) throw new NotFoundException('Goal not found');
    Object.assign(goal, data);
    if (data.currentScore !== undefined && goal.targetScore > 0) {
      goal.progress = Math.min(100, Math.round((data.currentScore / goal.targetScore) * 100));
      if (goal.progress >= 100) goal.status = 'completed';
    }
    return this.studyGoalRepository.save(goal);
  }

  async completeGoal(id: string, userId: string): Promise<StudyGoal> {
    return this.updateGoal(id, userId, { status: 'completed', progress: 100, currentScore: 100 });
  }

  async deleteGoal(id: string, userId: string): Promise<void> {
    const goal = await this.studyGoalRepository.findOne({ where: { id, userId } });
    if (!goal) throw new NotFoundException('Goal not found');
    await this.studyGoalRepository.remove(goal);
  }

  async generateRecommendations(userId: string, grade: number): Promise<Recommendation[]> {
    const existing = await this.recommendationRepository.find({
      where: { userId, isDismissed: false },
      take: 20,
    });
    if (existing.length > 10) return existing;

    const streak = await this.questionsService.getStreakBreakdown(userId);
    const weakSubjects = Object.entries(streak.bySubject)
      .filter(([_, data]) => data.total >= 2 && data.correct / data.total < 0.6)
      .sort(([_, a], [__, b]) => (a.correct / a.total) - (b.correct / b.total));

    const newRecs: Recommendation[] = [];

    for (const [subjectId, data] of weakSubjects.slice(0, 3)) {
      const exists = existing.some((r) => r.subjectId === subjectId && r.type === RecommendationType.PRACTICE);
      if (!exists) {
        newRecs.push(this.recommendationRepository.create({
          userId,
          type: RecommendationType.PRACTICE,
          title: 'Practice this subject',
          description: `You scored ${Math.round((data.correct / data.total) * 100)}% in this subject. Regular practice will improve your understanding.`,
          subjectId,
          priority: 2,
        }));
      }
    }

    if (streak.totalAttempts === 0) {
      newRecs.push(this.recommendationRepository.create({
        userId,
        type: RecommendationType.GOAL,
        title: 'Start your learning journey',
        description: 'Set a study goal and begin practicing to track your improvement.',
        priority: 1,
      }));
    }

    const goalRecs = newRecs.filter((r) => r.type === RecommendationType.GOAL);
    if (goalRecs.length > 0) {
      return this.recommendationRepository.save([...newRecs, ...existing.filter((r) => !newRecs.some((n) => n.title === r.title))]);
    }

    return this.recommendationRepository.save(newRecs);
  }

  async getUserRecommendations(userId: string): Promise<Recommendation[]> {
    return this.recommendationRepository.find({
      where: { userId, isDismissed: false },
      order: { priority: 'ASC', createdAt: 'DESC' },
      take: 20,
    });
  }

  async dismissRecommendation(id: string, userId: string): Promise<void> {
    await this.recommendationRepository.update({ id, userId }, { isDismissed: true });
  }

  async getWeakAreas(userId: string): Promise<{ subjectId?: string; topicId?: string; label: string; score: number; total: number }[]> {
    const streak = await this.questionsService.getStreakBreakdown(userId);
    const weak: any[] = [];

    for (const [subjectId, data] of Object.entries(streak.bySubject)) {
      if (data.total >= 2 && data.correct / data.total < 0.7) {
        weak.push({
          subjectId,
          label: `Subject (${Math.round((data.correct / data.total) * 100)}% accuracy)`,
          score: data.correct,
          total: data.total,
        });
      }
    }
    return weak.sort((a, b) => (a.score / a.total) - (b.score / b.total));
  }
}
