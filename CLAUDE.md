# Qui publie ce livre ? — Project context

## What this app does

A PWA (Progressive Web App) that lets users scan a book's ISBN barcode or cover and immediately see who owns the publishing rights — tracing the chain from the imprint up to the ultimate corporate owner.

The goal is **consumer transparency**: a reader in a bookshop can scan a book and know whether their money is going to an independent publisher or to a media conglomerate. The target market is France.

---

## Core user flow

1. User opens the PWA on mobile
2. Taps "Scanner" — camera opens with a barcode viewfinder
3. Scans the ISBN barcode (or enters ISBN manually)
4. App queries Google Books API for book metadata (title, author, publisher name)
5. App matches the publisher name to the local database
6. Displays the ownership chain: **Éditeur → Groupe → Propriétaire ultime** with a short editorial note

---

## Architecture decision

**Option chosen: static CSV files + PWA (no backend)**

- Frontend: single React PWA
- Database: two CSV files bundled in `public/data/` and fetched at runtime
- External API: Google Books API (free, no key needed for basic lookups)
- Deployment: GitHub Pages (auto-deployed via GitHub Actions on push to `main`)

No backend, no Supabase, no auth. The data layer is fully static — publisher and group data lives in `public/data/publishers.csv` and `public/data/groups.csv`. To add or update data, edit those files and push.

If the project grows to need community contributions or an admin UI, migrating to Supabase is straightforward: `src/data/repository.ts` is the single entry point for data access and can be swapped without touching the rest of the app.

---

## Data model

Two CSV files in `public/data/`:

### `public/data/publishers.csv`
| column | type | notes |
|---|---|---|
| id | string | slug, e.g. "seuil" |
| name | string | canonical name, e.g. "Le Seuil" |
| name_variants | string | pipe-separated alternate spellings for fuzzy matching |
| country | string | "FR", "BE", etc. |
| founded_year | int | optional, leave blank if unknown |
| group_id | string | → id in groups.csv |

### `public/data/groups.csv`
| column | type | notes |
|---|---|---|
| id | string | slug, e.g. "media-participations" |
| name | string | e.g. "Média-Participations" |
| owner | string | e.g. "Famille Lombard" |
| listed | boolean | "true" or "false" — publicly traded? |
| note | string | short editorial note shown to users (may contain commas — quote the field) |
| wikipedia_url | string | optional reference |

CSV fields containing commas must be wrapped in double quotes. Double quotes within a field are escaped as `""`.

The TypeScript types in `src/data/types.ts` mirror this shape. Parsing and fetching happens in `src/data/csvLoader.ts`; `src/data/repository.ts` is the single entry point used by the rest of the app.

---

## Lookup logic

```
ISBN → Google Books API → publisher name (raw string)
     → fuzzy match against publishers.name + publishers.name_variants
     → join to groups
     → return ownership chain
```

If no match is found in the publishers table, the app shows the raw publisher name from Google Books and prompts the user to flag it for review (future: community contribution flow).

---

## Key French publishing groups

| Publisher | Group | Owner |
|---|---|---|
| Hachette Livre, Grasset, Fayard, Stock, Calmann-Lévy | Lagardère | Arnault / LVMH (since 2023) |
| Robert Laffont, Plon, Julliard, 10/18, Pocket | Editis | Groupe CMN / CMA CGM (Daniel Kretinsky sold to Bolloré, then CMA CGM) |
| Gallimard, Folio, La Pléiade | Madrigall (Gallimard group) | Famille Gallimard (independent) |
| Flammarion, Casterman, Autrement | Madrigall (merged 2012) | Famille Gallimard (independent) |
| Le Seuil, La Martinière, JC Lattès | Média-Participations | Famille Lombard (independent) |
| Actes Sud | Actes Sud | Famille Nyssen (independent) |
| Les Arènes, Marabout, Larousse | Hachette Livre (see above) | Lagardère / LVMH |
| Albin Michel | Albin Michel | Famille Esmenard (independent) |
| Belin, Humensis | Humensis | Fonds Andera / Caisse des dépôts |

---

## Tech stack summary

```
React (Vite) — deployed to GitHub Pages
  ↓
public/data/*.csv  ← publisher + group database (static, fetched at runtime)
  ↓
Google Books API (fetch, no SDK)  ← ISBN → book metadata
  ↓
html5-qrcode  ← barcode decoding from native camera photo
```

---

## Notes for Claude Code

- The app UI language is **French** (labels, copy, etc.)
- Keep the component structure simple — this is a side project, not an enterprise app
- Prefer Tailwind CSS for styling
- The barcode scanner uses `<input type="file" capture="environment">` to open the native camera app — do not revert to a live video stream, the native camera gives far better image quality for barcode detection
- `src/data/repository.ts` is the single data access entry point — all functions are async
- CSV fetch paths must use `import.meta.env.BASE_URL` (not `/`) so they resolve correctly on GitHub Pages (`/KiPubli/`) and locally (`/`)
- The ownership chain display is the most important UI element — give it visual hierarchy
