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
- Ejecutar el script `database/scripts/01_estructura_inicial.sql`.
- Comprobar que aparezcan las tablas.

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
