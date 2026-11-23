import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { NegocioService, Categoria, Zona } from '../../core/services/negocio.service';
import { mensajeError } from '../../core/utils/errores';

@Component({
  selector: 'app-catalogo',
  imports: [FormsModule],
  template: `
    <section class="encabezado-pagina">
      <div><p class="sobre-titulo">ARRÉGLALO YA</p><h1>Catálogo de servicios</h1><p>Consulta los tipos de trabajo y las zonas de cobertura disponibles.</p></div>
      <button class="btn-actualizar" type="button" (click)="cargar()">
        <span>Actualizar catálogo</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
      </button>
    </section>
    @if (error()) { <p class="alerta error">{{ error() }}</p> }
    @if (mensaje()) { <p class="alerta exito">{{ mensaje() }}</p> }
    <section class="tarjeta">
      <div class="titulo-seccion"><div><h2>Servicios disponibles</h2><p>Especialidades que puedes solicitar o brindar.</p></div><span class="contador">{{ categorias().length }} categorías</span></div>
      @if (cargandoCategorias()) { <p>Cargando categorías...</p> }
      @else if (!categorias().length) { <p class="vacio">Todavía no hay categorías registradas.</p> }
      @else { <div class="rejilla-catalogo">
      @for (c of categorias(); track c.id) { <article class="item-catalogo" [attr.data-codigo]="c.codigo"><div class="icono-catalogo">{{ iconoCategoria(c.nombre) }}</div><div><h3>{{ c.nombre }}</h3><p>{{ c.descripcion || 'Servicio disponible en la plataforma.' }}</p><small class="badge-codigo">Código: {{ c.codigo }}</small>@if (auth.rolActivo() === 'administrador') {
  <p>{{ c.activa ? 'Activa' : 'Desactivada' }}</p>
  <button type="button" class="btn-sec" [disabled]="guardando()" (click)="editar('categorias',c)">Editar estado y nombre</button>
}</div></article> }
      </div> }
    </section>
    <section class="tarjeta">
      <div class="titulo-seccion"><div><h2>Zonas de cobertura</h2><p>Ubicaciones donde se pueden solicitar servicios.</p></div><span class="contador">{{ zonas().length }} zonas</span></div>
      @if (cargandoZonas()) { <p>Cargando zonas...</p> }
      @else if (!zonas().length) { <p class="vacio">Todavía no hay zonas registradas.</p> }
      @else { <div class="lista-zonas">@for (z of zonas(); track z.id) { <div class="zona"><span class="pin" aria-hidden="true"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg></span><span class="zona-nombre">{{ z.nombre }}</span><small>{{ etiquetaTipo(z.tipo) }}</small>@if (auth.rolActivo() === 'administrador') {
  <span>{{ z.activa ? 'Activa' : 'Desactivada' }}</span>
  <button type="button" class="btn-sec" [disabled]="guardando()" (click)="editar('zonas',z)">Editar</button>
}</div> }</div> }
    </section>
    @if (auth.rolActivo() === 'administrador') {
      @if (editandoId) {
        <form class="tarjeta" (ngSubmit)="guardarEdicion()"><h2>Editar {{ editandoTipo === 'categorias' ? 'categoría' : 'zona' }}</h2>
          <label class="campo">Nombre<input name="edicionNombre" [(ngModel)]="edicionNombre" [maxlength]="editandoTipo === 'categorias' ? 100 : 120" required></label>
          <label class="fila"><input type="checkbox" name="edicionActiva" [(ngModel)]="edicionActiva">Activa para nuevas solicitudes</label>
          <div class="fila"><button class="btn" [disabled]="guardando()">Guardar cambios</button>
          <button type="button" class="btn-sec" (click)="editandoId=''">Cerrar</button></div>
        </form>
      }
      <section class="tarjeta"><h2>Administrar catálogo</h2><p>Registra nuevas categorías y zonas para que aparezcan en el catálogo.</p>
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
  `,
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
