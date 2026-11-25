BEGIN;

ALTER TABLE propuestas_precio
    DROP CONSTRAINT propuestas_precio_estado_check,
    ADD CONSTRAINT propuestas_precio_estado_check
        CHECK (estado IN ('pendiente', 'aceptada', 'rechazada', 'reemplazada', 'cancelada'));

UPDATE propuestas_precio AS propuesta
SET estado = 'cancelada',
    decidida_por = servicio.cancelado_por,
    decidida_en = servicio.cancelado_en
FROM servicios AS servicio
WHERE propuesta.servicio_id = servicio.id
  AND propuesta.estado = 'pendiente'
  AND servicio.estado = 'cancelado';

COMMIT;
