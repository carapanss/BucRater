# Product

<!-- impeccable:product-schema 1 -->

## Platform

web (Tauri v2 desktop app; the UI is a React webview on Linux/Windows/macOS)

## Stack

React 19 + TypeScript (strict), Zustand, Framer Motion, Vite. Plain CSS in `src/styles/` (`themes.css` tokens, `global.css` components). Rust + SQLite backend; local-first.

## Users and job

- Single user today: the owner keeps a personal reading diary. No other users to design for yet.
- Job: log books read (title, author, cover, rating 1-5, status pending/reading/read, notes, favourite quotes, tags, saga, pages, read month/year, rereads), find them again (search, filters, sort by read date by default), and look back at reading habits (yearly "wrapped", charts, heatmap, author ranking).
- Usage scene: often a laptop or a narrow window, not full screen. Mostly light theme, but switching to dark must stay available and equally good.

## Product truths to preserve

- Three areas: Libros (cover grid + detail + add/edit form), Métricas (yearly wrapped + charts + history), Tags (manager with colour, rename, merge, delete).
- Header actions: import, export menu, update button, theme toggle.
- Wrapped summary can be exported as a 1080×1350 PNG poster.
- Background sync with a private server; toasts report sync/import/export results.
- UI language: Spanish.

## Open decisions

- Visual world: being replaced (user asked for a new visual world, 2026-10-02). Animation intensity: expressive but tasteful, concentrated in a few memorable moments.
