import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PanelController } from './api/panel.controller';
import { PanelTypeOrmRepository } from './infrastructure/panel.repository';
import { PanelService } from './services/panel.service';

@Module({
  imports: [AuthModule],
  controllers: [PanelController],
  providers: [
    PanelTypeOrmRepository,
    { provide: PanelService, inject: [PanelTypeOrmRepository],
      useFactory: (repo: PanelTypeOrmRepository) => new PanelService(repo) },
  ],
})
export class PanelModule {}
