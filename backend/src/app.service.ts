
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {

  constructor(private readonly dataSource: DataSource) {}

  getHello(): string {
    return 'API Arréglalo Ya funcionando';
  }

  async getHealth() {
    const [resultado] = await this.dataSource.query(
      'SELECT current_database() AS database, NOW() AS server_time'
    );

    return {
      status: 'ok',
      application: 'Arréglalo Ya API',
      database: resultado.database,
      serverTime: resultado.server_time,
    };
  }
}
