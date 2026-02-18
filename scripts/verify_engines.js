const fs = require('fs');
const path = require('path');

// 1. Read source files
const jsDir = path.join(__dirname, '../js');
const sources = ['data.js', 'scoring.js', 'treatment.js', 'credits.js'];

let bundle = '';
sources.forEach(file => {
    console.log(`Loading ${file}...`);
    bundle += fs.readFileSync(path.join(jsDir, file), 'utf8') + '\n';
});

// 2. Append Test Logic
bundle += `
// ---- TEST SUITE ----
(function() {
    console.log('\\n--- Starting Engine Verification ---');
    let passed = 0;
    let failed = 0;

    function assert(condition, desc) {
        if (condition) {
            console.log('✅ PASS:', desc);
            passed++;
        } else {
            console.error('❌ FAIL:', desc);
            failed++;
        }
    }

    // A. Data Integrity
    console.log('\\n[A] Data Integrity');
    assert(PORTS.length === 15, 'Should have 15 ports');
    assert(ORGANISMS.length >= 10, 'Should have 10+ organisms');
    assert(DATA_METADATA.dataSources.oceanographic.name.includes('WOA23'), 'Metadata should cite WOA23');

    // B. Scoring Engine (Chennai -> Shanghai)
    console.log('\\n[B] Scoring Engine: Chennai -> Shanghai');
    const chennai = PORTS.find(p => p.id === 'chennai');
    const shanghai = PORTS.find(p => p.id === 'shanghai');
    assert(chennai && shanghai, 'Ports found');

    const score = ScoringEngine.dischargeRisk(chennai, shanghai, { uvDose: 100, tro: 0.1, organismCount: 5 });
    console.log('   Risk Score:', score.total);
    console.log('   Breakdown:', JSON.stringify(score.breakdown));
    assert(typeof score.total === 'number', 'Score is a number');
    assert(score.total >= 0 && score.total <= 100, 'Score 0-100');
    // Expect Shanghai (East China Sea) to have sensitivity
    assert(score.breakdown.ecological > 0, 'Ecological risk component active');

    // C. Treatment Engine
    console.log('\\n[C] Treatment Engine');
    const treatment = TreatmentEngine.recommend(['vibrio', 'pseudonitzschia'], chennai, shanghai);
    console.log('   Recommended:', treatment.method.name);
    console.log('   Reason:', treatment.reason);
    assert(treatment.method.name.length > 0, 'Recommendation made');
    assert(treatment.organisms.length === 2, 'Survival calculated for 2 organisms');
    
    // D. Eco Credits
    console.log('\\n[D] Eco Credits');
    CreditsEngine.reset();
    const credits = CreditsEngine.awardForAnalysis(score.total, shanghai, 'hybrid');
    console.log('   Credits Earned:', credits.voyageCredits);
    console.log('   CO2 Offset:', credits.co2Offset);
    assert(credits.voyageCredits > 0, 'Credits awarded');
    
    // E. Realistic Routing Logic (Map.js is UI, but we can check data waypoints)
    console.log('\\n[E] Routing Data');
    // Using a simple check if ROUTE_WAYPOINTS are defined (they are in data.js or map.js? Wait, they are in map.js!)
    // Ah, map.js was NOT included in loop. But data.js had waypoints in previous version, 
    // but I moved them to map.js in the rewrite. 
    // So we skip Map verification here as it depends on Leaflet.
    console.log('   Skipping Map.js (UI dependency). Visual verification required.');

    console.log('\\n--- Summary ---');
    console.log(\`Passed: \${passed}, Failed: \${failed}\`);
    if (failed > 0) process.exit(1);
})();
`;

// 3. Write Bundle
const testFile = path.join(__dirname, 'suite.js');
fs.writeFileSync(testFile, bundle);
console.log('Test suite generated at', testFile);

// 4. Run it is handled by the caller (or we can spawn here, but caller is better)
