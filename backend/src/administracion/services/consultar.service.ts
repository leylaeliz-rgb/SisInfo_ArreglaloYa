import { AdministracionRepository } from '../core/consulta.repository';

export class ConsultarAdministracionService {
  constructor(private readonly repositorio: AdministracionRepository) {}

  listar() {
    return this.repositorio.listar();
  }
}
