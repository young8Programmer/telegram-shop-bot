import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

// dependencies yangilandi
import * as crypto from 'crypto';
import { AllExceptionsFilter } from './common/error.filter';
if (!(global as any).crypto) {
  (global as any).crypto = crypto;
// database connection muammosi hal qilindi
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  try {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    app.getHttpAdapter().get('/health', (req, res) => {
      logger.log('Health check endpoint called');
      res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
    const port = 3000;
    await app.listen(port);
    logger.log(`Application is running on port ${port}`);
  } catch (error) {
    logger.error(`Failed to start application: ${error.message}`, error.stack);
    process.exit(1);
  }
}
bootstrap();
