import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { NegocioService, Categoria, Zona } from '../../core/services/negocio.service';
import { mensajeError } from '../../core/utils/errores';

@Component({
  selector: 'app-catalogo',
  imports: [FormsModule],
  template: `
    <section class="catalogo-hero">
      <div class="hero-contenido">
        <p class="sobre-titulo">ARRÉGLALO YA · SERVICIOS PARA TU HOGAR</p>
        <h1>¿Qué necesitas <span>arreglar</span> hoy?</h1>
        <p class="hero-descripcion">Encuentra a la persona indicada para ayudarte en casa. Elige el servicio que necesitas y empieza por aquí.</p>
        <div class="hero-detalles"><span>✦ Soluciones para tu hogar</span><span>✦ Profesionales independientes</span></div>
      </div>
      <div class="hero-ilustracion" aria-hidden="true"><div class="hero-circulo">⌂</div><span class="hero-destello destello-uno">✳</span><span class="hero-destello destello-dos">✦</span></div>
    </section>

    @if (error()) { <p class="alerta error">{{ error() }}</p> }
    @if (mensaje()) { <p class="alerta exito">{{ mensaje() }}</p> }

    <section class="seccion-servicios">
      <div class="titulo-seccion">
        <div><p class="sobre-titulo">ENCUENTRA TU SOLUCIÓN</p><h2>¿En qué podemos ayudarte?</h2><p>Explora nuestras especialidades para el cuidado de tu hogar.</p></div>
        <button class="btn-sec" type="button" (click)="cargar()">↻ Actualizar</button>
      </div>
      @if (cargandoCategorias()) { <p class="vacio">Preparando los servicios...</p> }
      @else if (!categorias().length) { <div class="tarjeta vacio">Todavía no hay servicios registrados. Vuelve a intentarlo más tarde.</div> }
      @else {
        <div class="rejilla-catalogo">
          @for (c of categorias(); track c.id) {
            <article class="item-catalogo">
              <div class="icono-catalogo">{{ iconoCategoria(c.nombre) }}</div>
              <div class="servicio-contenido">
                <h3>{{ c.nombre }}</h3>
                <p>{{ c.descripcion || 'Un profesional puede ayudarte con este servicio.' }}</p>
                <span class="servicio-disponible"><i></i> Servicio disponible</span>
                @if (auth.rolActivo() === 'administrador') {
                  <small>Código: {{ c.codigo }} · {{ c.activa ? 'Activa' : 'Desactivada' }}</small>
                  <button type="button" class="btn-sec" [disabled]="guardando()" (click)="editar('categorias',c)">Editar categoría</button>
                }
              </div>
              <span class="servicio-flecha" aria-hidden="true">↗</span>
            </article>
          }
        </div>
      }
    </section>

    <section class="tarjeta seccion-zonas">
      <div class="titulo-seccion"><div><p class="sobre-titulo">COBERTURA</p><h2>Estamos cerca de tu hogar</h2><p>Estas son las zonas donde puedes solicitar servicios.</p></div><span class="contador">{{ zonas().length }} zonas</span></div>
      @if (cargandoZonas()) { <p>Cargando zonas...</p> }
      @else if (!zonas().length) { <p class="vacio">Todavía no hay zonas registradas.</p> }
      @else { <div class="lista-zonas">@for (z of zonas(); track z.id) { <div class="zona"><span class="pin">⌖</span><span>{{ z.nombre }}</span><small>{{ etiquetaTipo(z.tipo) }}</small>
        @if (auth.rolActivo() === 'administrador') {
          <span>{{ z.activa ? 'Activa' : 'Desactivada' }}</span>
          <button type="button" class="btn-sec" [disabled]="guardando()" (click)="editar('zonas',z)">Editar</button>
        }</div> }</div> }
    </section>

    @if (auth.rolActivo() === 'administrador') {
      @if (editandoId) {
        <form class="tarjeta formulario-admin" (ngSubmit)="guardarEdicion()"><h2>Editar {{ editandoTipo === 'categorias' ? 'categoría' : 'zona' }}</h2>
          <label class="campo">Nombre<input name="edicionNombre" [(ngModel)]="edicionNombre" [maxlength]="editandoTipo === 'categorias' ? 100 : 120" required></label>
          <label class="fila"><input type="checkbox" name="edicionActiva" [(ngModel)]="edicionActiva">Activa para nuevas solicitudes</label>
          <div class="fila"><button class="btn">Guardar cambios</button><button type="button" class="btn-sec" (click)="editandoId=''">Cerrar</button></div>
        </form>
      }
      <section class="tarjeta formulario-admin"><p class="sobre-titulo">PANEL DE CONTROL</p><h2>Administrar catálogo</h2><p>Registra nuevas categorías y zonas para que aparezcan en el catálogo.</p>
        <div class="rejilla-formularios">
          <form (ngSubmit)="crearCategoria()"><h3>Nueva categoría</h3>
            <label class="campo">Código<input name="codigo" [(ngModel)]="codigo" maxlength="40" required placeholder="Ej. PLOMERIA"></label>
            <label class="campo">Nombre<input name="nombreCategoria" [(ngModel)]="nombreCategoria" maxlength="100" required placeholder="Ej. Plomería"></label>
            <button class="btn" type="submit" [disabled]="guardando()">Crear categoría</button>
          </form>
          <form (ngSubmit)="crearZona()"><h3>Nueva zona</h3>
            <label class="campo">Nombre<input name="nombreZona" [(ngModel)]="nombreZona" maxlength="120" required placeholder="Ej. Cala Cala"></label>
            <label class="campo">Tipo<select name="tipoZona" [(ngModel)]="tipoZona"><option value="zona">Zona</option><option value="otb">OTB</option><option value="macrodistrito">Macrodistrito</option></select></label>
            <button class="btn" type="submit" [disabled]="guardando()">Crear zona</button>
          </form>
        </div>
      </section>
    }
  `
})
export class Catalogo implements OnInit {
  auth = inject(AuthService);
  private api = inject(NegocioService);
  categorias = signal<Categoria[]>([]);
  zonas = signal<Zona[]>([]);
  cargandoCategorias = signal(false);
  cargandoZonas = signal(false);
  guardando = signal(false);
  error = signal('');
  mensaje = signal('');
  editandoId = '';
  editandoTipo: 'categorias' | 'zonas' = 'categorias';
  edicionNombre = '';
  edicionActiva = true;
  codigo = '';
  nombreCategoria = '';
  nombreZona = '';
  tipoZona: 'zona' | 'otb' | 'macrodistrito' = 'zona';

  ngOnInit() { this.cargar(); }
  cargar() {
    this.error.set(''); this.cargandoCategorias.set(true); this.cargandoZonas.set(true);
    this.api.categorias(this.auth.rolActivo() === 'administrador').subscribe({ next: d => this.categorias.set(d), error: e => { this.error.set(mensajeError(e)); this.cargandoCategorias.set(false); }, complete: () => this.cargandoCategorias.set(false) });
    this.api.zonas(this.auth.rolActivo() === 'administrador').subscribe({ next: d => this.zonas.set(d), error: e => { this.error.set(mensajeError(e)); this.cargandoZonas.set(false); }, complete: () => this.cargandoZonas.set(false) });
  }
  crearCategoria() {
    this.limpiar(); this.guardando.set(true);
    this.api.crearCategoria(this.codigo.trim(), this.nombreCategoria.trim()).subscribe({
      next: () => { this.mensaje.set('Categoría creada correctamente.'); this.codigo = ''; this.nombreCategoria = ''; this.cargar(); },
      error: e => { this.error.set(mensajeError(e)); this.guardando.set(false); }, complete: () => this.guardando.set(false),
    });
  }
  crearZona() {
    this.limpiar(); this.guardando.set(true);
    this.api.crearZona(this.nombreZona.trim(), this.tipoZona).subscribe({
      next: () => { this.mensaje.set('Zona creada correctamente.'); this.nombreZona = ''; this.cargar(); },
      error: e => { this.error.set(mensajeError(e)); this.guardando.set(false); }, complete: () => this.guardando.set(false),
    });
  }
  editar(tipo: 'categorias' | 'zonas', fila: Categoria | Zona) {
    this.editandoId = fila.id; this.editandoTipo = tipo;
    this.edicionNombre = fila.nombre; this.edicionActiva = fila.activa ?? true;
  }
  guardarEdicion() {
    if (this.guardando()) return;
    this.limpiar(); this.guardando.set(true);
    const operacion = this.editandoTipo === 'categorias' ?
      this.api.editarCategoria(this.editandoId, this.edicionNombre.trim(), this.edicionActiva) :
      this.api.editarZona(this.editandoId, this.edicionNombre.trim(), this.edicionActiva);
    operacion.subscribe({
      next: () => { this.editandoId = ''; this.mensaje.set('Catálogo actualizado.'); this.cargar(); },
      error: e => { this.error.set(mensajeError(e)); this.guardando.set(false); },
      complete: () => this.guardando.set(false),
    });
  }
  iconoCategoria(nombre: string) {
    const n = nombre.toLowerCase();
    if (n.includes('plom')) return '🔧';
    if (n.includes('electric')) return '⚡';
    if (n.includes('albañ') || n.includes('constru')) return '🧱';
    if (n.includes('electro')) return '🧰';
    return '🛠️';
  }
  etiquetaTipo(tipo: string) { return tipo === 'otb' ? 'OTB' : tipo === 'macrodistrito' ? 'Macrodistrito' : 'Zona'; }
  private limpiar() { this.error.set(''); this.mensaje.set(''); }
}
