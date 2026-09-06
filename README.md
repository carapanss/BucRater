# BucRater

Aplicación de escritorio para llevar un registro personal de los libros que lees: valoraciones, notas, citas favoritas, tags, sagas y estadísticas de lectura. Local-first: todos los datos viven en una base SQLite en tu propio equipo.

Construida con [Tauri](https://tauri.app) (Rust) + React + TypeScript.

## Funcionalidades

- Ficha por libro: título, autor, valoración (1-5), estado (pendiente / leyendo / leído), notas, portada, idioma, páginas, saga y número dentro de la saga.
- Autocompletado al añadir un libro buscando en Google Books y Open Library.
- Citas favoritas por libro y contador de relecturas.
- Tags personalizables con color.
- Búsqueda y filtros por texto, tag, estado y valoración mínima.
- Panel de métricas: resumen anual ("wrapped"), velocidad de lectura, comparativa interanual, ranking de autores, distribución de tags y mapa de calor de meses.
- Exportar/importar toda la biblioteca como backup en JSON.
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
- Al escribir un título en el formulario de "Añadir libro", la app consulta las APIs públicas de **Google Books** y **Open Library** para sugerir portada, autor, páginas e idioma. Solo se envía el texto que escribes en ese campo.
- El backup exportado (`Importar` / `Exportar` en la barra superior) es un archivo `.json` plano que puedes guardar donde quieras; no se sube a ningún servidor.

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
