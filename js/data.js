// ============================================================
// OceanGuard – Global Port, Organism & Treatment Data
// ============================================================

const PORTS = [
  {
    id: 'singapore', name: 'Port of Singapore', country: 'Singapore',
    lat: 1.29, lng: 103.85, continent: 'asia',
    salinity: 31, temperature: 28, nutrientLoad: 3, turbidity: 8,
    invasiveIncidents: 12, coralPresence: true,
    ecoSensitivity: 75, eutrophicationZone: false,
    nativeVulnerability: 'high', environmentalIndex: 72,
    commonOrganisms: ['vibrio', 'gymnodinium', 'undaria', 'mnemiopsis'],
    description: 'Busiest transshipment hub. Tropical waters with high coral sensitivity.'
  },
  {
    id: 'rotterdam', name: 'Port of Rotterdam', country: 'Netherlands',
    lat: 51.92, lng: 4.48, continent: 'europe',
    salinity: 28, temperature: 12, nutrientLoad: 2, turbidity: 12,
    invasiveIncidents: 8, coralPresence: false,
    ecoSensitivity: 55, eutrophicationZone: true,
    nativeVulnerability: 'medium', environmentalIndex: 60,
    commonOrganisms: ['dreissena', 'carcinus', 'enterococcus', 'asterias'],
    description: 'Europe\'s largest port. North Sea estuary with eutrophication risk.'
  },
  {
    id: 'chennai', name: 'Port of Chennai', country: 'India',
    lat: 13.08, lng: 80.27, continent: 'asia',
    salinity: 33, temperature: 29, nutrientLoad: 3, turbidity: 15,
    invasiveIncidents: 6, coralPresence: true,
    ecoSensitivity: 70, eutrophicationZone: true,
    nativeVulnerability: 'high', environmentalIndex: 58,
    commonOrganisms: ['vibrio', 'pseudonitzschia', 'gymnodinium', 'enterococcus'],
    description: 'Major Indian east-coast port. Bay of Bengal with coral ecosystems nearby.'
  },
  {
    id: 'shanghai', name: 'Port of Shanghai', country: 'China',
    lat: 31.23, lng: 121.47, continent: 'asia',
    salinity: 20, temperature: 18, nutrientLoad: 3, turbidity: 25,
    invasiveIncidents: 15, coralPresence: false,
    ecoSensitivity: 60, eutrophicationZone: true,
    nativeVulnerability: 'medium', environmentalIndex: 48,
    commonOrganisms: ['alexandrium', 'vibrio', 'mnemiopsis', 'enterococcus'],
    description: 'World\'s busiest cargo port. Yangtze estuary – high turbidity, frequent blooms.'
  },
  {
    id: 'houston', name: 'Port of Houston', country: 'USA',
    lat: 29.76, lng: -95.36, continent: 'americas',
    salinity: 27, temperature: 24, nutrientLoad: 2, turbidity: 10,
    invasiveIncidents: 10, coralPresence: false,
    ecoSensitivity: 50, eutrophicationZone: true,
    nativeVulnerability: 'medium', environmentalIndex: 55,
    commonOrganisms: ['vibrio', 'pseudonitzschia', 'enterococcus', 'alexandrium'],
    description: 'Major Gulf of Mexico port. Persistent hypoxic dead-zone influence.'
  },
  {
    id: 'santos', name: 'Port of Santos', country: 'Brazil',
    lat: -23.96, lng: -46.33, continent: 'americas',
    salinity: 34, temperature: 23, nutrientLoad: 2, turbidity: 9,
    invasiveIncidents: 5, coralPresence: false,
    ecoSensitivity: 45, eutrophicationZone: false,
    nativeVulnerability: 'low', environmentalIndex: 62,
    commonOrganisms: ['enterococcus', 'vibrio', 'gymnodinium'],
    description: 'Latin America\'s largest port. South Atlantic with moderate sensitivity.'
  },
  {
    id: 'busan', name: 'Port of Busan', country: 'South Korea',
    lat: 35.18, lng: 129.08, continent: 'asia',
    salinity: 33, temperature: 16, nutrientLoad: 2, turbidity: 7,
    invasiveIncidents: 9, coralPresence: false,
    ecoSensitivity: 55, eutrophicationZone: false,
    nativeVulnerability: 'medium', environmentalIndex: 64,
    commonOrganisms: ['asterias', 'undaria', 'alexandrium', 'mnemiopsis'],
    description: 'Korea Strait gateway. Temperate waters with invasive algae history.'
  },
  {
    id: 'dubai', name: 'Port of Jebel Ali', country: 'UAE',
    lat: 25.01, lng: 55.06, continent: 'asia',
    salinity: 40, temperature: 30, nutrientLoad: 1, turbidity: 5,
    invasiveIncidents: 4, coralPresence: true,
    ecoSensitivity: 65, eutrophicationZone: false,
    nativeVulnerability: 'medium', environmentalIndex: 68,
    commonOrganisms: ['vibrio', 'enterococcus', 'gymnodinium'],
    description: 'Middle East hub. Hyper-saline Persian Gulf with fragile coral habitat.'
  },
  {
    id: 'capetown', name: 'Port of Cape Town', country: 'South Africa',
    lat: -33.92, lng: 18.42, continent: 'africa',
    salinity: 35, temperature: 15, nutrientLoad: 2, turbidity: 6,
    invasiveIncidents: 7, coralPresence: false,
    ecoSensitivity: 60, eutrophicationZone: false,
    nativeVulnerability: 'medium', environmentalIndex: 66,
    commonOrganisms: ['carcinus', 'asterias', 'undaria', 'enterococcus'],
    description: 'Atlantic-Indian Ocean junction. Unique Benguela upwelling ecosystem.'
  },
  {
    id: 'sydney', name: 'Port of Sydney', country: 'Australia',
    lat: -33.87, lng: 151.21, continent: 'oceania',
    salinity: 35, temperature: 20, nutrientLoad: 1, turbidity: 4,
    invasiveIncidents: 11, coralPresence: true,
    ecoSensitivity: 80, eutrophicationZone: false,
    nativeVulnerability: 'high', environmentalIndex: 78,
    commonOrganisms: ['asterias', 'undaria', 'carcinus', 'mnemiopsis'],
    description: 'Strict biosecurity. Proximity to Great Barrier Reef makes sensitivity extreme.'
  },
  {
    id: 'mumbai', name: 'Port of Mumbai', country: 'India',
    lat: 19.08, lng: 72.88, continent: 'asia',
    salinity: 35, temperature: 28, nutrientLoad: 3, turbidity: 20,
    invasiveIncidents: 8, coralPresence: false,
    ecoSensitivity: 55, eutrophicationZone: true,
    nativeVulnerability: 'medium', environmentalIndex: 50,
    commonOrganisms: ['vibrio', 'pseudonitzschia', 'enterococcus', 'gymnodinium'],
    description: 'India\'s busiest port. Arabian Sea, high nutrient runoff and turbidity.'
  },
  {
    id: 'yokohama', name: 'Port of Yokohama', country: 'Japan',
    lat: 35.44, lng: 139.64, continent: 'asia',
    salinity: 33, temperature: 17, nutrientLoad: 2, turbidity: 6,
    invasiveIncidents: 7, coralPresence: false,
    ecoSensitivity: 50, eutrophicationZone: false,
    nativeVulnerability: 'low', environmentalIndex: 70,
    commonOrganisms: ['alexandrium', 'undaria', 'asterias', 'mnemiopsis'],
    description: 'Tokyo Bay port. Well-monitored but historically impacted by red tides.'
  },
  {
    id: 'hamburg', name: 'Port of Hamburg', country: 'Germany',
    lat: 53.55, lng: 9.99, continent: 'europe',
    salinity: 15, temperature: 10, nutrientLoad: 2, turbidity: 15,
    invasiveIncidents: 12, coralPresence: false,
    ecoSensitivity: 65, eutrophicationZone: true,
    nativeVulnerability: 'medium', environmentalIndex: 58,
    commonOrganisms: ['dreissena', 'carcinus', 'mnemiopsis', 'enterococcus'],
    description: 'Elbe estuary, Baltic Sea influence. Major invasive entry corridor for Europe.'
  },
  {
    id: 'durban', name: 'Port of Durban', country: 'South Africa',
    lat: -29.86, lng: 31.03, continent: 'africa',
    salinity: 35, temperature: 22, nutrientLoad: 2, turbidity: 8,
    invasiveIncidents: 6, coralPresence: true,
    ecoSensitivity: 70, eutrophicationZone: false,
    nativeVulnerability: 'high', environmentalIndex: 64,
    commonOrganisms: ['asterias', 'carcinus', 'vibrio', 'enterococcus'],
    description: 'Indian Ocean port with coral reefs and warm-water biodiversity hotspot.'
  },
  {
    id: 'losangeles', name: 'Port of Los Angeles', country: 'USA',
    lat: 33.73, lng: -118.26, continent: 'americas',
    salinity: 33, temperature: 17, nutrientLoad: 1, turbidity: 5,
    invasiveIncidents: 9, coralPresence: false,
    ecoSensitivity: 55, eutrophicationZone: false,
    nativeVulnerability: 'medium', environmentalIndex: 65,
    commonOrganisms: ['pseudonitzschia', 'undaria', 'enterococcus', 'carcinus'],
    description: 'Busiest US port. Pacific coast with kelp-forest sensitivity.'
  }
];

// ---------------------------------------------------------------
// Microrganism database – 10 common ballast water species
// ---------------------------------------------------------------
const ORGANISMS = [
  {
    id: 'vibrio', name: 'Vibrio cholerae',
    type: 'Bacteria', riskLevel: 'critical',
    icon: '🦠',
    salinityRange: [5, 30], tempRange: [15, 35],
    treatmentEffectiveness: { uv: 85, chemical: 90, hybrid: 95 },
    description: 'Pathogenic bacterium causing cholera. Thrives in warm brackish waters.',
    impactNote: 'Direct human health risk through shellfish contamination.'
  },
  {
    id: 'alexandrium', name: 'Alexandrium tamarense',
    type: 'Dinoflagellate', riskLevel: 'high',
    icon: '🔴',
    salinityRange: [10, 35], tempRange: [5, 20],
    treatmentEffectiveness: { uv: 70, chemical: 80, hybrid: 90 },
    description: 'Toxic dinoflagellate producing paralytic shellfish poisoning (PSP) toxins.',
    impactNote: 'Causes red tides and renders shellfish deadly for human consumption.'
  },
  {
    id: 'dreissena', name: 'Dreissena polymorpha',
    type: 'Bivalve (Zebra Mussel)', riskLevel: 'high',
    icon: '🐚',
    salinityRange: [0, 12], tempRange: [0, 30],
    treatmentEffectiveness: { uv: 40, chemical: 60, hybrid: 75 },
    description: 'Prolific invasive bivalve that clogs infrastructure and displaces natives.',
    impactNote: '$1B+ annual damage in Great Lakes alone. Extremely hard to eradicate.'
  },
  {
    id: 'mnemiopsis', name: 'Mnemiopsis leidyi',
    type: 'Ctenophore (Comb Jelly)', riskLevel: 'high',
    icon: '🪼',
    salinityRange: [2, 38], tempRange: [2, 32],
    treatmentEffectiveness: { uv: 80, chemical: 75, hybrid: 92 },
    description: 'Invasive comb jelly decimating fish stocks in the Black & Caspian Seas.',
    impactNote: 'Collapses planktonic food webs, destroying commercial fisheries.'
  },
  {
    id: 'asterias', name: 'Asterias amurensis',
    type: 'Echinoderm (Seastar)', riskLevel: 'high',
    icon: '⭐',
    salinityRange: [25, 35], tempRange: [5, 22],
    treatmentEffectiveness: { uv: 55, chemical: 70, hybrid: 85 },
    description: 'Northern Pacific seastar – voracious predator of native shellfish beds.',
    impactNote: 'Devastated Tasmanian scallop & mussel farms after ballast introduction.'
  },
  {
    id: 'carcinus', name: 'Carcinus maenas',
    type: 'Crustacean (Green Crab)', riskLevel: 'medium',
    icon: '🦀',
    salinityRange: [4, 35], tempRange: [0, 30],
    treatmentEffectiveness: { uv: 45, chemical: 65, hybrid: 80 },
    description: 'European green crab — one of the world\'s worst marine invaders.',
    impactNote: 'Destroys eelgrass beds and outcompetes native crabs and shellfish.'
  },
  {
    id: 'undaria', name: 'Undaria pinnatifida',
    type: 'Macroalgae (Asian Kelp)', riskLevel: 'medium',
    icon: '🌿',
    salinityRange: [25, 35], tempRange: [5, 20],
    treatmentEffectiveness: { uv: 60, chemical: 75, hybrid: 88 },
    description: 'Invasive kelp that smothers native algae and alters reef structures.',
    impactNote: 'Listed among 100 worst invasive species globally (IUCN).'
  },
  {
    id: 'pseudonitzschia', name: 'Pseudo-nitzschia spp.',
    type: 'Diatom', riskLevel: 'high',
    icon: '🔬',
    salinityRange: [25, 35], tempRange: [8, 25],
    treatmentEffectiveness: { uv: 75, chemical: 80, hybrid: 90 },
    description: 'Toxic diatom producing domoic acid – causes amnesic shellfish poisoning.',
    impactNote: 'Severe neurotoxin. Kills sea lions, contaminates fisheries.'
  },
  {
    id: 'gymnodinium', name: 'Gymnodinium catenatum',
    type: 'Dinoflagellate', riskLevel: 'high',
    icon: '🟠',
    salinityRange: [15, 35], tempRange: [10, 25],
    treatmentEffectiveness: { uv: 70, chemical: 78, hybrid: 88 },
    description: 'Chain-forming dinoflagellate with PSP toxin production.',
    impactNote: 'Linked to shellfish harvesting bans across multiple continents.'
  },
  {
    id: 'enterococcus', name: 'Enterococcus faecalis',
    type: 'Bacteria (Indicator)', riskLevel: 'medium',
    icon: '🧫',
    salinityRange: [0, 35], tempRange: [10, 42],
    treatmentEffectiveness: { uv: 90, chemical: 92, hybrid: 98 },
    description: 'Faecal indicator bacterium – signals broader pathogenic contamination.',
    impactNote: 'High counts close beaches and shellfish harvesting areas.'
  }
];

// ---------------------------------------------------------------
// Treatment methods
// ---------------------------------------------------------------
const TREATMENT_METHODS = [
  {
    id: 'uv', name: 'UV Irradiation',
    icon: '☀️',
    description: 'Ultraviolet light damages DNA/RNA of organisms, preventing reproduction.',
    strengths: 'No chemical residuals (TRO = 0). Low operational cost. Fast processing.',
    limitations: 'Effectiveness drops sharply in turbid water (>15 NTU). Limited vs. hard-shelled organisms.',
    estimatedTRO: 0, costLevel: 'Low',
    bestFor: ['vibrio', 'enterococcus', 'mnemiopsis']
  },
  {
    id: 'chemical', name: 'Electrochlorination',
    icon: '⚗️',
    description: 'Generates sodium hypochlorite from seawater to neutralize organisms.',
    strengths: 'Broad-spectrum kill. Effective regardless of turbidity.',
    limitations: 'Produces TRO residuals (0.05–0.2 mg/L). Requires neutralization step. DBP risk.',
    estimatedTRO: 0.12, costLevel: 'Medium',
    bestFor: ['alexandrium', 'pseudonitzschia', 'gymnodinium']
  },
  {
    id: 'hybrid', name: 'Hybrid (UV + Electrochlorination)',
    icon: '🔄',
    description: 'Combined UV pre-treatment with low-dose chemical polishing for maximum kill.',
    strengths: 'Highest effectiveness across all organism types. Minimal residual.',
    limitations: 'Higher system complexity and cost. Requires both UV and chemical modules.',
    estimatedTRO: 0.04, costLevel: 'High',
    bestFor: ['dreissena', 'carcinus', 'asterias', 'undaria']
  }
];

// ---------------------------------------------------------------
// Route waypoints for realistic sea-lane rendering
// ---------------------------------------------------------------
const ROUTE_WAYPOINTS = {
  suezNorth: [31.27, 32.34],
  suezSouth: [29.95, 32.57],
  malacca:   [1.40, 103.80],
  gibraltar:  [35.98, -5.50],
  aden:       [12.80, 45.00],
  panama:     [9.10, -79.70],
  goodHope:   [-34.36, 18.49],
  hormuz:     [26.60, 56.25],
  bpilaresS:  [-52.50, -68.50]  // Strait of Magellan
};

// ---------------------------------------------------------------
// Fleet data for leaderboard demo
// ---------------------------------------------------------------
const FLEET_DATA = [
  { id: 'MV-AURORA',     name: 'MV Aurora',        credits: 510, voyages: 24, avgRisk: 28, flag: '🇳🇴' },
  { id: 'MV-OCEANIC',    name: 'MV Oceanic Star',  credits: 420, voyages: 20, avgRisk: 35, flag: '🇵🇦' },
  { id: 'MV-TRITON',     name: 'MV Triton',        credits: 385, voyages: 18, avgRisk: 42, flag: '🇱🇷' },
  { id: 'MV-CORAL',      name: 'MV Coral Dream',   credits: 340, voyages: 22, avgRisk: 45, flag: '🇲🇭' },
  { id: 'MV-MERIDIAN',   name: 'MV Meridian',      credits: 295, voyages: 16, avgRisk: 52, flag: '🇸🇬' },
  { id: 'MV-PACIFICA',   name: 'MV Pacifica',      credits: 260, voyages: 19, avgRisk: 58, flag: '🇬🇷' },
  { id: 'MV-HERITAGE',   name: 'MV Heritage',      credits: 210, voyages: 14, avgRisk: 61, flag: '🇮🇳' },
  { id: 'MV-NEPTUNE',    name: 'MV Neptune Tide',  credits: 180, voyages: 12, avgRisk: 67, flag: '🇨🇳' }
];

// ---------------------------------------------------------------
// Rating thresholds
// ---------------------------------------------------------------
const ECO_THRESHOLDS = {
  safe:     { max: 30, label: 'SAFE TO DISCHARGE',    color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  moderate: { max: 60, label: 'TREATMENT RECOMMENDED', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  high:     { max: 100, label: 'DO NOT DISCHARGE',     color: '#ef4444', bg: 'rgba(239,68,68,0.12)' }
};

function getThreshold(score) {
  if (score <= ECO_THRESHOLDS.safe.max) return ECO_THRESHOLDS.safe;
  if (score <= ECO_THRESHOLDS.moderate.max) return ECO_THRESHOLDS.moderate;
  return ECO_THRESHOLDS.high;
}

function getPortById(id) {
  return PORTS.find(p => p.id === id);
}

function getOrganismById(id) {
  return ORGANISMS.find(o => o.id === id);
}
