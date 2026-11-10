import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import {
  AccionPago, OperacionesPagoRepository, PagoNoPermitido, PagoRegistrado, ServicioInaccesible,
} from '../core/operaciones-pago';

const columnas = 'id, servicio_id, tipo, monto, moneda, metodo, estado';

@Injectable()
export class OperacionesPagoTypeOrmRepository implements OperacionesPagoRepository {
  constructor(private readonly db: DataSource) {}

  ejecutar(servicioId: string, usuarioId: string, accion: AccionPago): Promise<PagoRegistrado> {
    return this.db.transaction(async (tx) => {
      const [servicio] = await tx.query(
        'SELECT cliente_id, trabajador_id, estado, iniciado_en, cancelado_por, fecha_visita, cancelado_en FROM servicios WHERE id = $1 FOR UPDATE',
        [servicioId],
      );
      if (accion.tipo === 'revertir-anticipo') {
        if (!servicio) throw new ServicioInaccesible('No se encontró el servicio.');
        if (servicio.estado !== 'cancelado' || servicio.iniciado_en) {
          throw new PagoNoPermitido('La reversión requiere un servicio cancelado antes de iniciar.');
        }
        if (servicio.cancelado_por === servicio.cliente_id &&
            (!servicio.fecha_visita || !servicio.cancelado_en ||
             servicio.fecha_visita.getTime() - servicio.cancelado_en.getTime() < 7_200_000)) {
          throw new PagoNoPermitido('La cancelación del cliente no cumple la ventana de devolución.');
        }
        const [pago]: PagoRegistrado[] = await tx.query(
          `SELECT ${columnas} FROM pagos WHERE servicio_id=$1 AND tipo='anticipo'
           AND metodo='qr_simulado' AND estado='confirmado'`,
          [servicioId],
        );
        if (!pago) throw new PagoNoPermitido('No hay un anticipo simulado confirmado.');
        await tx.query(
          `INSERT INTO reversiones_pago_simulado (pago_id, registrada_por, motivo)
           VALUES ($1,$2,$3) ON CONFLICT (pago_id) DO NOTHING`,
          [pago.id, usuarioId, accion.motivo],
        );
        return { ...pago, estado: 'revertido' };
      }

      const participante = accion.tipo === 'confirmar-saldo' ? servicio?.trabajador_id : servicio?.cliente_id;
      if (participante !== usuarioId) {
        throw new ServicioInaccesible('No se encontró el servicio para esta operación.');
      }

      const tipo = accion.tipo === 'anticipo' ? 'anticipo' : 'saldo';
      const [pago]: PagoRegistrado[] = await tx.query(
        `SELECT ${columnas} FROM pagos WHERE servicio_id = $1 AND tipo = $2 FOR UPDATE`,
        [servicioId, tipo],
      );
      if (servicio.estado === 'cancelado') {
        throw new PagoNoPermitido('El servicio está cancelado.');
      }

      if (accion.tipo === 'confirmar-saldo') {
        if (servicio.estado !== 'finalizado' || !pago || !['reportado', 'confirmado'].includes(pago.estado)) {
          throw new PagoNoPermitido('El cliente debe reportar el saldo después de finalizar el servicio.');
        }
        const [reporte] = await tx.query(
          "SELECT 1 FROM confirmaciones_pago WHERE pago_id = $1 AND tipo_confirmacion = 'cliente_pago' AND usuario_id = $2",
          [pago.id, servicio.cliente_id],
        );
        if (!reporte) {
          throw new PagoNoPermitido('Falta la confirmación del cliente.');
        }
        await this.confirmar(tx, pago.id, usuarioId, 'trabajador_recepcion');
        await tx.query(
          "UPDATE pagos SET estado = 'confirmado', confirmado_en = COALESCE(confirmado_en, NOW()) WHERE id = $1",
          [pago.id],
        );
        return { ...pago, estado: 'confirmado' };
      }

      const metodo = accion.tipo === 'anticipo' ? 'qr_simulado' : accion.metodo;
      if (pago) {
        if (pago.metodo !== metodo || !['reportado', 'confirmado'].includes(pago.estado)) {
          throw new PagoNoPermitido('Ya existe un registro de pago con otras condiciones.');
        }
        return pago;
      }

      if (tipo === 'anticipo' && !['precio_fijado', 'agendado'].includes(servicio.estado)) {
        throw new PagoNoPermitido('El anticipo requiere un precio fijado y un servicio sin iniciar.');
      }
      if (tipo === 'saldo' && servicio.estado !== 'finalizado') {
        throw new PagoNoPermitido('El saldo se reporta después de finalizar el servicio.');
      }

      const [resumen] = await tx.query(
        `SELECT moneda, total_acordado, ROUND(total_acordado * 0.25, 2) AS anticipo
         FROM resumen_financiero_servicio WHERE servicio_id = $1`,
        [servicioId],
      );
      if (!resumen) {
        throw new PagoNoPermitido('Falta el resumen financiero del servicio.');
      }
      const [anticipo] = tipo === 'saldo' ? await tx.query(
        "SELECT monto FROM pagos WHERE servicio_id = $1 AND tipo = 'anticipo' AND estado = 'confirmado' AND metodo = 'qr_simulado'",
        [servicioId],
      ) : [];
      if (tipo === 'saldo' && !anticipo) {
        throw new PagoNoPermitido('Falta registrar el anticipo simulado.');
      }
      if (anticipo && Number(anticipo.monto) > Number(resumen.total_acordado)) {
        throw new PagoNoPermitido('El anticipo supera el total acordado.');
      }

      const [nuevo]: PagoRegistrado[] = await tx.query(
        `INSERT INTO pagos (servicio_id, tipo, monto, moneda, metodo, destino, estado, registrado_por, confirmado_en)
         VALUES ($1, $2, $3::numeric - $4::numeric, $5, $6, $7, $8, $9,
                 CASE WHEN $2::varchar = 'anticipo' THEN NOW() END)
         RETURNING ${columnas}`,
        [servicioId, tipo, tipo === 'anticipo' ? resumen.anticipo : resumen.total_acordado,
          anticipo?.monto ?? '0', resumen.moneda, metodo,
          tipo === 'anticipo' ? 'plataforma' : 'trabajador',
          tipo === 'anticipo' ? 'confirmado' : 'reportado', usuarioId],
      );
      await this.confirmar(tx, nuevo.id, usuarioId, 'cliente_pago');
      return nuevo;
    });
  }

  private async confirmar(tx: EntityManager, pagoId: string, usuarioId: string, tipo: string) {
    await tx.query(
      `INSERT INTO confirmaciones_pago (pago_id, usuario_id, tipo_confirmacion)
       VALUES ($1, $2, $3) ON CONFLICT (pago_id, tipo_confirmacion) DO NOTHING`,
      [pagoId, usuarioId, tipo],
    );
  }
}
