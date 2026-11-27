import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Oferta } from '../../core/services/proyecto-api.service';

type Orden = 'precio' | 'reputacion' | 'fecha';

@Component({
  selector: 'app-comparador-cotizaciones',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, FormsModule],
  templateUrl: './comparador-cotizaciones.html',
})
export class ComparadorCotizaciones {
  readonly ofertas = input.required<readonly Oferta[]>();
  readonly puedeElegir = input.required<boolean>();
  readonly puedeOrdenar = input.required<boolean>();

  readonly elegir = output<Oferta>();

  readonly orden = signal<Orden>('precio');

  readonly ofertasOrdenadas = computed(() => {
    const ofertas = this.ofertas();
    if (!this.puedeOrdenar()) return ofertas;

    const orden = this.orden();
    return [...ofertas].sort((a, b) => {
      const porFecha = Date.parse(b.enviada_en) - Date.parse(a.enviada_en);
      switch (orden) {
        case 'precio':
          return Number(a.monto_estimado_total) - Number(b.monto_estimado_total) || porFecha;
        case 'reputacion':
          return (b.reputacion_promedio ?? -1) - (a.reputacion_promedio ?? -1)
            || b.reputacion_total - a.reputacion_total || porFecha;
        case 'fecha':
          return porFecha;
      }
    });
  });
}
