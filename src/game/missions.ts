// ARTILLERY COMMAND v2 — Récit : 7 missions scénarisées + événements
import type { MissionDef, CampaignEvent } from "./types";

// ====================================================================
// MISSIONS PRINCIPALES — la saga de Theranie
// ====================================================================
export const STORY: MissionDef[] = [
  {
    id: "s0",
    name: "Le Baptême du Feu",
    terr: "vallee",
    type: "destruction",
    seed: 1107,
    turns: 14,
    rank: 0,
    tg: [["depot", 1], ["bunker", 1]],
    reward: 300,
    xp: 130,
    sec: ["shots:8", "noStrike"],
    unlock: "kharga",
    wind: [2, 5],
    who: "Maréchale Vaugrenard",
    brief:
      "Lieutenant. L'Union Sarkovienne a franchi la rivière d'Aurel pendant la nuit. Un dépôt et une casemate sont à portée de vos tubes. Prouvez-moi que je peux vous confier plus qu'une section. Désignez, calculez, corrigez. Et bougez avant qu'ils ne vous localisent.",
  },
  {
    id: "s1",
    name: "Les Sables de Kharga",
    terr: "kharga",
    type: "interdiction",
    seed: 2291,
    turns: 14,
    rank: 0,
    tg: [["convoi", 1], ["depot", 1], ["radar", 0]],
    reward: 420,
    xp: 160,
    sec: ["optional", "shots:10"],
    unlock: "veylebois",
    wind: [7, 13],
    who: "Maréchale Vaugrenard",
    brief:
      "Sarkov ravitaille son front par les pistes de Kharga. Un convoi traverse le secteur ce matin : il ne doit pas en sortir. Le vent du désert est traître — corrigez large. La Ligue Sorelienne observe : le Comte Sorel jugera si vous êtes un client digne de ce nom.",
  },
  {
    id: "s2",
    name: "Sous la Canopée",
    terr: "veylebois",
    type: "recon",
    seed: 3344,
    turns: 16,
    rank: 1,
    tg: [["pc", 1], ["depot", 1], ["batterie", 0]],
    reward: 520,
    xp: 190,
    sec: ["optional", "noStrike"],
    unlock: "orsk",
    unknown: true,
    who: "Mère Ysolde Veyl",
    brief:
      "Vous êtes chez nous, artilleur. Le Directoire Sarkovien cache un poste de commandement sous nos arbres. Nous connaissons la forêt, pas l'emplacement exact : envoyez vos drones avant de gaspiller vos obus. La canopée vous dissimule — mais elle ne pardonnera pas un tir à l'aveugle.",
  },
  {
    id: "s3",
    name: "La Crête d'Orsk",
    terr: "orsk",
    type: "destruction",
    seed: 4417,
    turns: 16,
    rank: 1,
    ridge: true,
    tg: [["radar", 1], ["bunker", 1], ["batterie", 1]],
    reward: 650,
    xp: 220,
    sec: ["shots:12", "noStrike"],
    unlock: "norden",
    wind: [5, 11],
    who: "Maréchale Vaugrenard",
    brief:
      "Les positions d'Orsk sont derrière la crête. Un tir tendu s'écrasera sur le versant : il vous faudra un tir plongeant, donc un long temps de vol, donc beaucoup de dérive. Le radar d'abord, sinon leur batterie vous aura repéré avant votre troisième coup. Soyez méthodique.",
  },
  {
    id: "s4",
    name: "Les Toits de Nordenbourg",
    terr: "norden",
    type: "destruction",
    seed: 5523,
    turns: 16,
    rank: 2,
    civil: 5,
    tg: [["pc", 1], ["batterie", 1], ["depot", 0]],
    reward: 800,
    xp: 260,
    sec: ["noCivil", "optional"],
    who: "Maréchale Vaugrenard",
    brief:
      "Nordenbourg est encore habitée. Sarkov le sait et s'en sert comme bouclier. Je veux son poste de commandement, et je veux pouvoir regarder les habitants en face ensuite. Chaque obus en zone civile nous coûtera plus cher qu'une bataille perdue. Précision chirurgicale, Lieutenant.",
  },
  {
    id: "s5",
    name: "Le Gueulard de Sarkov",
    terr: "orsk",
    type: "contrebatterie",
    seed: 6601,
    turns: 18,
    rank: 2,
    ridge: true,
    tg: [["superbat", 1], ["radar", 1], ["batterie", 1], ["bunker", 0]],
    reward: 1300,
    xp: 400,
    sec: ["noStrike", "shots:16"],
    wind: [4, 12],
    who: "Maréchal Grigori Sarkov (intercepté)",
    brief:
      "« Commandant. Vous avez été un adversaire instructif. Le Gueulard est en batterie derrière la crête, et il connaît déjà votre secteur. Tirez, et je vous réponds. Ne tirez pas, et j'avance. Voyons lequel de nous deux compte le mieux. »",
  },
];

// ====================================================================
// ÉVÉNEMENTS NARRATIFS — décisions à choix multiples
// ====================================================================
export const EVENTS: Record<string, CampaignEvent> = {
  alliance: {
    id: "alliance",
    title: "Deux mains tendues",
    who: "Maréchale Vaugrenard",
    text:
      "La Ligue Sorelienne et le Conclave des Veilleurs proposent chacun un pacte, et chacun exige que nous refusions l'autre. Le Comte Sorel offre ses prix et ses entrepôts. Mère Veyl offre ses éclaireurs et le couvert de ses bois. Vous êtes sur le terrain : je suivrai votre avis.",
    opts: [
      {
        label: "Signer avec la Ligue Sorelienne",
        eff: { rep: { sorel: 30, veyl: -20 }, flag: "pacteLigue" },
        res: "Sorel sourit trop. Vos prix baissent de 20 %. Veyl ne répond plus à la radio.",
      },
      {
        label: "Signer avec le Conclave",
        eff: { rep: { veyl: 30, sorel: -20 }, flag: "pacteConclave", drones: 2 },
        res: "Les éclaireurs de Veyl couvrent vos positions en forêt et vous confient deux drones. La Ligue augmente ses tarifs.",
      },
    ],
  },
  caravane: {
    id: "caravane",
    title: "Caravane en panne",
    who: "Radio de la Ligue",
    text: "Une caravane sorelienne est immobilisée à découvert, à quelques kilomètres. Elle demande du carburant.",
    opts: [
      {
        label: "Céder 5 unités de carburant",
        eff: { fuel: -5, rep: { sorel: 10 } },
        res: "La caravane repart. Sorel fait savoir qu'il n'oublie pas.",
      },
      { label: "Passer son chemin", eff: { rep: { sorel: -4 } }, res: "Vous gardez vos réserves. La radio de la Ligue se tait." },
    ],
  },
  deserteur: {
    id: "deserteur",
    title: "Le Transfuge",
    who: "Poste avancé",
    text: "Un officier sarkovien s'est présenté aux avant-postes avec des cartes. Il demande 100 crédits et un sauf-conduit.",
    opts: [
      {
        label: "Payer 100 crédits",
        need: { credits: 100 },
        eff: { credits: -100, flag: "intel", rep: { theranie: 3 } },
        res: "Ses cartes sont authentiques : lors de la prochaine opération, tous les objectifs seront localisés d'emblée.",
      },
      {
        label: "Le remettre à l'état-major",
        eff: { rep: { theranie: 6 } },
        res: "Vaugrenard apprécie le respect de la procédure.",
      },
    ],
  },
  obus: {
    id: "obus",
    title: "Les partisans manquent d'obus",
    who: "Mère Ysolde Veyl",
    text: "Le Conclave tient un col avec trois mortiers et presque plus rien à tirer. Veyl demande six obus.",
    opts: [
      {
        label: "Donner 6 OBX",
        need: { he: 6 },
        eff: { he: -6, rep: { veyl: 12 } },
        res: "Le col tient. Les partisans parlent de vous autour des feux.",
      },
      { label: "Refuser", eff: { rep: { veyl: -6 } }, res: "Le col tombe dans la nuit. Veyl ne dit rien — ce qui est pire." },
    ],
  },
  inspection: {
    id: "inspection",
    title: "Inspection de l'état-major",
    who: "Intendance de Theranie",
    text: "Un contrôleur vérifie vos registres de consommation. Vous pouvez présenter les chiffres réels ou les arranger pour obtenir une dotation.",
    opts: [
      {
        label: "Présenter les chiffres réels",
        eff: { rep: { theranie: 6 }, credits: 60 },
        res: "Registres impeccables. Une petite prime de bonne gestion vous est versée.",
      },
      {
        label: "Arranger les chiffres",
        eff: { credits: 220, rep: { theranie: -8 } },
        res: "La dotation tombe. Le contrôleur a froncé les sourcils : votre dossier porte désormais une annotation.",
      },
    ],
  },
  tempete: {
    id: "tempete",
    title: "Tempête sur le parc",
    who: "Chef de pièce",
    text: "Une tempête menace le parc à carburant. On peut louer des bâches lestées à la Ligue, ou accepter les pertes.",
    opts: [
      {
        label: "Louer les bâches (80 crédits)",
        need: { credits: 80 },
        eff: { credits: -80, rep: { sorel: 3 } },
        res: "Le parc est intact au matin.",
      },
      { label: "Accepter les pertes", eff: { fuel: -6 }, res: "Six unités de carburant sont perdues dans la nuit." },
    ],
  },
  marche: {
    id: "marche",
    title: "Le marché de minuit",
    who: "Comte Aldric Sorel",
    text: "« J'ai deux drones et deux fumigènes tombés d'un camion. 90 crédits le lot, et personne ne pose de question. »",
    opts: [
      {
        label: "Acheter le lot (90 crédits)",
        need: { credits: 90 },
        eff: { credits: -90, drones: 2, smoke: 2, rep: { sorel: 4, veyl: -3 } },
        res: "Le matériel est neuf. Le Conclave, lui, sait d'où il vient.",
      },
      { label: "Décliner", eff: {}, res: "Sorel hausse les épaules. Il reviendra." },
    ],
  },
};

export const RANDOM_EVENTS = ["caravane", "deserteur", "obus", "inspection", "tempete", "marche"];

// ====================================================================
// NOMS DE MISSIONS GÉNÉRIQUES (contrats dynamiques)
// ====================================================================
export const MISSION_NAMES: Record<string, string[]> = {
  destruction: ["Coup de masse", "Fer rouge", "Table rase", "Marteau-pilon"],
  interdiction: ["Route coupée", "Verrou", "Embuscade lointaine", "Nasse"],
  recon: ["Yeux ouverts", "Aiguille dans la mousse", "Lanterne"],
  contrebatterie: ["Duel", "Œil pour œil", "Réplique"],
  appui: ["Dernier rempart", "Mur de feu", "Tenir"],
  reconquete: ["Retour en force"],
};

export const MISSION_BRIEFS: Record<string, string> = {
  destruction: "Positions ennemies repérées. Détruisez les objectifs principaux avant la fin de la fenêtre.",
  interdiction: "Un mouvement logistique traverse le secteur. Rien ne doit en sortir.",
  recon: "Activité ennemie sous couvert. Localisez, puis frappez.",
  contrebatterie: "Une batterie adverse harcèle nos lignes. Faites-la taire avant qu'elle ne vous trouve.",
  appui: "Une colonne ennemie marche sur un poste allié. Arrêtez-la avant le contact.",
  reconquete: "Le territoire est tombé. Brisez les positions sarkoviennes pour y reprendre pied.",
};
