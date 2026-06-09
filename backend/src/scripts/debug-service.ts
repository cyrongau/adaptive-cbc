import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { QuestionsService } from '../modules/questions/questions.service';
import { QuestionStatus } from '../modules/questions/entities/question.entity';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const questionsService = app.get(QuestionsService);

  console.log('QuestionStatus.PUBLISHED:', QuestionStatus.PUBLISHED);

  const params = {
    status: 'published' as any,
    grade: 4,
    subjectId: '41ffae87-75b0-4358-9639-0f8711691eb1',
  };
  console.log('Testing comparison:', params.status === QuestionStatus.PUBLISHED);
  
  const res = await questionsService.findAll(params);
  console.log('Result count:', res.questions.length, 'total:', res.total);
  console.log('Questions found:', res.questions.map(q => ({ id: q.id, status: q.status })));

  await app.close();
}

main().catch(console.error);
