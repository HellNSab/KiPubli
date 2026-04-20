export type Actor = {
  id: string
  label?: string
  weight: number
}

export type Slice = {
  id: string
  label: string
  color: string
  euros: number
  pct: number
  detail: string
  actors: Actor[]
}

export const BOOK_MONEY_DATA: Slice[] = [
  {
    id: 'librairie',
    label: 'Librairie',
    color: '#10B981',
    euros: 6.0,
    pct: 0.30,
    detail: '3 200 librairies indépendantes · 40% du marché · marge nette ~1%',
    actors: [
      { id: 'librairies-independantes', label: 'Librairies indépendantes', weight: 6 },
      { id: 'fnac-cultura',             label: 'Fnac / Cultura',           weight: 4 },
      { id: 'gsa',                      label: 'Grande distribution',      weight: 3 },
      { id: 'amazon-ligne',             label: 'Amazon & vente en ligne',  weight: 3 },
      { id: 'autres-circuits',          label: 'Autres circuits',          weight: 2 },
    ],
  },
  {
    id: 'editeur',
    label: 'Éditeur',
    color: '#6366F1',
    euros: 5.60,
    pct: 0.28,
    detail: '~8 000 maisons d\'édition · 3 groupes font +50% des ventes',
    actors: [
      { id: 'lagardere',        label: 'Lagardère / LVMH',      weight: 9 },
      { id: 'editis',           label: 'Editis / CMA CGM',      weight: 8 },
      { id: 'madrigall',        label: 'Madrigall',             weight: 7 },
      { id: 'media-participations', label: 'Média-Participations', weight: 4 },
      { id: 'actes-sud',        label: 'Actes Sud',             weight: 3 },
      { id: 'albin-michel',     label: 'Albin Michel',          weight: 3 },
      { id: 'humensis',         label: 'Humensis',              weight: 2 },
      { id: 'petits-editeurs',  label: 'Petits éditeurs indép.', weight: 1 },
      { id: 'petits-editeurs-2', label: 'Petits éditeurs indép.', weight: 1 },
      { id: 'petits-editeurs-3', label: 'Petits éditeurs indép.', weight: 1 },
      { id: 'petits-editeurs-4', label: 'Petits éditeurs indép.', weight: 1 },
      { id: 'petits-editeurs-5', label: 'Petits éditeurs indép.', weight: 1 },
    ],
  },
  {
    id: 'distribution',
    label: 'Distribution',
    color: '#F59E0B',
    euros: 2.60,
    pct: 0.13,
    detail: '3 acteurs majeurs · Hachette + Interforum = ~60% du marché',
    actors: [
      { id: 'hachette-distrib', label: 'Hachette Distribution',  weight: 10 },
      { id: 'interforum',       label: 'Interforum (Editis)',     weight: 9 },
      { id: 'sodis',            label: 'Sodis / Union Distrib.',  weight: 7 },
      { id: 'autres-distrib',   label: 'Autres',                 weight: 2 },
    ],
  },
  {
    id: 'auteur',
    label: 'Auteur',
    color: '#EC4899',
    euros: 2.00,
    pct: 0.10,
    detail: '101 600 auteurs · 8–10% du prix HT · payés en dernier',
    actors: Array.from({ length: 20 }, (_, i) => ({ id: `a${i + 1}`, weight: 1 })),
  },
  {
    id: 'tva',
    label: 'TVA',
    color: '#64748B',
    euros: 1.10,
    pct: 0.06,
    detail: 'Taux réduit 5,5% · exception culturelle française',
    actors: [
      { id: 'etat', label: 'État français', weight: 10 },
    ],
  },
  {
    id: 'groupe',
    label: 'Groupe holding',
    color: '#818CF8',
    euros: 1.60,
    pct: 0.08,
    detail: 'Les groupes éditoriaux détiennent plusieurs maisons d\'édition sous une même holding. C\'est à ce niveau que se prennent les décisions stratégiques et financières. Le secteur est fortement concentré.',
    actors: [
      { id: 'lvmh',             label: 'LVMH / Arnault',     weight: 8 },
      { id: 'cmacgm',           label: 'CMA CGM / Saadé',    weight: 7 },
      { id: 'gallimard-famille', label: 'Fam. Gallimard',    weight: 6 },
      { id: 'lombard',          label: 'Fam. Lombard',       weight: 5 },
      { id: 'nyssen',           label: 'Fam. Nyssen',        weight: 4 },
      { id: 'esmenard',         label: 'Fam. Esménard',      weight: 4 },
      { id: 'andera',           label: 'Andera / CDC',       weight: 3 },
    ],
  },
]
