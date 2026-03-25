import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  const origins = configService.get<string>('CORS_ORIGIN', '')
    .split(',')
    .map(o => o.trim())
    .filter(o => o);

  console.log('CORS Whitelist:', origins);

  app.enableCors({
    origin: (origin, callback) => {
      console.log('Incoming Request Origin:', origin);
      if (!origin || origins.length === 0 || origins.includes(origin) || origins.includes('*')) {
        callback(null, true);
      } else {
        console.error('CORS Blocked for:', origin);
        callback(new Error('Bloqueado por CORS'));
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.setGlobalPrefix('api');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Event Manager API')
    .setDescription(
      'API del sistema de gestion de la 75 Convencion Nacional del Club de Leones Bolivia',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
}

void bootstrap();

