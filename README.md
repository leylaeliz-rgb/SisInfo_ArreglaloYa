Hola. Ya tenemos integrado en GitHub el backend inicial de Arréglalo Ya. Ahora necesitamos que cada uno prepare su entorno local para que todos podamos trabajar sobre la misma versión del proyecto.

Les dejo los pasos para configurarlo:

**1. Tener instaladas las herramientas**
- Node.js 26.13.0 LTS.
- npm (viene con Node.js).
- Git.
- PostgreSQL y pgAdmin 4.
- Visual Studio Code.

**2. Descargar el proyecto**

Abrir una terminal y ejecutar:

```bash
git clone https://github.com/leylaeliz-rgb/SisInfo_ArreglaloYa.git
cd SisInfo_ArreglaloYa
```

**3. Preparar la base de datos**

- Abrir pgAdmin 4.
- Crear una base de datos llamada `arreglalo_ya`.
- Ejecutar el script `database/scripts/arreglalo_ya_estructura.sql`.
- Ejecutar las migraciones en orden después del esquema inicial.
  - `database/scripts/02_bajas_auditables.sql`
  - `database/scripts/03_archivos_verificacion.sql`
  - `database/scripts/05_contenido_adjuntos.sql`
- Comprobar que aparezcan las tablas.
- El archivo `04_datos_semilla.sql` contiene datos ficticios con contraseñas de relleno. Para probar el acceso, registrar las cuentas mediante la API o la pantalla de registro.

**4. Configurar el backend**

Entrar a la carpeta:

```bash
cd backend
```

Instalar las dependencias:

```bash
npm ci
```

Crear el archivo `.env` a partir del ejemplo:

En PowerShell:

```powershell
Copy-Item .env.example .env
```

Después abrir `.env` y colocar los datos de conexión de su PostgreSQL local, especialmente su contraseña.

**Importante:** el archivo `.env` es personal y no se sube a GitHub.

**5. Comprobar que funciona**

Primero compilar:

```bash
npm run build
```

Después iniciar el servidor:

```bash
npm run start:dev
```

Si utilizan PowerShell y les aparece un error indicando que no pueden ejecutarse scripts, pueden utilizar `npm.cmd` en lugar de `npm`. Por ejemplo, `npm.cmd ci`.

Con el servidor iniciado, entrar a estas direcciones:

- http://localhost:3000/
- http://localhost:3000/health

En la segunda debería aparecer una respuesta que confirme la conexión con `arreglalo_ya`.

**6. Trabajar con GitHub**

Antes de comenzar cualquier trabajo, actualizar su repositorio:

```bash
git switch main
git pull origin main
```

Para desarrollar nuevas funcionalidades, crear una rama propia:

```bash
git switch -c feature/nombre-funcionalidad
```

Cuando terminen, subir sus cambios y crear un Pull Request para integrarlos a `main`.

La idea es que todos tengamos el mismo entorno, la misma estructura de base de datos y el mismo backend funcionando. Así evitamos problemas de compatibilidad cuando empecemos a desarrollar los módulos.

Cualquier problema que les aparezca durante la instalación o configuración, lo compartimos por aquí para resolverlo entre todos.

## Ejecutar la aplicación Angular

Desde la raíz del repositorio, abrir una segunda terminal.

```powershell
cd frontend
npm.cmd ci
npm.cmd start
```

Abrir http://localhost:4200 y mantener el backend escuchando en http://localhost:3000.

Configurar JWT_SECRET en backend/.env con una clave aleatoria de al menos 32 bytes, en una línea distinta de PORT. Para generar una clave local, ejecutar desde una terminal.

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

### Recorrido de prueba

1. Registrar una cuenta cliente y una cuenta profesional, o inscribir una cuenta existente como trabajador desde Perfil.
2. Activar trabajador y completar Perfil profesional, especialidades, cobertura, horario y documentos.
3. Con una cuenta administradora existente, abrir Administración y revisar los cuatro criterios en Gestión.
4. Activar la disponibilidad del profesional.
5. Con un cliente distinto, publicar una solicitud desde Solicitudes y ofertas.
6. Con el profesional, elegir la solicitud y enviar una cotización.
7. El cliente elige la oferta y continúa en Mis servicios para aceptar el precio definitivo.
8. Registrar el anticipo simulado. Iniciar y finalizar el servicio como profesional.
9. Reportar el saldo como cliente y confirmar su recepción como profesional.
10. Calificar el trabajo o presentar un reclamo. Administración permite revisar reclamos, apelaciones e incidencias.

Las fotos de solicitudes admiten hasta cinco imágenes. Los documentos, las evidencias de reclamos y los comprobantes se almacenan de forma privada y admiten hasta 2 MiB por archivo. Adjuntar un comprobante conserva las confirmaciones de pago como operaciones separadas.

El panel administrativo presenta indicadores filtrables por fecha de creación. Las tareas automáticas de prioridad y baja por inactividad permanecen sujetas a REGLAS_PROGRAMADAS. El anticipo QR es simulado y la comisión se muestra como referencia.
