
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Carga las variables del archivo .env
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Configuración de la conexión con PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,

        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<string>('DB_PORT', '5432')),
        username: config.get<string>('DB_USER', 'postgres'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME', 'arreglalo_ya'),

        autoLoadEntities: true,

        // No modificar automáticamente las tablas existentes
        synchronize: false,
      }),
    }),
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
