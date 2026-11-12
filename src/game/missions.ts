// ARTILLERY COMMAND — Données de campagne et missions
// Univers militaire fictif d'Atalan. 7 missions principales + branches.
import type { CampaignNode, MissionSpec, Coord, TerrainFeature, TargetSpec, Weather } from "./types";

// Helpers pour construire des terrains rapidement
function square(cx: number, cy: number, half: number): Coord[] {
  return [
    { x: cx - half, y: cy - half },
    { x: cx + half, y: cy - half },
    { x: cx + half, y: cy + half },
    { x: cx - half, y: cy + half },
  ];
}

function poly(coords: [number, number][]): Coord[] {
  return coords.map(([x, y]) => ({ x, y }));
}

// ====================================================================
// MISSIONS
// ====================================================================
const M1_TRAINING: MissionSpec = {
  id: "m1_training",
  title: "Opération Sablier",
  codename: "SABLIER",
  biome: "plain",
  mapSize: 12000,
  batteryStart: { x: 1500, y: 1500 },
  brief:
    "Bienvenue à la 7e Batterie d'Élite, commandant. Avant tout déploiement opérationnel, vous devez valider vos compétences sur le champ de tir de Livrie. Trois cibles inertes ont été disposées à portée. Détruisez-les avec un minimum de munitions. Le général Veckmann observe vos performances.",
  objectives: [
    "Détruire les 3 cibles d'entraînement",
    "Maintenir le niveau de menace sous 50",
    "Utiliser au plus 8 obus",
  ],
  constraints: {
    maxShells: 12,
    threatLevel: 5,
    civilianRisk: false,
  },
  targets: [
    { id: "t1", name: "Cible A — blindé inerte", position: { x: 8500, y: 3500 }, radius: 30, hp: 60, maxHp: 60, priority: "primary", faction: "astorie", type: "vehicle", revealed: true },
    { id: "t2", name: "Cible B — bunker inerte", position: { x: 9500, y: 7500 }, radius: 40, hp: 90, maxHp: 90, priority: "primary", faction: "astorie", type: "structure", revealed: true },
    { id: "t3", name: "Cible C — colonneInactive", position: { x: 7000, y: 9500 }, radius: 35, hp: 70, maxHp: 70, priority: "secondary", faction: "astorie", type: "vehicle", revealed: true },
  ],
  terrain: [
    { type: "hill", points: square(4000, 8000, 600), elevation: 80, label: "Colline 801" },
    { type: "forest", points: square(7000, 7000, 700), label: "Bois Nord" },
    { type: "road", points: poly([[0, 3000], [12000, 4000]]), label: "Route Est-Ouest" },
  ],
  weather: {
    windSpeed: 4,
    windDirection: 90,
    visibility: 15000,
    temperature: 18,
    condition: "clear",
    airDensity: 1.0,
  },
  rewardXp: 100,
  rewardResources: 50,
  rewardUnlocks: [],
  narrativeOutro:
    "Le général Veckmann hoche la tête. « Vous avez le coup de main, commandant. Mais l'entraînement est une chose — la guerre en est une autre. La Confédération Drakovienne a franchi la frontière est. Votre batterie est rappelée au front. »",
  factionContext: "astorie",
  campaignChapter: 1,
};

const M2_BORDER: MissionSpec = {
  id: "m2_border",
  title: "La Frontière Est",
  codename: "LANCE-ROUGE",
  biome: "forest",
  mapSize: 14000,
  batteryStart: { x: 2000, y: 2000 },
  brief:
    "Les forces Drakoviennes ont franchi la frontière à l'aube. Une colonne blindée avance à travers la forêt de Veldmark vers le carrefour de Krezno. Votre batterie est la seule unité astorienne en position d'interdire le passage. Freinez-les avant qu'ils ne débouchent en plaine.",
  objectives: [
    "Détruire au moins 3 des 5 véhicules blindés Drakoviens",
    "Empêcher la colonne d'atteindre la plaine (sud-est)",
    "Ne pas être détecté (menace < 75)",
  ],
  constraints: {
    maxShells: 18,
    threatLevel: 20,
    civilianRisk: false,
  },
  targets: [
    { id: "v1", name: "Char Drak T-44", position: { x: 8000, y: 3000 }, radius: 25, hp: 80, maxHp: 80, priority: "primary", faction: "drakov", type: "vehicle", revealed: true, movable: true, speed: 80, movementPattern: "advance" },
    { id: "v2", name: "Char Drak T-44", position: { x: 8500, y: 4000 }, radius: 25, hp: 80, maxHp: 80, priority: "primary", faction: "drakov", type: "vehicle", revealed: true, movable: true, speed: 80, movementPattern: "advance" },
    { id: "v3", name: "Véhicule blindé Drak", position: { x: 9000, y: 5000 }, radius: 22, hp: 60, maxHp: 60, priority: "primary", faction: "drakov", type: "vehicle", revealed: true, movable: true, speed: 100, movementPattern: "advance" },
    { id: "v4", name: "Camion ravitaillement", position: { x: 7500, y: 3500 }, radius: 20, hp: 40, maxHp: 40, priority: "secondary", faction: "drakov", type: "supply", revealed: false, movable: true, speed: 70, movementPattern: "advance" },
    { id: "v5", name: "Char Drak T-44", position: { x: 9500, y: 4500 }, radius: 25, hp: 80, maxHp: 80, priority: "secondary", faction: "drakov", type: "vehicle", revealed: false, movable: true, speed: 80, movementPattern: "advance" },
  ],
  terrain: [
    { type: "forest", points: square(6000, 4000, 2500), label: "Forêt de Veldmark" },
    { type: "road", points: poly([[7000, 0], [11000, 14000]]), label: "Route Krezno" },
    { type: "hill", points: square(3000, 9000, 500), elevation: 60, label: "Colline 901" },
    { type: "water", points: square(11000, 2000, 800), label: "Rivière Bleune" },
  ],
  weather: {
    windSpeed: 8,
    windDirection: 270,
    visibility: 8000,
    temperature: 12,
    condition: "cloudy",
    airDensity: 1.02,
  },
  rewardXp: 200,
  rewardResources: 80,
  rewardUnlocks: [],
  narrativeOutro:
    "La colonne est brisée. Les survivants Drakoviens se replient en désordre. Mais à l'horizon, l'écho d'une autre batterie ennemie se fait entendre. La Ligue Marchande de Velka, jadis neutre, semble désormais impliquée...",
  factionContext: "drakov",
  campaignChapter: 2,
};

const M3_COUNTER_BATTERY: MissionSpec = {
  id: "m3_counter",
  title: "Contre-Batterie",
  codename: "ÉCHO",
  biome: "mountain",
  mapSize: 16000,
  batteryStart: { x: 2000, y: 8000 },
  brief:
    "Les Drakoviens ont installé deux batteries d'artillerie dans le massif de Korrath. Elles pilonnent nos lignes sans relâche. Contre-batterie : localisez et neutralisez ces pièces. L'usage d'obus illuminants est recommandé pour révéler leurs positions initialement masquées.",
  objectives: [
    "Détruire les 2 pièces d'artillerie Drakoviennes",
    "Révéler et détruire le poste d'observation ennemi",
    "Limiter les pertes civiles (village de Korrath proche)",
  ],
  constraints: {
    maxShells: 20,
    threatLevel: 35,
    civilianRisk: true,
  },
  targets: [
    { id: "ab1", name: "Batterie Drak Alpha", position: { x: 11000, y: 11000 }, radius: 35, hp: 100, maxHp: 100, priority: "primary", faction: "drakov", type: "artillery", revealed: false },
    { id: "ab2", name: "Batterie Drak Bravo", position: { x: 13000, y: 8000 }, radius: 35, hp: 100, maxHp: 100, priority: "primary", faction: "drakov", type: "artillery", revealed: false },
    { id: "obs1", name: "Poste d'observation Drak", position: { x: 14000, y: 13000 }, radius: 20, hp: 50, maxHp: 50, priority: "secondary", faction: "drakov", type: "structure", revealed: false },
    { id: "vil1", name: "Village de Korrath (civil)", position: { x: 10000, y: 9500 }, radius: 60, hp: 100, maxHp: 100, priority: "tertiary", faction: "astorie", type: "structure", revealed: true },
  ],
  terrain: [
    { type: "mountain", points: square(12000, 10000, 2500), elevation: 600, label: "Mont Korrath" },
    { type: "mountain", points: square(3000, 11000, 1500), elevation: 400, label: "Pic Noir" },
    { type: "urban", points: square(10000, 9500, 600), label: "Korrath (civil)" },
    { type: "road", points: poly([[0, 8000], [16000, 10000]]), label: "Route de crête" },
  ],
  weather: {
    windSpeed: 12,
    windDirection: 200,
    visibility: 6000,
    temperature: 4,
    condition: "fog",
    airDensity: 0.95,
  },
  rewardXp: 300,
  rewardResources: 120,
  rewardUnlocks: ["d30l"],
  narrativeOutro:
    "Le massif de Korrath se tait. Mais un message codé intercepté révèle que la Ligue Marchande de Velka fournit désormais des armes guidées à la Drakovie. Le commandement astorien vous promeut et vous confie une nouvelle pièce : le D-30L « Lance-Long ».",
  factionContext: "drakov",
  campaignChapter: 3,
};

const M4_URBAN: MissionSpec = {
  id: "m4_urban",
  title: "Siège de Marakov",
  codename: "CITÉ-CENDRE",
  biome: "urban",
  mapSize: 10000,
  batteryStart: { x: 1200, y: 5000 },
  brief:
    "La cité fictive de Marakov est assiégée par les forces Velka. Des tireurs et des mortiers occupent les quartiers est. Votre batterie doit appuyer l'assaut ami en neutralisant les nids de résistance — avec une précision chirurgicale. Tout dégât civil sera sanctionné par une chute de réputation et des pertes stratégiques.",
  objectives: [
    "Détruire le mortier Velka (sans toucher les civils)",
    "Détruire le poste de commandement Velka",
    "Préserver les 2 bâtiments civils marqués",
  ],
  constraints: {
    maxShells: 14,
    threatLevel: 30,
    civilianRisk: true,
  },
  targets: [
    { id: "u_mortar", name: "Mortier Velka", position: { x: 7500, y: 3000 }, radius: 20, hp: 50, maxHp: 50, priority: "primary", faction: "velka", type: "artillery", revealed: true },
    { id: "u_cmd", name: "PC Velka", position: { x: 8200, y: 6500 }, radius: 30, hp: 120, maxHp: 120, priority: "primary", faction: "velka", type: "structure", revealed: true },
    { id: "u_sniper", name: "Nid de tireur Velka", position: { x: 6500, y: 4500 }, radius: 15, hp: 40, maxHp: 40, priority: "secondary", faction: "velka", type: "infantry", revealed: false },
    { id: "u_civ1", name: "Hôpital de Marakov", position: { x: 6000, y: 5500 }, radius: 80, hp: 100, maxHp: 100, priority: "tertiary", faction: "astorie", type: "structure", revealed: true },
    { id: "u_civ2", name: "École de Marakov", position: { x: 7000, y: 7000 }, radius: 70, hp: 100, maxHp: 100, priority: "tertiary", faction: "astorie", type: "structure", revealed: true },
  ],
  terrain: [
    { type: "urban", points: square(5000, 5000, 3500), label: "Cité de Marakov" },
    { type: "road", points: poly([[0, 5000], [10000, 5000]]), label: "Avenue Centrale" },
    { type: "road", points: poly([[5000, 0], [5000, 10000]]), label: "Rue du Port" },
    { type: "water", points: square(9000, 0, 600), label: "Fleuve Slava" },
  ],
  weather: {
    windSpeed: 6,
    windDirection: 135,
    visibility: 5000,
    temperature: 8,
    condition: "rain",
    airDensity: 1.03,
  },
  rewardXp: 350,
  rewardResources: 150,
  rewardUnlocks: [],
  narrativeOutro:
    "Marakov est libérée. La population acclame la 7e Batterie. Mais derrière le rideau de fumée, un rapport du renseignement évoque une nouvelle faction opérant dans les plaines : les Forces Libres de Korr, autrefois alliées, semblent désormais hostiles...",
  factionContext: "velka",
  campaignChapter: 4,
};

const M5_DESERT: MissionSpec = {
  id: "m5_desert",
  title: "Sables d'Ashal",
  codename: "MIRAGE",
  biome: "desert",
  mapSize: 20000,
  batteryStart: { x: 2000, y: 18000 },
  brief:
    "Le désert d'Ashal recèle un dépôt stratégique Velka ravitaillant les forces ennemies. Une attaque frontale serait suicidaire : la chaleur, le sable, et les patrouilles rendent toute approche impossible. Votre batterie doit frapper à longue distance depuis la périphérie. La visibilité est excellente — mais cela vaut aussi pour l'ennemi.",
  objectives: [
    "Détruire le dépôt de munitions Velka",
    "Détruire au moins 2 patrouilles blindées",
    "Ne pas être détecté avant la 3e frappe",
  ],
  constraints: {
    maxShells: 25,
    threatLevel: 25,
    civilianRisk: false,
  },
  targets: [
    { id: "d_depot", name: "Dépôt Velka", position: { x: 16000, y: 3000 }, radius: 50, hp: 150, maxHp: 150, priority: "primary", faction: "velka", type: "structure", revealed: true },
    { id: "d_p1", name: "Patrouille Velka", position: { x: 12000, y: 8000 }, radius: 22, hp: 70, maxHp: 70, priority: "primary", faction: "velka", type: "vehicle", revealed: true, movable: true, speed: 120, movementPattern: "patrol" },
    { id: "d_p2", name: "Patrouille Velka", position: { x: 14000, y: 12000 }, radius: 22, hp: 70, maxHp: 70, priority: "secondary", faction: "velka", type: "vehicle", revealed: true, movable: true, speed: 120, movementPattern: "patrol" },
    { id: "d_p3", name: "Patrouille Velka", position: { x: 10000, y: 14000 }, radius: 22, hp: 70, maxHp: 70, priority: "secondary", faction: "velka", type: "vehicle", revealed: true, movable: true, speed: 120, movementPattern: "patrol" },
    { id: "d_radar", name: "Radar Velka", position: { x: 17000, y: 6000 }, radius: 25, hp: 60, maxHp: 60, priority: "secondary", faction: "velka", type: "structure", revealed: true },
  ],
  terrain: [
    { type: "hill", points: square(8000, 6000, 1200), elevation: 120, label: "Dune Rouge" },
    { type: "hill", points: square(15000, 11000, 800), elevation: 70, label: "Roc Noir" },
    { type: "road", points: poly([[0, 18000], [18000, 4000]]), label: "Piste Caravanière" },
  ],
  weather: {
    windSpeed: 10,
    windDirection: 45,
    visibility: 18000,
    temperature: 38,
    condition: "clear",
    airDensity: 0.9,
  },
  rewardXp: 400,
  rewardResources: 180,
  rewardUnlocks: [],
  narrativeOutro:
    "Le dépôt Velka brûle dans le ciel du désert. La Ligue Marchande vacille. Mais un ordre secret vous parvient du haut-commandement : les Forces Libres de Korr, jadis alliées d'Astorie, ont signé un pacte avec Velka. Trahison. Vous êtes envoyé pour mater la rébellion.",
  factionContext: "velka",
  campaignChapter: 5,
};

const M6_KORR: MissionSpec = {
  id: "m6_korr",
  title: "Rébellion de Korr",
  codename: "FER-ROUGE",
  biome: "forest",
  mapSize: 18000,
  batteryStart: { x: 1500, y: 1500 },
  brief:
    "Les Forces Libres de Korr ont retourné leur alliance. Leurs groupes de partisans se sont retranchés dans la forêt de Veldmark-Sud, harcelant nos convois. Trois camps rebelles doivent être réduits. Méfiance : ils utilisent des tactiques de guérilla, se déplacent vite, et la forêt masque leur position.",
  objectives: [
    "Détruire les 3 camps de partisans Korr",
    "Détruire le poste de commandement rebelle",
    "Éviter que les rebelles ne fuient (les neutraliser avant qu'ils ne sortent de la carte)",
  ],
  constraints: {
    maxShells: 30,
    threatLevel: 40,
    civilianRisk: false,
  },
  targets: [
    { id: "k_c1", name: "Camp partisan Nord", position: { x: 12000, y: 13000 }, radius: 40, hp: 90, maxHp: 90, priority: "primary", faction: "korr", type: "structure", revealed: true },
    { id: "k_c2", name: "Camp partisan Est", position: { x: 15000, y: 9000 }, radius: 40, hp: 90, maxHp: 90, priority: "primary", faction: "korr", type: "structure", revealed: true },
    { id: "k_c3", name: "Camp partisan Sud", position: { x: 11000, y: 5000 }, radius: 40, hp: 90, maxHp: 90, priority: "primary", faction: "korr", type: "structure", revealed: true },
    { id: "k_cmd", name: "PC rebelle Korr", position: { x: 14000, y: 15000 }, radius: 30, hp: 130, maxHp: 130, priority: "primary", faction: "korr", type: "structure", revealed: false },
    { id: "k_p1", name: "Partisans mobiles", position: { x: 8000, y: 10000 }, radius: 20, hp: 50, maxHp: 50, priority: "secondary", faction: "korr", type: "infantry", revealed: true, movable: true, speed: 150, movementPattern: "patrol" },
    { id: "k_p2", name: "Partisans mobiles", position: { x: 13000, y: 11000 }, radius: 20, hp: 50, maxHp: 50, priority: "secondary", faction: "korr", type: "infantry", revealed: true, movable: true, speed: 150, movementPattern: "patrol" },
  ],
  terrain: [
    { type: "forest", points: square(9000, 9000, 5500), label: "Forêt de Veldmark-Sud" },
    { type: "hill", points: square(14000, 14000, 800), elevation: 100, label: "Relief Korr" },
    { type: "water", points: square(3000, 11000, 1000), label: "Lac Bleune" },
    { type: "road", points: poly([[0, 5000], [18000, 11000]]), label: "Route Sud" },
  ],
  weather: {
    windSpeed: 7,
    windDirection: 180,
    visibility: 7000,
    temperature: 14,
    condition: "cloudy",
    airDensity: 1.0,
  },
  rewardXp: 500,
  rewardResources: 220,
  rewardUnlocks: ["k9v"],
  narrativeOutro:
    "La rébellion de Korr est matée. Les survivants se rallient à nouveau au drapeau astorien. En reconnaissance, le haut-commandement vous promeut et vous confie le K-9 Voiron « Tempest » — l'obusier automoteur le plus moderne de l'arsenal. Mais à l'est, la Confédération Drakovienne prépare son offensive finale...",
  factionContext: "korr",
  campaignChapter: 6,
};

const M7_FINAL: MissionSpec = {
  id: "m7_final",
  title: "L'Offensive Dernière",
  codename: "JUGEMENT",
  biome: "plain",
  mapSize: 24000,
  batteryStart: { x: 1500, y: 12000 },
  brief:
    "C'est l'heure de vérité. La Confédération Drakovienne a massé son armée sur la plaine de Livrie pour une dernière offensive. Quatre batteries d'artillerie ennemie, des chars, un train blindé, et le PC du Maréchal Dragovitch lui-même. Votre batterie d'élite est la clé de la victoire. Détruisez le commandement ennemi — et la guerre s'achèvera.",
  objectives: [
    "Détruire le PC du Maréchal Dragovitch",
    "Détruire au moins 3 des 4 batteries Drakoviennes",
    "Neutraliser le train blindé",
    "Survivre (menace < 90 à la fin)",
  ],
  constraints: {
    maxShells: 40,
    threatLevel: 50,
    civilianRisk: false,
  },
  targets: [
    { id: "f_drag", name: "PC Maréchal Dragovitch", position: { x: 20000, y: 12000 }, radius: 45, hp: 250, maxHp: 250, priority: "primary", faction: "drakov", type: "structure", revealed: true },
    { id: "f_b1", name: "Batterie Drak I", position: { x: 17000, y: 8000 }, radius: 30, hp: 110, maxHp: 110, priority: "primary", faction: "drakov", type: "artillery", revealed: true },
    { id: "f_b2", name: "Batterie Drak II", position: { x: 18000, y: 15000 }, radius: 30, hp: 110, maxHp: 110, priority: "primary", faction: "drakov", type: "artillery", revealed: true },
    { id: "f_b3", name: "Batterie Drak III", position: { x: 22000, y: 9000 }, radius: 30, hp: 110, maxHp: 110, priority: "primary", faction: "drakov", type: "artillery", revealed: false },
    { id: "f_b4", name: "Batterie Drak IV", position: { x: 21000, y: 16000 }, radius: 30, hp: 110, maxHp: 110, priority: "primary", faction: "drakov", type: "artillery", revealed: false },
    { id: "f_train", name: "Train blindé Drak", position: { x: 12000, y: 14000 }, radius: 50, hp: 200, maxHp: 200, priority: "primary", faction: "drakov", type: "vehicle", revealed: true, movable: true, speed: 200, movementPattern: "advance" },
    { id: "f_t1", name: "Char lourd Drak T-90", position: { x: 14000, y: 10000 }, radius: 28, hp: 100, maxHp: 100, priority: "secondary", faction: "drakov", type: "vehicle", revealed: true, movable: true, speed: 60, movementPattern: "advance" },
    { id: "f_t2", name: "Char lourd Drak T-90", position: { x: 15000, y: 13000 }, radius: 28, hp: 100, maxHp: 100, priority: "secondary", faction: "drakov", type: "vehicle", revealed: true, movable: true, speed: 60, movementPattern: "advance" },
  ],
  terrain: [
    { type: "hill", points: square(18000, 12000, 1500), elevation: 80, label: "Plateau Central" },
    { type: "hill", points: square(8000, 6000, 1000), elevation: 100, label: "Colline 601" },
    { type: "forest", points: square(11000, 9000, 1200), label: "Bois Sanglant" },
    { type: "road", points: poly([[0, 12000], [22000, 12000]]), label: "Grande Route Est" },
    { type: "road", points: poly([[14000, 0], [14000, 24000]]), label: "Axe Nord-Sud" },
  ],
  weather: {
    windSpeed: 5,
    windDirection: 90,
    visibility: 12000,
    temperature: 16,
    condition: "cloudy",
    airDensity: 1.0,
  },
  rewardXp: 800,
  rewardResources: 400,
  rewardUnlocks: [],
  narrativeOutro:
    "Le Maréchal Dragovitch est mort, son PC en flammes. La Confédération Drakovienne signe l'armistice le lendemain. La guerre d'Atalan s'achève. La 7e Batterie d'Élite entre dans la légende. Sur la place de la République fédérée d'Astorie, le général Veckmann vous remet l'Épée de Commandement. Vous êtes désormais General de Brigade.",
  factionContext: "drakov",
  campaignChapter: 7,
};

export const MISSIONS: Record<string, MissionSpec> = {
  m1_training: M1_TRAINING,
  m2_border: M2_BORDER,
  m3_counter: M3_COUNTER_BATTERY,
  m4_urban: M4_URBAN,
  m5_desert: M5_DESERT,
  m6_korr: M6_KORR,
  m7_final: M7_FINAL,
};

// ====================================================================
// CAMPAGNE — arbre narratif
// ====================================================================
export const CAMPAIGN_NODES: CampaignNode[] = [
  {
    id: "n1",
    missionId: "m1_training",
    title: M1_TRAINING.title,
    chapter: 1,
    chapterTitle: "Chapitre I — L'École du Feu",
    brief: "Champ de tir de Livrie. Premier déploiement.",
    faction: "astorie",
    unlockedBy: [],
    unlocks: ["n2"],
    isMain: true,
  },
  {
    id: "n2",
    missionId: "m2_border",
    title: M2_BORDER.title,
    chapter: 2,
    chapterTitle: "Chapitre II — L'Invasion",
    brief: "Forêt de Veldmark. La frontière est tombe.",
    faction: "drakov",
    unlockedBy: ["n1"],
    unlocks: ["n3"],
    isMain: true,
  },
  {
    id: "n3",
    missionId: "m3_counter",
    title: M3_COUNTER_BATTERY.title,
    chapter: 3,
    chapterTitle: "Chapitre III — Les Montagnes",
    brief: "Massif de Korrath. Contre-batterie en haute altitude.",
    faction: "drakov",
    unlockedBy: ["n2"],
    unlocks: ["n4"],
    isMain: true,
  },
  {
    id: "n4",
    missionId: "m4_urban",
    title: M4_URBAN.title,
    chapter: 4,
    chapterTitle: "Chapitre IV — La Cité",
    brief: "Cité de Marakov. Siège urbain, précision requise.",
    faction: "velka",
    unlockedBy: ["n3"],
    unlocks: ["n5"],
    isMain: true,
  },
  {
    id: "n5",
    missionId: "m5_desert",
    title: M5_DESERT.title,
    chapter: 5,
    chapterTitle: "Chapitre V — Le Désert",
    brief: "Désert d'Ashal. Frappe longue portée en milieu hostile.",
    faction: "velka",
    unlockedBy: ["n4"],
    unlocks: ["n6"],
    isMain: true,
  },
  {
    id: "n6",
    missionId: "m6_korr",
    title: M6_KORR.title,
    chapter: 6,
    chapterTitle: "Chapitre VI — La Trahison",
    brief: "Forêt de Veldmark-Sud. Rébellion de Korr à mater.",
    faction: "korr",
    unlockedBy: ["n5"],
    unlocks: ["n7"],
    isMain: true,
  },
  {
    id: "n7",
    missionId: "m7_final",
    title: M7_FINAL.title,
    chapter: 7,
    chapterTitle: "Chapitre VII — Jugement",
    brief: "Plaine de Livrie. Offensive finale Drakovienne.",
    faction: "drakov",
    unlockedBy: ["n6"],
    unlocks: [],
    isMain: true,
  },
];

export function getNode(id: string): CampaignNode | undefined {
  return CAMPAIGN_NODES.find((n) => n.id === id);
}

export function getMission(id: string): MissionSpec | undefined {
  return MISSIONS[id];
}

/**
 * Événements aléatoires narratifs entre missions.
 */
export const RANDOM_EVENTS: { id: string; chance: number; text: string; reputationDelta?: Record<string, number>; resourceDelta?: number }[] = [
  {
    id: "recon_astorie",
    chance: 0.25,
    text: "Un agent de renseignement astorien vous transmet les coordonnées d'une cible prioritaire. +10 réputation Astorie.",
    reputationDelta: { astorie: 10 },
  },
  {
    id: "merchants_velka",
    chance: 0.15,
    text: "Des marchands Velka vous proposent un marché gris : munitions contre renseignements. +30 ressources, -5 réputation Astorie.",
    reputationDelta: { astorie: -5 },
    resourceDelta: 30,
  },
  {
    id: "partisans_korr",
    chance: 0.10,
    text: "Des partisans Korr vous tendent une embuscade. La batterie est endommagée. -50 ressources.",
    resourceDelta: -50,
  },
  {
    id: "diplomat",
    chance: 0.10,
    text: "Un diplomate Velka vous offre un obusier en gage de paix future. +1 obusier de réserve.",
    resourceDelta: 20,
  },
];
