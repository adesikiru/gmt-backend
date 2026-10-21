import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'https://gmt-ogun.vercel.app',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.replace(/\/$/, '')] : []),
  ];
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (e.g. Postman, mobile apps, server-to-server)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin);
      if (
        isLocalhost ||
        allowedOrigins.includes(cleanOrigin) ||
        cleanOrigin.endsWith('.vercel.app') ||
        cleanOrigin.endsWith('.onrender.com')
      ) {
        return callback(null, true);
      }
      // Return false without throwing an unhandled exception
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`🚀 GMT Backend running on http://localhost:${port}`);
}

await bootstrap();
