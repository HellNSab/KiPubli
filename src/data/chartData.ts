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
  description: string
  actors: Actor[]
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
      description: "La librairie est le seul acteur qui vous fait face. Elle achète les livres au distributeur avec une remise de 30 à 33%, paie le loyer, les salaires, et assume le risque des invendus. Sa marge nette tourne autour de 1% — l'un des commerces les moins rentables de France. Les 3 200 librairies indépendantes restent pourtant le premier circuit de vente du livre, devant Amazon et la Fnac.",
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
      description: "L'éditeur choisit les livres, finance leur fabrication, fixe le prix et décide des tirages. En apparence nombreux — il existe ~8 000 maisons d'édition en France — le secteur est en réalité très concentré : trois groupes (Lagardère, Editis, Madrigall) réalisent plus de 50% des ventes. Beaucoup de marques que vous connaissez — Pocket, Folio, 10/18 — sont des étiquettes commerciales de ces groupes, pas des éditeurs indépendants.",
      actors: [
        { id: 'lagardere',     label: 'Lagardère / LVMH',       weight: 9 },
        { id: 'editis',        label: 'Editis / CMA CGM',        weight: 8 },
        { id: 'madrigall',     label: 'Madrigall',               weight: 7 },
        { id: 'media-part',    label: 'Média-Participations',    weight: 4 },
        { id: 'actes-sud',     label: 'Actes Sud',               weight: 3 },
        { id: 'albin-michel',  label: 'Albin Michel',            weight: 3 },
        { id: 'humensis',      label: 'Humensis',                weight: 2 },
        { id: 'petit-1',       label: 'Petits éditeurs indép.',  weight: 1 },
        { id: 'petit-2',       label: 'Petits éditeurs indép.',  weight: 1 },
        { id: 'petit-3',       label: 'Petits éditeurs indép.',  weight: 1 },
        { id: 'petit-4',       label: 'Petits éditeurs indép.',  weight: 1 },
        { id: 'petit-5',       label: 'Petits éditeurs indép.',  weight: 1 },
      ],
    },
    {
      id: 'diffusion-distribution',
      label: 'Diffusion & distribution',
      color: '#F59E0B',
      euros: 2.60,
      pct: 0.13,
      description: "Le diffuseur et le distributeur sont les deux maillons logistiques et commerciaux entre l'éditeur et la librairie. Le diffuseur envoie ses représentants en librairie pour présenter les nouveautés et prendre les commandes. Le distributeur achemine physiquement les livres, gère les stocks et traite les retours. Sans eux, un livre n'existe pas en rayon. Le marché est extrêmement concentré : trois acteurs contrôlent l'essentiel du flux national.",
      actors: [
        { id: 'hachette-distrib', label: 'Hachette Distribution', weight: 10 },
        { id: 'interforum',       label: 'Interforum (Editis)',    weight: 9 },
        { id: 'sodis',            label: 'Sodis / Union Distrib.', weight: 7 },
        { id: 'autres-distrib',   label: 'Autres',                 weight: 2 },
      ],
    },
    {
      id: 'auteur',
      label: 'Auteur·e',
      color: '#EC4899',
      euros: 2.00,
      pct: 0.10,
      description: "L'auteur crée l'œuvre et touche en moyenne 8 à 10% du prix hors taxe — soit environ 1,60 € sur un livre à 20 €. Il est payé en dernier, après tous les autres intermédiaires, et n'a aucun contrôle sur la mise en rayon ni sur le choix du distributeur. Ils sont 101 600 auteurs de livres en France, pour la grande majorité avec des revenus très modestes tirés de l'écriture.",
      actors: Array.from({ length: 20 }, (_, i) => ({ id: `a${i + 1}`, weight: 1 })),
    },
    {
      id: 'tva',
      label: 'TVA',
      color: '#64748B',
      euros: 1.10,
      pct: 0.06,
      description: "Le livre bénéficie d'un taux de TVA réduit à 5,5%, contre 20% pour la plupart des biens. C'est une exception culturelle française qui date de 1971, reconnaissant le livre comme bien essentiel. Ce taux s'applique aussi bien aux livres physiques qu'aux livres numériques depuis 2012.",
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
      description: "Les groupes éditoriaux détiennent plusieurs maisons d'édition sous une même holding. C'est à ce niveau que se prennent les décisions stratégiques et financières. Le secteur est fortement concentré : une poignée de groupes contrôle la majorité des ventes, des capacités de distribution, et donc de la visibilité en librairie.",
      actors: [
        { id: 'lvmh',          label: 'LVMH / Arnault',    weight: 8 },
        { id: 'cmacgm',        label: 'CMA CGM / Saadé',   weight: 7 },
        { id: 'fam-gallimard', label: 'Fam. Gallimard',    weight: 6 },
        { id: 'fam-lombard',   label: 'Fam. Lombard',      weight: 5 },
        { id: 'fam-nyssen',    label: 'Fam. Nyssen',       weight: 4 },
        { id: 'fam-esmenard',  label: 'Fam. Esménard',     weight: 4 },
        { id: 'andera',        label: 'Andera / CDC',      weight: 3 },
      ],
    },
  ],
}
