const fs = require('fs');

// Extracted from map.js logically
function getSeaLaneWaypoints(regionA, regionB) {
    const key = [regionA, regionB].sort().join('|');
    const mapping = {
        // INDIA ↔ EAST ASIA
        'east_china_sea|india_east': 9,
        'india_east|korea': 10,
        'india_east|japan': 9,
        'india_east|malacca': 3,
        'india_west|east_china_sea': 9,
        'india_west|korea': 10,
        'india_west|japan': 9,
        'india_west|malacca': 4,
        'india_east|india_west': 2,

        // MALACCA ↔ EAST ASIA
        'east_china_sea|malacca': 5,
        'korea|malacca': 6,
        'japan|malacca': 5,

        // EAST ASIA internal
        'east_china_sea|korea': 2,
        'east_china_sea|japan': 5,
        'japan|korea': 5,

        // PERSIAN GULF ↔ ASIA
        'india_east|persian_gulf': 6,
        'india_west|persian_gulf': 3,
        'malacca|persian_gulf': 8,
        'east_china_sea|persian_gulf': 12,
        'japan|persian_gulf': 14,
        'korea|persian_gulf': 15,

        // EUROPE ↔ ASIA (Via Suez)
        'india_east|north_europe': 16,
        'india_west|north_europe': 16,
        'malacca|north_europe': 17,
        'east_china_sea|north_europe': 19,
        'japan|north_europe': 19,
        'korea|north_europe': 20,
        'north_europe|persian_gulf': 15,

        // EUROPE ↔ AFRICA
        'north_europe|south_africa_west': 6,
        'north_europe|south_africa_east': 8,

        // ASIA ↔ AFRICA
        'india_west|south_africa_east': 4,
        'india_east|south_africa_east': 5,
        'india_west|south_africa_west': 6,
        'india_east|south_africa_west': 7,
        'malacca|south_africa_east': 7,
        'malacca|south_africa_west': 9,
        'persian_gulf|south_africa_east': 6,
        'persian_gulf|south_africa_west': 8,
        'south_africa_east|south_africa_west': 2,

        // AMERICAS ↔ EUROPE
        'north_europe|us_gulf': 8,
        'north_europe|south_america_atlantic': 8,
        'north_europe|us_pacific': 10,

        // AMERICAS ↔ ASIA (Via Pacific)
        'east_china_sea|us_pacific': 6,
        'japan|us_pacific': 3,
        'korea|us_pacific': 4,
        'malacca|us_pacific': 8,
        'india_west|us_pacific': 12,
        'india_east|us_pacific': 11,
        'persian_gulf|us_pacific': 17,

        // AMERICAS ↔ ASIA (via Atlantic/Suez/Indian for US Gulf)
        'east_china_sea|us_gulf': 24,
        'india_east|us_gulf': 15,
        'india_west|us_gulf': 12,
        'malacca|us_gulf': 17,
        'persian_gulf|us_gulf': 13,

        // SOUTH AMERICA ↔ US
        'south_america_atlantic|us_gulf': 7,
        'south_america_atlantic|us_pacific': 9,
        'south_america_atlantic|south_africa_west': 5,
        'south_america_atlantic|south_africa_east': 7,

        // SOUTH AMERICA ↔ ASIA (New Fixes)
        'east_china_sea|south_america_atlantic': 19,
        'india_east|south_america_atlantic': 11,
        'india_west|south_america_atlantic': 11,
        'malacca|south_america_atlantic': 15,
        'japan|south_america_atlantic': 19, // inferred
        'korea|south_america_atlantic': 20, // inferred

        // AUSTRALIA
        'australia|malacca': 3,
        'australia|east_china_sea': 5,
        'australia|japan': 5,
        'australia|korea': 6,
        'australia|india_east': 7,
        'australia|india_west': 7,
        'australia|persian_gulf': 12,
        'australia|north_europe': 22,
        'australia|south_africa_east': 3,
        'australia|south_africa_west': 3,
        'australia|us_pacific': 4,
        // australia|us_gulf missing?
        // australia|south_america_atlantic missing?
    };

    if (mapping[key]) return mapping[key];

    // Check default fallback for same region
    // In map.js, same region falls back to empty [] which uses Great Circle.
    // This is OK if physically adjacent, but potentially risky if land in between.
    // e.g. japan|korea was fixed.

    // If different regions and no mapping -> MISSING
    if (regionA !== regionB) return 0;

    return -1; // Same region, usually 0 but effectively simulated as found/skipping check
}

// Ports and their regions
const PORTS = [
    { id: 'singapore', region: 'malacca' },
    { id: 'rotterdam', region: 'north_europe' },
    { id: 'chennai', region: 'india_east' },
    { id: 'shanghai', region: 'east_china_sea' },
    { id: 'houston', region: 'us_gulf' },
    { id: 'losangeles', region: 'us_pacific' },
    { id: 'santos', region: 'south_america_atlantic' },
    { id: 'mumbai', region: 'india_west' },
    { id: 'dubai', region: 'persian_gulf' },
    { id: 'hamburg', region: 'north_europe' },
    { id: 'busan', region: 'korea' },
    { id: 'yokohama', region: 'japan' },
    { id: 'capetown', region: 'south_africa_west' },
    { id: 'durban', region: 'south_africa_east' },
    { id: 'sydney', region: 'australia' }
];

// Audit
console.log('--- ROUTE AUDIT ---');
let missing = 0;
let checked = 0;

for (let i = 0; i < PORTS.length; i++) {
    for (let j = i + 1; j < PORTS.length; j++) {
        const p1 = PORTS[i];
        const p2 = PORTS[j];

        let count = getSeaLaneWaypoints(p1.region, p2.region);

        if (p1.region !== p2.region && count === 0) {
            console.log(`❌ MISSING PATTERN: ${p1.region} <-> ${p2.region} (e.g. ${p1.id} -> ${p2.id})`);
            missing++;
        }
        checked++;
    }
}

// Check duplicates to avoid log spam
// ... simpler loop above is fine, just logs per port pair.
// We can use a set to track unique region pairs to minimize output.

console.log(`\nVerified ${checked} routes.`);
if (missing > 0) console.log(`Found ${missing} missing route definitions.`);
