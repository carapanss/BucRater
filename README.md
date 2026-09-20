# BucRater

Aplicación de escritorio para llevar un registro personal de los libros que lees: valoraciones, notas, citas favoritas, tags, sagas y estadísticas de lectura. Local-first: todos los datos viven en una base SQLite en tu propio equipo.

Construida con [Tauri](https://tauri.app) (Rust) + React + TypeScript.

## Funcionalidades

- Ficha por libro: título, autor, valoración (1-5), estado (pendiente / leyendo / leído), notas, portada, idioma, páginas, saga y número dentro de la saga.
- Autocompletado al añadir un libro buscando por título o por autor en Google Books y Open Library.
- Las portadas sugeridas se descargan y guardan localmente, para no depender de que la URL remota siga disponible.
- Citas favoritas por libro y contador de relecturas.
- Tags personalizables con color, con fusión de tags duplicados desde el gestor de tags.
- Búsqueda (título, autor, notas y citas), filtros por tag/estado/valoración mínima, y varios órdenes de la lista.
- Panel de métricas: resumen anual ("wrapped"), velocidad de lectura, histórico de los últimos 5 años, ranking de autores, distribución de tags y mapa de calor de meses.
- Exportar/importar toda la biblioteca como backup en JSON, o exportarla a CSV / Markdown.
- Backups automáticos periódicos, además del export manual.
- Sincronización automática con un servidor privado por Tailscale, con SQLite local como caché offline.
- Tema claro/oscuro.

## Stack técnico

- **Frontend:** React 19 + TypeScript (`strict`), Zustand para estado, Framer Motion para animaciones, Vite como bundler.
- **Backend:** Rust + [Tauri v2](https://tauri.app), con una capa de repositorio (`src-tauri/src/repository`) separada de los comandos expuestos al frontend (`src-tauri/src/commands`).
- **Base de datos:** SQLite embebida (vía `rusqlite`), con migraciones versionadas en `src-tauri/migrations`.

## Requisitos

- [Node.js](https://nodejs.org) 20+ y npm.
- [Rust](https://www.rust-lang.org/tools/install) (toolchain estable).
- Dependencias nativas de Tauri para tu sistema operativo: ver la [guía de prerrequisitos de Tauri](https://tauri.app/start/prerequisites/) (en Linux hacen falta `webkit2gtk`, `libayatana-appindicator3`, etc.).

## Desarrollo

```bash
npm install
npm run tauri dev
```

Esto levanta Vite en `http://localhost:1420` y abre la ventana de Tauri apuntando a él, con recarga en caliente.

## Compilar para distribución

```bash
npm run tauri build
```

Genera los instaladores nativos (`.deb`/`.AppImage`, `.msi`/`.exe`, `.dmg` según la plataforma) en `src-tauri/target/release/bundle`.

## Datos y privacidad

- La base de datos (`bucrater.db`) se guarda en el directorio de datos de la app que gestiona el sistema operativo (por ejemplo, `~/.local/share/com.bucrater.app` en Linux). Nunca sale de tu equipo salvo que exportes un backup manualmente.
- Al escribir un título o un autor en el formulario de "Añadir libro", la app consulta las APIs públicas de **Google Books** y **Open Library** para sugerir portada, autor, páginas e idioma. Solo se envía el texto que escribes en ese campo.
- Las portadas elegidas se descargan una vez y se guardan en `.../com.bucrater.app/covers/`.
- Además de los backups manuales (`Importar` / `Exportar` en la barra superior, en JSON/CSV/Markdown), la app guarda automáticamente una copia de seguridad en `.../com.bucrater.app/backups/` (como mucho una cada 12 horas, conservando las últimas 14). Ningún backup sale de tu equipo salvo que tú lo compartas.

## Sincronización entre dispositivos

El servidor de sincronización se configura por defecto en `http://100.74.38.58:8092`,
la dirección Tailscale privada del servidor doméstico. Al iniciar la aplicación,
BucRater descarga la biblioteca central y, después de cada cambio, sube el snapshot
actual en segundo plano. Si el servidor no está disponible, la aplicación sigue
funcionando con SQLite local y reintenta al volver a abrirse.

Para cambiar el servidor o añadir un token opcional, crea `server.json` dentro del
directorio de datos de BucRater:

```json
{
  "url": "http://100.74.38.58:8092",
  "token": ""
}
```

La API y las instrucciones de instalación del servicio están en [`server/README.md`](server/README.md).

## Estructura del proyecto

```
src/                  Frontend (React + TS)
  api/                Llamadas a Tauri (invoke) y a APIs externas de búsqueda de libros
  components/         Componentes de UI reutilizables
  store/              Estado global (Zustand)
  views/              Pantallas principales
src-tauri/
  src/commands/       Comandos expuestos al frontend vía Tauri
  src/repository/     Acceso a datos (SQLite)
  migrations/         Migraciones SQL versionadas
```

## Licencia

[MIT](./LICENSE)
