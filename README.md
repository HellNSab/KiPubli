# Qui publie ce livre ?

A PWA that lets users photograph a book's ISBN barcode and immediately see who owns the publishing rights — tracing the chain from the imprint up to the ultimate corporate owner.

Live: **https://hellnsab.github.io/KiPubli/**

---

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- `html5-qrcode` — barcode decoding from photos
- Google Books API — ISBN → book metadata (no API key required)
- Static CSV files — publisher/group database (no backend)

## Data

Publisher and group data lives in two CSV files in `public/data/`:

| File | Contents |
|---|---|
| `public/data/publishers.csv` | One row per imprint: `id, name, name_variants, country, founded_year, group_id` |
| `public/data/groups.csv` | One row per group: `id, name, owner, listed, note, wikipedia_url` |

`name_variants` is a pipe-separated list of alternate spellings used for fuzzy matching against the raw publisher string from Google Books (e.g. `Gallimard|Éditions Gallimard|Gallimard Jeunesse`).

**To add or update publishers/groups, edit these CSV files directly** — no code changes needed.

## How it works

```
ISBN photo → html5-qrcode decodes barcode → Google Books API → raw publisher name
  → fuzzy match against publishers.csv → join to groups.csv → ownership chain
```

The CSV files are fetched at runtime (once, then cached in memory). Paths use `import.meta.env.BASE_URL` so they resolve correctly both locally and on GitHub Pages.

## Dev

```bash
npm install
npm run dev
```

## Deploy

Pushing to `main` triggers the GitHub Actions workflow (`.github/workflows/deploy.yml`) which builds and deploys to GitHub Pages automatically.
