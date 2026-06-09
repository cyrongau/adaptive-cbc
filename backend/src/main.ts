import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser());

  app.setGlobalPrefix('api/v1');

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3003',
      'http://localhost:8100',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3003',
      'http://127.0.0.1:8100',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  const config = new DocumentBuilder()
    .setTitle('Adaptive CBC Learning API')
    .setDescription('API documentation for the Adaptive CBC Learning Platform')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('onboarding', 'Student onboarding')
    .addTag('subjects', 'Subject management')
    .addTag('questions', 'Question bank')
    .addTag('practice', 'Practice sessions')
    .addTag('exams', 'Exam mode')
    .addTag('tutors', 'Tutor management')
    .addTag('institutions', 'Institutional accounts')
    .addTag('gamification', 'Gamification features')
    .addTag('analytics', 'Analytics and reporting')
    .addTag('digital-library', 'Past papers & digital library')
    .addTag('ocr', 'OCR processing for digitizing papers')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3002;

  // Ensure PostgreSQL enum has all required values
  try {
    const dataSource = app.get(DataSource);
    await dataSource.query(`ALTER TYPE "public"."question_status_enum" ADD VALUE IF NOT EXISTS 'rejected'`);
    await dataSource.query(`ALTER TYPE "public"."question_status_enum" ADD VALUE IF NOT EXISTS 'archived'`);
  } catch (e) {
    console.log('Enum sync skipped (may already exist or not applicable):', (e as Error).message);
  }

  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();