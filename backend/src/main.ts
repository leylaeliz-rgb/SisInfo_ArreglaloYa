
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);

  // Permitir comunicación con Angular durante el desarrollo
  app.enableCors({
    origin: 'http://localhost:4200',
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
