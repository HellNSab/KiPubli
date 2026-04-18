# Qui publie ce livre ? — Project context

## What this app does

A PWA (Progressive Web App) that lets users scan a book's ISBN barcode or cover and immediately see who owns the publishing rights — tracing the chain from the imprint up to the ultimate corporate owner.

The goal is **consumer transparency**: a reader in a bookshop can scan a book and know whether their money is going to an independent publisher or to a media conglomerate. The target market is France.

---

## Core user flow

1. User opens the PWA on mobile
2. Taps "Scanner" — camera opens with a live barcode viewfinder (falls back to file input after 5 s if camera is unavailable)
3. Scans the ISBN barcode, uploads a photo, or enters the ISBN manually
4. App queries Google Books API for book metadata (title, author, publisher name)
5. App fuzzy-matches the publisher name against the local database
6. Displays the ownership chain: **Éditeur → Groupe → Propriétaire ultime** with a short editorial note
7. User can flag an unrecognised publisher via the report button, which opens a GitHub issue

---

## Architecture

**Static CSV files + React PWA — no backend**

- Frontend: React 19 + Vite, deployed to GitHub Pages (`/KiPubli/`)
- Database: two CSV files in `public/data/`, fetched at runtime and cached in memory for the session
- External API: Google Books API (no key required for basic lookups)
- Admin writes: GitHub Contents API (requires `VITE_GITHUB_TOKEN` env var) — edits commit the CSV directly to the repo, triggering a new GitHub Actions deploy
- Deployment: GitHub Actions on every push to `main` (build + deploy to Pages)

`src/data/repository.ts` is the single data-access entry point for the rest of the app. All its functions are async. If the project ever migrates to Supabase, only this file needs to change.

---

## Routing and navigation

`App.tsx` manages two top-level pages via a `page` state variable:

- `'app'` — the main scanner UI (default)
- `'admin'` — the admin interface, reached by appending `#admin` to the URL

Within the app page there are two views:
- `'home'` — scanner + up to 5 recent scan results (persisted in `localStorage`)
- `'result'` — full ownership chain for a selected book

---

## Source file map

```
src/
  App.tsx                  — routing, ISBN handling, Google Books fetch, publisher match
  index.css                — Tailwind base + custom @keyframes (indeterminate, shake)

  components/
    Scanner.tsx            — barcode scanner (live stream → file fallback → manual input)
    ResultCard.tsx         — ownership chain display + report button
    ReportModal.tsx        — GitHub issue creation for unrecognised publishers
    InstallPrompt.tsx      — Android/iOS PWA install banner

  pages/
    AdminPage.tsx          — password-gated admin UI (desktop only)

  data/
    types.ts               — Group, Publisher, OwnershipChain TypeScript types
    csvLoader.ts           — RFC 4180 CSV parser; singleton fetch cache per session
    repository.ts          — getAllGroups, getAllPublishers, getOwnershipChain, etc.

  lib/
    isbn.ts                — normalizeIsbn, isValidIsbn
    googleBooks.ts         — fetchBookByIsbn (3 retries, exponential backoff)
    matchPublisher.ts      — fuzzy publisher name matching with scoring
    githubCsv.ts           — saveGroup, deleteGroup, savePublisher, deletePublisher via GitHub API
    deployPoller.ts        — polls GitHub Actions API after a save to track deploy status

public/data/
  groups.csv               — publishing groups (~8 rows)
  publishers.csv           — individual publishers (~40 rows)
```

---

## Data model

### `public/data/publishers.csv`
| column | type | notes |
|---|---|---|
| id | string | slug, e.g. `seuil` |
| name | string | canonical name, e.g. `Le Seuil` |
| name_variants | string | pipe-separated alternate spellings for fuzzy matching |
| country | string | `FR`, `BE`, etc. |
| founded_year | int | optional, leave blank if unknown |
| group_id | string | → `id` in groups.csv |

### `public/data/groups.csv`
| column | type | notes |
|---|---|---|
| id | string | slug, e.g. `media-participations` |
| name | string | e.g. `Média-Participations` |
| owner | string | e.g. `Famille Lombard` |
| listed | boolean | `true` or `false` — publicly traded? |
| note | string | short editorial note shown to users (quote if it contains commas) |
| wikipedia_url | string | optional reference |

CSV fields containing commas must be wrapped in double quotes. Double quotes within a field are escaped as `""`.

---

## Lookup logic

```
ISBN → Google Books API → publisherRaw (string)
     → matchPublisher(publisherRaw)
         normalise → score against publishers.name + name_variants
         exact match: 1000 + length | substring: 500 or 250 + length
     → getOwnershipChain(publisher) → { publisher, group }
     → display chain; if no match, show raw name + report prompt
```

---

## Admin interface (`/AdminPage.tsx`)

Password-gated (env var `VITE_ADMIN_PASSWORD`; session stored in `sessionStorage`). Desktop-only. Two tabs:

- **Données** — groups table and publishers table, each with search/filter, add, edit, and delete actions
- **Signalements** — placeholder, not yet implemented

**Editing data** commits directly to the CSV files in the repo via the GitHub Contents API (`githubCsv.ts`). The `VITE_GITHUB_TOKEN` env var must be set; without it all write actions are disabled (read-only mode shown with a warning badge).

**Delete rules:** A group cannot be deleted while publishers still reference it. The delete button is disabled with a tooltip listing how many publishers must be removed first.

**Deploy toast** — after every save, a fixed bottom-right toast walks through four phases:
1. *Saving* — spinner + indeterminate progress bar while the GitHub commit is in flight
2. *Deploying* — pipeline indicator (Sauvegardé → Build CI → En ligne); Build CI label pulses; polls GitHub Actions every 10 s (after an initial 30 s wait) for the new workflow run
3. *Live* — green confirmation, auto-dismissable
4. *Error* — red card with a "Réessayer" button that restarts polling

---

## Key French publishing groups

| Publisher | Group | Owner |
|---|---|---|
| Hachette Livre, Grasset, Fayard, Stock, Calmann-Lévy | Lagardère | Arnault / LVMH (since 2023) |
| Robert Laffont, Plon, Julliard, 10/18, Pocket | Editis | CMA CGM (via Bolloré → Kretinsky → CMA CGM) |
| Gallimard, Folio, La Pléiade, Flammarion, Casterman | Madrigall | Famille Gallimard (independent) |
| Le Seuil, La Martinière, JC Lattès | Média-Participations | Famille Lombard (independent) |
| Actes Sud | Actes Sud | Famille Nyssen (independent) |
| Marabout, Larousse | Hachette Livre | Lagardère / LVMH |
| Albin Michel | Albin Michel | Famille Esmenard (independent) |
| Belin, Humensis | Humensis | Fonds Andera / Caisse des dépôts |

---

## Tech stack summary

```
React 19 + Vite — GitHub Pages (/KiPubli/)
  ↓
public/data/*.csv       — publisher + group database (static, fetched at runtime)
  ↓
Google Books API        — ISBN → book metadata (no key, 3 retries + backoff)
  ↓
html5-qrcode            — live barcode decoding from camera stream
  ↓
GitHub Contents API     — admin writes (CSV commits, requires VITE_GITHUB_TOKEN)
  ↓
GitHub Actions API      — deploy status polling after admin saves
```

---

## Notes for Claude Code

- UI language is **French** throughout (labels, copy, error messages)
- Keep the component structure simple — this is a side project, not an enterprise app
- Prefer Tailwind CSS for styling; custom tokens are defined in `tailwind.config.js` (`ink`, `paper`, `muted`, `accent`, etc.)
- The barcode scanner uses a live `html5-qrcode` video stream as the primary mode, with a file-input fallback (`capture="environment"`) after 5 s — do not remove the live stream path
- `src/data/repository.ts` is the single data access entry point — all functions are async
- CSV fetch paths must use `import.meta.env.BASE_URL` (not `/`) so they resolve on both GitHub Pages (`/KiPubli/`) and locally (`/`)
- The ownership chain display is the most important UI element — give it visual hierarchy
- Dark mode is driven by the OS preference (`darkMode: 'media'` in Tailwind config)
- `VITE_GITHUB_TOKEN` is required for all admin write operations; `VITE_ADMIN_PASSWORD` gates the admin UI itself
