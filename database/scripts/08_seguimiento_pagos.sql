BEGIN;

CREATE OR REPLACE FUNCTION validar_pago_no_excede_total()
RETURNS TRIGGER AS $$
DECLARE
    v_total   NUMERIC(12,2);
    v_vigente NUMERIC(12,2);
BEGIN
    IF NEW.estado NOT IN ('reportado', 'confirmado')
       OR EXISTS (SELECT 1 FROM reversiones_pago_simulado r WHERE r.pago_id = NEW.id) THEN
        RETURN NEW;
    END IF;

    PERFORM 1 FROM servicios WHERE id = NEW.servicio_id FOR UPDATE;

    SELECT total_acordado INTO v_total
    FROM resumen_financiero_servicio
    WHERE servicio_id = NEW.servicio_id;

    IF v_total IS NULL THEN
        RAISE EXCEPTION 'El servicio % no tiene un importe acordado.', NEW.servicio_id
            USING ERRCODE = 'check_violation';
    END IF;

    SELECT COALESCE(SUM(p.monto), 0) INTO v_vigente
    FROM pagos p
    WHERE p.servicio_id = NEW.servicio_id
      AND p.id <> NEW.id
      AND p.estado IN ('reportado', 'confirmado')
      AND NOT EXISTS (SELECT 1 FROM reversiones_pago_simulado r WHERE r.pago_id = p.id);

    IF v_vigente + NEW.monto > v_total THEN
        RAISE EXCEPTION 'El pago de % supera el saldo pendiente de % del servicio %.',
            NEW.monto, GREATEST(v_total - v_vigente, 0), NEW.servicio_id
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pago_no_excede_total ON pagos;
CREATE TRIGGER trg_pago_no_excede_total
    BEFORE INSERT OR UPDATE OF monto, estado, servicio_id ON pagos
    FOR EACH ROW EXECUTE FUNCTION validar_pago_no_excede_total();

CREATE OR REPLACE VIEW seguimiento_pagos_servicio AS
SELECT
    r.servicio_id,
    r.moneda,
    r.total_acordado AS total,
    COALESCE(SUM(p.monto) FILTER (WHERE p.estado = 'confirmado' AND v.pago_id IS NULL), 0) AS pagado,
    COALESCE(SUM(p.monto) FILTER (WHERE p.estado = 'reportado'  AND v.pago_id IS NULL), 0) AS por_confirmar,
    GREATEST(
        r.total_acordado
        - COALESCE(SUM(p.monto) FILTER (WHERE p.estado IN ('confirmado', 'reportado') AND v.pago_id IS NULL), 0),
        0
    ) AS pendiente
FROM resumen_financiero_servicio r
LEFT JOIN pagos p ON p.servicio_id = r.servicio_id
LEFT JOIN reversiones_pago_simulado v ON v.pago_id = p.id
GROUP BY r.servicio_id, r.moneda, r.total_acordado;

COMMIT;