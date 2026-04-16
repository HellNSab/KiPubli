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

**Option chosen: Supabase + PWA (no custom backend)**

- Frontend: single React PWA (with two modes: user-facing scan UI and admin UI behind auth)
- Database + API: Supabase (Postgres + auto-generated REST API + built-in auth)
- External API: Google Books API (free, no key needed for basic lookups)
- Deployment: Vercel or Netlify for the frontend, Supabase managed cloud for the DB

No NestJS or custom backend. The PWA talks directly to Supabase via the `@supabase/supabase-js` client. Row-level security (RLS) policies on Supabase handle access control.

---

## Data model

Three tables:

### `publishers`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| name | text | e.g. "Éditions du Seuil" |
| name_variants | text[] | alternate spellings for fuzzy matching |
| country | text | default 'FR' |
| founded_year | int | optional |
| group_id | uuid FK | → groups.id |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `groups`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| name | text | e.g. "Média-Participations" |
| owner | text | e.g. "Famille Lombard" |
| listed | boolean | publicly traded? |
| note | text | short editorial note shown to users |
| wikipedia_url | text | optional reference |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `book_cache` (optional, for performance)
| column | type | notes |
|---|---|---|
| isbn | text PK | |
| title | text | |
| author | text | |
| publisher_raw | text | raw string from Google Books |
| publisher_id | uuid FK | resolved publisher |
| fetched_at | timestamptz | for cache invalidation |

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

## Auth / roles

Two roles via Supabase Auth:

- **anon**: can read `publishers` and `groups` (SELECT only). RLS policy: `true`.
- **admin**: can insert/update/delete all tables. RLS policy: `auth.role() = 'authenticated'` + check against an `admins` table or a custom claim.

The admin UI is the same React app, gated behind a login screen. No separate frontend repo needed.

---

## Key French publishing groups to seed first

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
React (Vite)
  ↓
@supabase/supabase-js  ←→  Supabase (Postgres + RLS + Auth)
  ↓
Google Books API (fetch, no SDK)
  ↓
html5-qrcode or @zxing/library  ← barcode scanning in browser
```

---

## What to build first (suggested order)

1. Supabase project setup: create tables, seed the ~10 major groups above, set RLS policies
2. ISBN → Google Books lookup function
3. Publisher fuzzy match function (simple includes/startsWith to start, improve later)
4. User scan screen (camera → ISBN → result card)
5. Admin CRUD UI (table view of publishers + groups, edit forms)
6. PWA config (manifest.json, service worker for offline)

---

## Notes for Claude Code

- The app UI language is **French** (labels, copy, etc.)
- Keep the component structure simple — this is a side project, not an enterprise app
- Prefer Tailwind CSS for styling
- Use React Query or Supabase's built-in realtime for data fetching
- The barcode scanner should request camera permission gracefully and fall back to manual ISBN input
- The ownership chain display is the most important UI element — give it visual hierarchy
