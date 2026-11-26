
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';

import { ReclamosController } from './api/reclamos.controller';
import { OperacionesReclamosController } from './api/operaciones.controller';

import { ConfiguracionEscalamientoController,} from './api/configuracion-escalamiento.controller';

import { ReclamosTypeOrmRepository, } from './infrastructure/consulta.typeorm-repository';

import { OperacionesReclamosTypeOrmRepository,} from './infrastructure/operaciones.repository';

import { ConfiguracionEscalamientoTypeOrmRepository,} from './infrastructure/configuracion-escalamiento.typeorm-repository';

import { ConsultarReclamosService,} from './services/consultar.service';

import { OperacionesReclamosService,} from './services/operaciones.service';

import { ConfiguracionEscalamientoService,} from './services/configuracion-escalamiento.service';

@Module({
  imports: [AuthModule],

  controllers: [
    OperacionesReclamosController,
    ReclamosController,
    ConfiguracionEscalamientoController,
  ],

  providers: [
    OperacionesReclamosTypeOrmRepository,

    {
      provide: OperacionesReclamosService,
      inject: [OperacionesReclamosTypeOrmRepository],
      useFactory: (repo: OperacionesReclamosTypeOrmRepository) =>
        new OperacionesReclamosService(repo),
    },

    ReclamosTypeOrmRepository,

    {
      provide: ConsultarReclamosService,
      inject: [ReclamosTypeOrmRepository],
      useFactory: (repo: ReclamosTypeOrmRepository) =>
        new ConsultarReclamosService(repo),
    },

    ConfiguracionEscalamientoTypeOrmRepository,

    {
      provide: ConfiguracionEscalamientoService,
      inject: [ConfiguracionEscalamientoTypeOrmRepository],
      useFactory: (
        repo: ConfiguracionEscalamientoTypeOrmRepository
      ) => new ConfiguracionEscalamientoService(repo),
    },
  ],
})
export class ReclamosModule {}
