# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: books.spec.ts >> Scan ISBN → vérification chaîne éditoriale (production) >> 9782070360024 — L'Étranger
- Location: e2e/books.spec.ts:149:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /Scanner un autre livre/ })
Expected: visible
Timeout: 45000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 45000ms
  - waiting for getByRole('button', { name: /Scanner un autre livre/ })

```

```yaml
- banner:
  - img: "?"
  - heading "À qui ?" [level=1]
  - paragraph: Scannez un code-barres ISBN
- main:
  - img: 20 € par livre
  - button "30% Librairie"
  - button "28% Éditeur"
  - button "13% Diffusion"
  - button "10% Auteur"
  - button "6% TVA"
  - button "8% Groupe"
  - paragraph: Touchez une part pour en savoir plus
  - paragraph: Scannez un code-barres ISBN
  - button "Scanner"
  - textbox "ISBN manuel — 978…": "9782070360024"
  - button "OK"
  - paragraph: "Échec de la recherche : Cannot read properties of undefined (reading 'map')"
  - button "Fermer": ✕
- contentinfo: Données mises à jour bénévolement, susceptibles d'être incomplètes · Métadonnées via Google Books
```

# Test source

```ts
  44  |   },
  45  |   {
  46  |     isbn: '9782266320412',
  47  |     title: 'Le Nom de la rose',
  48  |     expectedGroup: 'Editis',
  49  |     expectedDistributor: 'Interforum',
  50  |   },
  51  |   {
  52  |     isbn: '9782330181673',
  53  |     title: 'Triste Tigre',
  54  |     expectedGroup: 'Actes Sud',
  55  |     expectedDistributor: 'Hachette Distribution',
  56  |   },
  57  |   {
  58  |     isbn: '9782070413119',
  59  |     title: 'Les Misérables (Folio)',
  60  |     expectedGroup: 'Madrigall',
  61  |     expectedDistributor: 'Sodis + Union Distribution',
  62  |   },
  63  |   {
  64  |     isbn: '9782246815471',
  65  |     title: 'Sérotonine',
  66  |     expectedGroup: 'Lagardère',
  67  |     expectedDistributor: 'Hachette Distribution',
  68  |   },
  69  |   {
  70  |     isbn: '9782264078910',
  71  |     title: 'Americanah',
  72  |     expectedGroup: 'Editis',
  73  |     expectedDistributor: 'Interforum',
  74  |   },
  75  |   {
  76  |     isbn: '9782221197752',
  77  |     title: 'Dune',
  78  |     expectedGroup: 'Editis',
  79  |     expectedDistributor: 'Interforum',
  80  |   },
  81  |   {
  82  |     isbn: '9782072882517',
  83  |     title: 'Les Années',
  84  |     expectedGroup: 'Madrigall',
  85  |     expectedDistributor: 'Sodis + Union Distribution',
  86  |   },
  87  |   {
  88  |     isbn: '9782253933656',
  89  |     title: "La Vérité sur l'affaire Harry Quebert",
  90  |     expectedGroup: 'Lagardère',
  91  |     expectedDistributor: 'Hachette Distribution',
  92  |   },
  93  |   {
  94  |     isbn: '9782742793395',
  95  |     title: 'Boussole',
  96  |     expectedGroup: 'Actes Sud',
  97  |     expectedDistributor: 'Hachette Distribution',
  98  |   },
  99  |   {
  100 |     isbn: '9782714450463',
  101 |     title: 'Le Lambeau',
  102 |     expectedGroup: 'Madrigall',
  103 |     expectedDistributor: 'Sodis + Union Distribution',
  104 |   },
  105 |   {
  106 |     isbn: '9782259307680',
  107 |     title: 'Civilizations',
  108 |     expectedGroup: 'Lagardère',
  109 |     expectedDistributor: 'Hachette Distribution',
  110 |   },
  111 |   {
  112 |     isbn: '9782021463743',
  113 |     title: 'Le Capital au XXIe siècle',
  114 |     expectedGroup: 'Média-Participations',
  115 |     expectedDistributor: 'Sodis',
  116 |   },
  117 |   {
  118 |     isbn: '9782290383599',
  119 |     title: 'La Peste',
  120 |     expectedGroup: 'Madrigall',
  121 |     expectedDistributor: 'Sodis + Union Distribution',
  122 |   },
  123 |   {
  124 |     isbn: '9782253178347',
  125 |     title: 'Les Bienveillantes',
  126 |     expectedGroup: 'Lagardère',
  127 |     expectedDistributor: 'Hachette Distribution',
  128 |   },
  129 |   {
  130 |     isbn: '9782207166741',
  131 |     title: 'Fondation',
  132 |     expectedGroup: 'Madrigall',
  133 |     expectedDistributor: 'Sodis + Union Distribution',
  134 |   },
  135 | ];
  136 | 
  137 | async function scanIsbn(page: Page, isbn: string): Promise<void> {
  138 |   await page.getByRole('button', { name: 'Scanner un livre' }).click();
  139 |   await page.getByPlaceholder('ISBN manuel — 978…').fill(isbn);
  140 |   await page.getByRole('button', { name: 'OK' }).click();
  141 |   // Wait up to 45 s for the external book API to respond and the result to render
  142 |   await expect(
  143 |     page.getByRole('button', { name: /Scanner un autre livre/ }),
> 144 |   ).toBeVisible({ timeout: 45_000 });
      |     ^ Error: expect(locator).toBeVisible() failed
  145 | }
  146 | 
  147 | test.describe('Scan ISBN → vérification chaîne éditoriale (production)', () => {
  148 |   for (const book of BOOKS) {
  149 |     test(`${book.isbn} — ${book.title}`, async ({ page }) => {
  150 |       await page.goto('./');
  151 |       await scanIsbn(page, book.isbn);
  152 | 
  153 |       // The "Éditeur non identifié" banner must not appear
  154 |       await expect(page.getByText('Éditeur non identifié')).not.toBeVisible();
  155 | 
  156 |       // Onglet Édition (actif par défaut) — vérifier le groupe
  157 |       await expect(page.getByText(book.expectedGroup).first()).toBeVisible();
  158 | 
  159 |       // Onglet Distribution — vérifier le distributeur
  160 |       await page.getByRole('button', { name: 'Distribution' }).click();
  161 |       await expect(page.getByText(book.expectedDistributor).first()).toBeVisible();
  162 |     });
  163 |   }
  164 | });
  165 | 
```