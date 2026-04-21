// Bubble coordinates are in SLICE-LOCAL space, applied after rotating the
// slice group so that:
//   +y points radially outward (toward the pie's outer edge)
//   +x points along the arc tangent (counter-clockwise in math sense)
//
// Valid y range: roughly [-37, +37] (radial thickness of the annulus).
// Valid x range: depends on slice width — narrower at inner edge (y=-37),
// wider at outer edge (y=+37). Tight overflow is clipped by the arc clipPath.

export type Bubble = {
  id: string
  label?: string
  x: number
  y: number
  r: number
}

export type Slice = {
  id: string
  label: string
  color: string
  euros: number
  pct: number
  tagline: string
  description: string
  bubbles: Bubble[]
}

export type ChartData = {
  title: string
  slices: Slice[]
}

export const CHART_DATA: ChartData = {
  title: "Où va l'argent d'un livre à 20 €",
  slices: [
    {
      id: 'librairie',
      label: 'Librairie',
      color: '#10B981',
      euros: 6.0,
      pct: 0.30,
      tagline: "3 200 librairies indépendantes · marge nette ~1%",
      description: "La librairie est le seul acteur qui vous fait face. Elle achète les livres au distributeur avec une remise de 30 à 33%, paie le loyer, les salaires, et assume le risque des invendus. Sa marge nette tourne autour de 1% — l'un des commerces les moins rentables de France. Les 3 200 librairies indépendantes restent pourtant le premier circuit de vente du livre, devant Amazon et la Fnac.",
      bubbles: [
        { id: 'librairies-independantes', label: 'Librairies indépendantes', x: 0,   y: -4,  r: 11 },
        { id: 'fnac-cultura',             label: 'Fnac / Cultura',           x: -28, y: -16, r: 9  },
        { id: 'amazon-ligne',             label: 'Amazon & vente en ligne',  x: 28,  y: -18, r: 8  },
        { id: 'gsa',                      label: 'Grande distribution',      x: -20, y: 16,  r: 8  },
        // Autres circuits — split into small dots to show diversity
        { id: 'autres-1', label: 'Autres circuits', x: 16,  y: 10, r: 3 },
        { id: 'autres-2', label: 'Autres circuits', x: 26,  y: 22, r: 3 },
        { id: 'autres-3', label: 'Autres circuits', x: 10,  y: 26, r: 3 },
        { id: 'autres-4', label: 'Autres circuits', x: -8,  y: 26, r: 3 },
        { id: 'autres-5', label: 'Autres circuits', x: -32, y: 28, r: 3 },
      ],
    },
    {
      id: 'editeur',
      label: 'Éditeur',
      color: '#6366F1',
      euros: 5.60,
      pct: 0.28,
      tagline: "~8 000 maisons d'édition · 3 groupes font +50% des ventes",
      description: "L'éditeur choisit les livres, finance leur fabrication, fixe le prix et décide des tirages. En apparence nombreux — il existe ~8 000 maisons d'édition en France — le secteur est en réalité très concentré : trois groupes (Lagardère, Editis, Madrigall) réalisent plus de 50% des ventes. Beaucoup de marques que vous connaissez — Pocket, Folio, 10/18 — sont des étiquettes commerciales de ces groupes, pas des éditeurs indépendants.",
      bubbles: [
        { id: 'lagardere',    label: 'Lagardère / LVMH',    x: -25, y: -12, r: 12 },
        { id: 'editis',       label: 'Editis / CMA CGM',    x: -1,  y: -18, r: 11 },
        { id: 'madrigall',    label: 'Madrigall',           x: 24,  y: -14, r: 10 },
        { id: 'media-part',   label: 'Média-Participations',x: -30, y: 12,  r: 8  },
        { id: 'actes-sud',    label: 'Actes Sud',           x: -12, y: 14,  r: 7  },
        { id: 'albin-michel', label: 'Albin Michel',        x: 8,   y: 17,  r: 7  },
        { id: 'humensis',     label: 'Humensis',            x: 25,  y: 11,  r: 5  },
        // Long tail of ~8 000 maisons — many tiny dots
        { id: 'petit-1',  label: 'Petits éditeurs indép.', x: -38, y: -2,  r: 3 },
        { id: 'petit-2',  label: 'Petits éditeurs indép.', x: 38,  y: -2,  r: 3 },
        { id: 'petit-3',  label: 'Petits éditeurs indép.', x: -34, y: 26,  r: 3 },
        { id: 'petit-4',  label: 'Petits éditeurs indép.', x: -22, y: 26,  r: 3 },
        { id: 'petit-5',  label: 'Petits éditeurs indép.', x: 0,   y: 28,  r: 3 },
        { id: 'petit-6',  label: 'Petits éditeurs indép.', x: 18,  y: 28,  r: 3 },
        { id: 'petit-7',  label: 'Petits éditeurs indép.', x: 32,  y: 26,  r: 3 },
        { id: 'petit-8',  label: 'Petits éditeurs indép.', x: -42, y: 18,  r: 3 },
        { id: 'petit-9',  label: 'Petits éditeurs indép.', x: 42,  y: 20,  r: 3 },
        { id: 'petit-10', label: 'Petits éditeurs indép.', x: -8,  y: 32,  r: 3 },
        { id: 'petit-11', label: 'Petits éditeurs indép.', x: 10,  y: 34,  r: 3 },
        { id: 'petit-12', label: 'Petits éditeurs indép.', x: 26,  y: 34,  r: 3 },
      ],
    },
    {
      id: 'diffusion-distribution',
      label: 'Diffusion',
      color: '#F59E0B',
      euros: 2.60,
      pct: 0.13,
      tagline: "3 acteurs contrôlent l'essentiel du flux national",
      description: "Le diffuseur et le distributeur sont les deux maillons logistiques et commerciaux entre l'éditeur et la librairie. Le diffuseur envoie ses représentants en librairie pour présenter les nouveautés et prendre les commandes. Le distributeur achemine physiquement les livres, gère les stocks et traite les retours. Sans eux, un livre n'existe pas en rayon. Le marché est extrêmement concentré : trois acteurs contrôlent l'essentiel du flux national.",
      bubbles: [
        { id: 'hachette-distrib', label: 'Hachette Distribution', x: -14, y: 8,   r: 13 },
        { id: 'interforum',       label: 'Interforum (Editis)',    x: 16,  y: 6,   r: 12 },
        { id: 'sodis',            label: 'Sodis / Union Distrib.', x: 0,   y: -18, r: 11 },
        // Only 2 tiny "Autres" dots — sector is concentrated
        { id: 'autres-distrib-1', label: 'Autres', x: -10, y: 28, r: 2.5 },
        { id: 'autres-distrib-2', label: 'Autres', x: 14,  y: 26, r: 2.5 },
      ],
    },
    {
      id: 'auteur',
      label: 'Auteur',
      color: '#EC4899',
      euros: 2.00,
      pct: 0.10,
      tagline: "101 600 auteurs · royalties ~8 à 10% du prix HT",
      description: "L'auteur crée l'œuvre et touche en moyenne 8 à 10% du prix hors taxe — soit environ 1,60 € sur un livre à 20 €. Il est payé en dernier, après tous les autres intermédiaires, et n'a aucun contrôle sur la mise en rayon ni sur le choix du distributeur. Ils sont 101 600 auteurs de livres en France, pour la grande majorité avec des revenus très modestes tirés de l'écriture.",
      // ~33 tiny dots to convey "101 600 auteurs" — max diversity
      bubbles: [
        { id: 'a01', label: 'Auteur·e', x: -12, y: -28, r: 2.3 },
        { id: 'a02', label: 'Auteur·e', x: -4,  y: -29, r: 2.3 },
        { id: 'a03', label: 'Auteur·e', x: 4,   y: -28, r: 2.3 },
        { id: 'a04', label: 'Auteur·e', x: 12,  y: -28, r: 2.3 },
        { id: 'a05', label: 'Auteur·e', x: -16, y: -18, r: 2.3 },
        { id: 'a06', label: 'Auteur·e', x: -7,  y: -19, r: 2.3 },
        { id: 'a07', label: 'Auteur·e', x: 2,   y: -20, r: 2.3 },
        { id: 'a08', label: 'Auteur·e', x: 11,  y: -18, r: 2.3 },
        { id: 'a09', label: 'Auteur·e', x: -21, y: -8,  r: 2.3 },
        { id: 'a10', label: 'Auteur·e', x: -12, y: -9,  r: 2.3 },
        { id: 'a11', label: 'Auteur·e', x: -3,  y: -10, r: 2.3 },
        { id: 'a12', label: 'Auteur·e', x: 6,   y: -9,  r: 2.3 },
        { id: 'a13', label: 'Auteur·e', x: 15,  y: -8,  r: 2.3 },
        { id: 'a14', label: 'Auteur·e', x: -24, y: 2,   r: 2.3 },
        { id: 'a15', label: 'Auteur·e', x: -15, y: 1,   r: 2.3 },
        { id: 'a16', label: 'Auteur·e', x: -6,  y: 0,   r: 2.3 },
        { id: 'a17', label: 'Auteur·e', x: 3,   y: 2,   r: 2.3 },
        { id: 'a18', label: 'Auteur·e', x: 12,  y: 1,   r: 2.3 },
        { id: 'a19', label: 'Auteur·e', x: 21,  y: 2,   r: 2.3 },
        { id: 'a20', label: 'Auteur·e', x: -27, y: 12,  r: 2.3 },
        { id: 'a21', label: 'Auteur·e', x: -18, y: 13,  r: 2.3 },
        { id: 'a22', label: 'Auteur·e', x: -9,  y: 11,  r: 2.3 },
        { id: 'a23', label: 'Auteur·e', x: 0,   y: 13,  r: 2.3 },
        { id: 'a24', label: 'Auteur·e', x: 9,   y: 12,  r: 2.3 },
        { id: 'a25', label: 'Auteur·e', x: 18,  y: 13,  r: 2.3 },
        { id: 'a26', label: 'Auteur·e', x: 27,  y: 12,  r: 2.3 },
        { id: 'a27', label: 'Auteur·e', x: -30, y: 22,  r: 2.3 },
        { id: 'a28', label: 'Auteur·e', x: -20, y: 24,  r: 2.3 },
        { id: 'a29', label: 'Auteur·e', x: -3,  y: 24,  r: 2.3 },
        { id: 'a30', label: 'Auteur·e', x: 15,  y: 24,  r: 2.3 },
        { id: 'a31', label: 'Auteur·e', x: 26,  y: 22,  r: 2.3 },
        { id: 'a32', label: 'Auteur·e', x: -12, y: 33,  r: 2.3 },
        { id: 'a33', label: 'Auteur·e', x: 8,   y: 33,  r: 2.3 },
      ],
    },
    {
      id: 'tva',
      label: 'TVA',
      color: '#64748B',
      euros: 1.10,
      pct: 0.06,
      tagline: "Taux réduit à 5,5% — exception culturelle depuis 1971",
      description: "Le livre bénéficie d'un taux de TVA réduit à 5,5%, contre 20% pour la plupart des biens. C'est une exception culturelle française qui date de 1971, reconnaissant le livre comme bien essentiel. Ce taux s'applique aussi bien aux livres physiques qu'aux livres numériques depuis 2012.",
      // Monopolist — one big bubble
      bubbles: [
        { id: 'etat', label: 'État français', x: 0, y: 3, r: 12 },
      ],
    },
    {
      id: 'groupe',
      label: 'Groupe',
      color: '#818CF8',
      euros: 1.60,
      pct: 0.08,
      tagline: "Une poignée de groupes · contrôle des ventes et de la distribution",
      description: "Les groupes éditoriaux détiennent plusieurs maisons d'édition sous une même holding. C'est à ce niveau que se prennent les décisions stratégiques et financières. Le secteur est fortement concentré : une poignée de groupes contrôle la majorité des ventes, des capacités de distribution, et donc de la visibilité en librairie.",
      bubbles: [
        { id: 'lvmh',          label: 'LVMH / Arnault',    x: 0,   y: -18, r: 11 },
        { id: 'cmacgm',        label: 'CMA CGM / Saadé',   x: -11, y: -2,  r: 9  },
        { id: 'fam-gallimard', label: 'Fam. Gallimard',    x: 11,  y: -2,  r: 9  },
        { id: 'fam-lombard',   label: 'Fam. Lombard',      x: -10, y: 14,  r: 7  },
        { id: 'fam-nyssen',    label: 'Fam. Nyssen',       x: 6,   y: 14,  r: 6  },
        { id: 'fam-esmenard',  label: 'Fam. Esménard',     x: -8,  y: 26,  r: 5  },
        { id: 'andera',        label: 'Andera / CDC',      x: 8,   y: 26,  r: 4  },
      ],
    },
  ],
}
