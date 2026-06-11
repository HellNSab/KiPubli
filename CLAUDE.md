# À qui ? — Project context

## What this app does

A PWA (Progressive Web App) that lets users scan a book's ISBN barcode or cover and immediately see who owns the publishing rights — tracing the chain from the imprint up to the ultimate corporate owner, including the distributor and diffuser.

The goal is **consumer transparency**: a reader in a bookshop can scan a book and know whether their money is going to an independent publisher or to a media conglomerate, and which logistics infrastructure their money flows through. The target market is France.

---

## Core user flow

1. User opens the PWA on mobile
2. The **home screen shows an animated pie chart** explaining where a book's money goes (see "Home screen explainer" section below) with a "Scanner un livre" CTA
3. Tapping "Scanner" **replaces the pie chart with the scanner** — the rest of the page stays fixed, no layout shift
4. Scans the ISBN barcode, uploads a photo, or enters the ISBN manually
5. App queries Google Books API for book metadata (title, author, publisher name)
6. App fuzzy-matches the publisher name against the local database
7. Navigates to a **result page** (full page transition, scanner disappears entirely)
8. Result page shows ownership chain across **three tabs**: Édition / Diffusion / Distribution
9. User can flag an unrecognised publisher via the report button in whichever tab they are on

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

Within the app page there are three views:
- `'home'` — pie chart explainer + scanner (scanner replaces chart in place, no layout shift)
- `'result'` — full ownership chain for a selected book (3 tabs: Édition, Diffusion, Distribution)

**Transition from home → result:** full page slide transition (chart/scanner slides up and out, result slides up and in). The bottom bar (Scanner button) stays fixed throughout and morphs into a "Fermer le scanner" button while scanning, then disappears on the result page.

**Back from result → home:** "← Scanner un autre livre" nav element at the top of the result page triggers a reverse slide transition.

All view transitions go through the `navigateTo(view, options?)` helper in `App.tsx`.
It handles three things in order: pushState, scroll reset (window + all panel refs), then setView. Never call setView directly — always use navigateTo.

---

## Back button handling (Android PWA)

All view transitions call `window.history.pushState({ view })` when navigating forward.
A single `popstate` listener in `App.tsx` intercepts Android back button taps and
maps them to view state changes. Use `viewRef` (not `view`) inside the listener to
avoid stale closure bugs. On first load, `replaceState({ view: 'home' })` seeds the
initial history entry.

---

## Source file map

```
src/
  App.tsx                  — routing, ISBN handling, Google Books fetch, publisher match
  index.css                — Tailwind base + custom @keyframes (indeterminate, shake, circle-fade-in)

  components/
    Scanner.tsx            — barcode scanner (live stream → file fallback → manual input)
    HomeChart.tsx          — animated pie chart + circle packing explainer (see below)
    ResultCard.tsx         — ownership chain display with 3 tabs + report button
    ResultTabs.tsx         — Édition / Diffusion / Distribution tab switcher
    ReportModal.tsx        — GitHub issue creation for unrecognised publishers
    InstallPrompt.tsx      — Android/iOS PWA install banner

  pages/
    AdminPage.tsx          — password-gated admin UI (desktop only)

  data/
    types.ts               — Group, Publisher, OwnershipChain TypeScript types
    csvLoader.ts           — RFC 4180 CSV parser; singleton fetch cache per session
    repository.ts          — getAllGroups, getAllPublishers, getOwnershipChain, etc.
    chartData.ts           — pie chart slice definitions + circle packing data (see below)

  lib/
    isbn.ts                — normalizeIsbn, isValidIsbn
    booksApi.ts            — fetchBookByIsbn (3 retries, exponential backoff, 2 APIs: OpenLibrary + Google Books fallback)
    matchPublisher.ts      — fuzzy publisher name matching with scoring
    githubCsv.ts           — saveGroup, deleteGroup, savePublisher, deletePublisher via GitHub API
    deployPoller.ts        — polls GitHub Actions API after a save to track deploy status

public/data/
  groups.csv               — publishing groups (~8 rows, now includes distributeur + diffuseur columns)
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
| distributeur | string | name of the distribution company |
| distributeur_owner | string | who owns that distributor |
| diffuseur | string | name of the diffusion company |
| diffuseur_owner | string | who owns that diffuser |

CSV fields containing commas must be wrapped in double quotes. Double quotes within a field are escaped as `""`.

---

## Lookup logic

```
ISBN → Books API → publisherRaw (string)
     → matchPublisher(publisherRaw)
         normalise → score against publishers.name + name_variants
         exact match: 1000 + length | substring: 500 or 250 + length
     → getOwnershipChain(publisher) → { publisher, group }
         group.distributeur + group.distributeur_owner  (for Distribution tab)
         group.diffuseur + group.diffuseur_owner        (for Diffusion tab)
     → display chain across 3 tabs; if no match, show raw name + report prompt
```

---

## Home screen explainer — `HomeChart.tsx`

The home screen shows an **animated donut pie chart** with circle packing inside each slice, built by hand. It replaces the scanner until the user taps "Scanner un livre", at which point the chart fades out and the scanner fades in — no other elements move.

---

## Result page — `ResultCard.tsx` + `ResultTabs.tsx`

Three tabs on the result page:

### Tab 1 — Édition
- Publisher name
- Group name
- Ultimate owner (family name or conglomerate)
- Editorial note from `groups.csv`
- Independence badge (Groupe indépendant / Groupe coté)

### Tab 2 — Diffusion
- Brief role explanation: "Le diffuseur envoie des représentants en librairie pour présenter les nouveautés, négocier les mises en avant et transmettre les commandes."
- Diffuser name (from `groups.csv → diffuseur`)
- Who owns the diffuser (from `groups.csv → diffuseur_owner`)
- Market share bar for context (static, sourced from chartData)

### Tab 3 — Distribution
- Brief role explanation: "Le distributeur achemine physiquement les livres vers les librairies, gère les stocks en entrepôt et traite les retours des invendus."
- Distributor name (from `groups.csv → distributeur`)
- Who owns the distributor (from `groups.csv → distributeur_owner`)
- Concentration bar showing Hachette ~40% / Interforum ~22% / Sodis ~15% / Autres (static, always shown for context)

Each tab has a "Signaler une erreur sur ces données" button at the bottom.

**Key insight to surface in the UI:** An independent publisher (e.g. Actes Sud, Albin Michel) may still route through Hachette Distribution — meaning money flows to Lagardère/LVMH even for "independent" books. This should be visually flagged when `distributeur_owner` differs from the group's `owner`.

---

## Admin interface (`/AdminPage.tsx`)

Password-gated (env var `VITE_ADMIN_PASSWORD`; session stored in `sessionStorage`). Desktop-only. Two tabs:

- **Données** — groups table and publishers table, each with search/filter, add, edit, and delete actions. The groups table now includes the four new columns: `distributeur`, `distributeur_owner`, `diffuseur`, `diffuseur_owner`.
- **Signalements** — placeholder, not yet implemented

**Editing data** commits directly to the CSV files in the repo via the GitHub Contents API (`githubCsv.ts`). The `VITE_GITHUB_TOKEN` env var must be set; without it all write actions are disabled (read-only mode shown with a warning badge).

**Delete rules:** A group cannot be deleted while publishers still reference it. The delete button is disabled with a tooltip listing how many publishers must be removed first.

**Deploy toast** — after every save, a fixed bottom-right toast walks through four phases:
1. *Saving* — spinner + indeterminate progress bar while the GitHub commit is in flight
2. *Deploying* — pipeline indicator (Sauvegardé → Build CI → En ligne); Build CI label pulses; polls GitHub Actions every 10 s (after an initial 30 s wait) for the new workflow run
3. *Live* — green confirmation, auto-dismissable
4. *Error* — red card with a "Réessayer" button that restarts polling

---

## ISBN cache strategy

Currently: `localStorage` keyed by ISBN (`aqui_isbn_cache`), cleared if > 7 days old (iOS Safari eviction).

Future (when migrating to Supabase): replace localStorage with a `book_cache` table. The lookup order will be:
1. Bundled JSON of ~10k top French ISBNs (`public/data/isbn-cache.json`) — instant, offline
2. Supabase `book_cache` table — shared across all users
3. Google Books API → write result to Supabase — only for new titles

The `repository.ts` abstraction means the rest of the app doesn't need to change.

---

## Branding

**Name:** À qui ?  
**Tagline:** Transparence éditoriale — savoir à qui appartient un livre

**Colour palette (Indigo ink):**
| Token | Hex | Usage |
|---|---|---|
| `accent` | `#4F46E5` | Primary CTA, active states, app icon background |
| `accent-dark` | `#3730A3` | Hover / pressed |
| `accent-light` | `#818CF8` | Dark mode accent, in-app mark |
| `accent-tint` | `#EEF2FF` | Badges, surfaces |
| `bg-light` | `#FAFAFA` | Light background |
| `bg-dark` | `#0F0F0E` | Dark background |
| `text-primary` | `#111110` | Primary text (light mode) |
| `text-dark` | `#F0EFE9` | Primary text (dark mode) |
| `muted` | `#6B6B68` | Secondary text |

**Icon:** Serif `?` (Georgia) left-anchored, three fading horizontal bars to the right (ownership chain metaphor), filled circle with punch-out dot in lower right. Two variants: `icon-app.svg` (solid indigo, for home screen) and `icon-inapp-light/dark.svg` (white/charcoal backgrounds, for use inside the app).

**Typography:** System font stack (`-apple-system, BlinkMacSystemFont, sans-serif`). Two weights only: 400 regular, 500 medium. Never 600 or 700.

---

## Key French publishing groups (updated with distribution data)

| Publisher examples | Group | Owner | Distributeur | Diffuseur |
|---|---|---|---|---|
| Hachette, Grasset, Fayard, Stock, Calmann-Lévy, LGF | Lagardère | LVMH / Arnault | Hachette Distribution | Hachette Livre Distribution |
| Robert Laffont, Plon, Julliard, 10/18, Pocket | Editis | CMA CGM / Saadé | Interforum | Interforum |
| Gallimard, Folio, Flammarion, Casterman | Madrigall | Famille Gallimard | Sodis + Union Distribution | CDE + Diffusion Flammarion |
| Le Seuil, La Martinière, JC Lattès | Média-Participations | Famille Lombard | Sodis | Volumen |
| Actes Sud | Actes Sud | Famille Nyssen | Hachette Distribution | Volumen |
| Albin Michel | Albin Michel | Famille Esménard | Hachette Distribution | Hachette Livre Distribution |
| Belin, PUF, Armand Colin | Humensis | Andera / CDC | Sodis | Union Distribution |

**Important:** Actes Sud and Albin Michel are independent publishers but both distribute through Hachette Distribution (Lagardère/LVMH). This should be surfaced in the result UI.

---

## Tech stack summary

```
React 19 + Vite — GitHub Pages (/KiPubli/)
  ↓
public/data/*.csv       — publisher + group database (static, fetched at runtime)
  ↓
Books API               — ISBN → book metadata (no key, 3 retries + backoff on 2 potential APIs)
Cache                   — ISBN lookup cache (keyed by ISBN, 7-day TTL)
  ↓
html5-qrcode            — live barcode decoding from camera stream
  ↓
GitHub Contents API     — admin writes (CSV commits, requires VITE_GITHUB_TOKEN)
GitHub Actions API      — deploy status polling after admin saves
```

## Notes for Claude Code

- UI language is **French** throughout (labels, copy, error messages)
- Keep the component structure simple — this is a side project, not an enterprise app
- Prefer Tailwind CSS for styling; custom tokens are defined in `tailwind.config.js` (`ink`, `paper`, `muted`, `accent`, etc.)
- The barcode scanner uses a live `html5-qrcode` video stream as the primary mode, with a file-input fallback (`capture="environment"`) after 5 s — do not remove the live stream path
- `src/data/repository.ts` is the single data access entry point — all functions are async
- CSV fetch paths must use `import.meta.env.BASE_URL` (not `/`) so they resolve on both GitHub Pages (`/KiPubli/`) and locally (`/`)
- Dark mode is driven by the OS preference (`darkMode: 'media'` in Tailwind config)
- `VITE_GITHUB_TOKEN` is required for all admin write operations; `VITE_ADMIN_PASSWORD` gates the admin UI itself
