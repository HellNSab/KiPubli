import { test, expect, type Page } from '@playwright/test';

type BookFixture = {
  isbn: string;
  title: string;
  expectedGroup: string;
  expectedDistributor: string;
};

// N.B.: J'ai Lu (9782290…) est un imprint Flammarion → Madrigall,
// et Denoël (9782207…) est un imprint Gallimard → Madrigall.
// La table de référence indiquait Editis pour ces deux lignes — la base
// de données ci-dessous reflète la chaîne éditoriale réelle.
const BOOKS: BookFixture[] = [
  {
    isbn: '9782070360024',
    title: "L'Étranger",
    expectedGroup: 'Madrigall',
    expectedDistributor: 'Sodis + Union Distribution',
  },
  {
    isbn: '9782080700049',
    title: 'Les Misérables',
    expectedGroup: 'Madrigall',
    expectedDistributor: 'Sodis + Union Distribution',
  },
  {
    isbn: '9782020049061',
    title: 'Les Choses',
    expectedGroup: 'Média-Participations',
    expectedDistributor: 'Sodis',
  },
  {
    isbn: '9782226470058',
    title: "La Promesse de l'aube",
    expectedGroup: 'Albin Michel',
    expectedDistributor: 'Hachette Distribution',
  },
  {
    isbn: '9782253004226',
    title: "L'Étranger",
    expectedGroup: 'Lagardère',
    expectedDistributor: 'Hachette Distribution',
  },
  {
    isbn: '9782266320412',
    title: 'Le Nom de la rose',
    expectedGroup: 'Editis',
    expectedDistributor: 'Interforum',
  },
  {
    isbn: '9782330181673',
    title: 'Triste Tigre',
    expectedGroup: 'Actes Sud',
    expectedDistributor: 'Hachette Distribution',
  },
  {
    isbn: '9782070413119',
    title: 'Les Misérables (Folio)',
    expectedGroup: 'Madrigall',
    expectedDistributor: 'Sodis + Union Distribution',
  },
  {
    isbn: '9782246815471',
    title: 'Sérotonine',
    expectedGroup: 'Lagardère',
    expectedDistributor: 'Hachette Distribution',
  },
  {
    isbn: '9782264078910',
    title: 'Americanah',
    expectedGroup: 'Editis',
    expectedDistributor: 'Interforum',
  },
  {
    isbn: '9782221197752',
    title: 'Dune',
    expectedGroup: 'Editis',
    expectedDistributor: 'Interforum',
  },
  {
    isbn: '9782072882517',
    title: 'Les Années',
    expectedGroup: 'Madrigall',
    expectedDistributor: 'Sodis + Union Distribution',
  },
  {
    isbn: '9782253933656',
    title: "La Vérité sur l'affaire Harry Quebert",
    expectedGroup: 'Lagardère',
    expectedDistributor: 'Hachette Distribution',
  },
  {
    isbn: '9782742793395',
    title: 'Boussole',
    expectedGroup: 'Actes Sud',
    expectedDistributor: 'Hachette Distribution',
  },
  {
    isbn: '9782714450463',
    title: 'Le Lambeau',
    expectedGroup: 'Madrigall',
    expectedDistributor: 'Sodis + Union Distribution',
  },
  {
    isbn: '9782259307680',
    title: 'Civilizations',
    expectedGroup: 'Lagardère',
    expectedDistributor: 'Hachette Distribution',
  },
  {
    isbn: '9782021463743',
    title: 'Le Capital au XXIe siècle',
    expectedGroup: 'Média-Participations',
    expectedDistributor: 'Sodis',
  },
  {
    isbn: '9782290383599',
    title: 'La Peste',
    expectedGroup: 'Madrigall',
    expectedDistributor: 'Sodis + Union Distribution',
  },
  {
    isbn: '9782253178347',
    title: 'Les Bienveillantes',
    expectedGroup: 'Lagardère',
    expectedDistributor: 'Hachette Distribution',
  },
  {
    isbn: '9782207166741',
    title: 'Fondation',
    expectedGroup: 'Madrigall',
    expectedDistributor: 'Sodis + Union Distribution',
  },
];

async function scanIsbn(page: Page, isbn: string): Promise<void> {
  await page.getByRole('button', { name: 'Scanner un livre' }).click();
  await page.getByPlaceholder('ISBN manuel — 978…').fill(isbn);
  await page.getByRole('button', { name: 'OK' }).click();
  // Wait up to 45 s for the external book API to respond and the result to render
  await expect(
    page.getByRole('button', { name: /Scanner un autre livre/ }),
  ).toBeVisible({ timeout: 45_000 });
}

test.describe('Scan ISBN → vérification chaîne éditoriale (production)', () => {
  for (const book of BOOKS) {
    test(`${book.isbn} — ${book.title}`, async ({ page }) => {
      await page.goto('./');
      await scanIsbn(page, book.isbn);

      // The "Éditeur non identifié" banner must not appear
      await expect(page.getByText('Éditeur non identifié')).not.toBeVisible();

      // Onglet Édition (actif par défaut) — vérifier le groupe
      await expect(page.getByText(book.expectedGroup).first()).toBeVisible();

      // Onglet Distribution — vérifier le distributeur
      await page.getByRole('button', { name: 'Distribution' }).click();
      await expect(page.getByText(book.expectedDistributor).first()).toBeVisible();
    });
  }
});
