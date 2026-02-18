// ============================================================
// OceanGuard – Treatment Recommendation Engine
// ============================================================

const TreatmentEngine = (() => {

    // Analyse detected organisms and their survival at Port B
    function analyzeOrganisms(selectedIds, portA, portB) {
        return selectedIds.map(id => {
            const org = getOrganismById(id);
            if (!org) return null;
            const survival = ScoringEngine.organismSurvival(org, portA, portB);
            return { ...org, survival };
        }).filter(Boolean);
    }

    // Score each treatment method across all detected organisms
    function scoreTreatments(organisms, portA) {
        return TREATMENT_METHODS.map(method => {
            let totalEff = 0;
            let worstEff = 100;

            organisms.forEach(org => {
                const eff = org.treatmentEffectiveness[method.id] || 50;
                totalEff += eff;
                if (eff < worstEff) worstEff = eff;
            });

            const avgEff = organisms.length > 0 ? Math.round(totalEff / organisms.length) : 0;

            // Turbidity penalty for UV
            let turbidityAdj = 0;
            if (method.id === 'uv' && portA.turbidity > 15) {
                turbidityAdj = -Math.min((portA.turbidity - 15) * 2, 25);
            }

            const adjustedEff = Math.max(avgEff + turbidityAdj, 0);

            return {
                ...method,
                avgEffectiveness: adjustedEff,
                worstCase: worstEff,
                turbidityPenalty: turbidityAdj,
                organisms: organisms.map(o => ({
                    name: o.name,
                    effectiveness: o.treatmentEffectiveness[method.id]
                }))
            };
        });
    }

    // Recommend the best treatment method
    function recommend(organisms, portA, portB) {
        if (organisms.length === 0) {
            return {
                method: null,
                reason: 'No organisms selected for analysis.',
                scores: [],
                organisms: []
            };
        }

        const analyzed = analyzeOrganisms(organisms, portA, portB);
        const scores = scoreTreatments(analyzed, portA);

        // Sort by adjusted effectiveness (desc)
        const sorted = [...scores].sort((a, b) => b.avgEffectiveness - a.avgEffectiveness);
        const best = sorted[0];

        // Check if any high-survival + treatment-resistant organisms exist
        const resistanceWarnings = [];
        analyzed.forEach(org => {
            if (org.survival.probability > 50 && org.treatmentEffectiveness[best.id] < 60) {
                resistanceWarnings.push(
                    `${org.name} has ${org.survival.probability}% survival and only ${org.treatmentEffectiveness[best.id]}% treatment effectiveness with ${best.name}.`
                );
            }
        });

        // Build recommendation
        let reason = `${best.name} provides the highest average effectiveness (${best.avgEffectiveness}%) against the detected organisms.`;

        if (best.turbidityPenalty < 0) {
            reason += ` Note: UV effectiveness reduced by ${Math.abs(best.turbidityPenalty)}% due to high source-water turbidity (${portA.turbidity} NTU).`;
        }

        if (resistanceWarnings.length > 0) {
            reason += ' ⚠ Some organisms show resistance – consider hybrid treatment or extended contact time.';
        }

        // Generate specific operational guidance
        const guidance = generateGuidance(best, analyzed, portA, portB);

        return {
            method: best,
            reason,
            scores: sorted,
            organisms: analyzed,
            warnings: resistanceWarnings,
            guidance
        };
    }

    function generateGuidance(method, organisms, portA, portB) {
        const guidance = [];

        if (method.id === 'uv') {
            const dose = portA.turbidity > 12 ? '≥80 mJ/cm²' : '≥40 mJ/cm²';
            guidance.push(`Set UV dose to ${dose} for source turbidity ${portA.turbidity} NTU.`);
            guidance.push('Ensure lamp transmittance is verified before each discharge cycle.');
        }

        if (method.id === 'chemical') {
            guidance.push('Target TRO at 0.08 mg/L – well below IMO threshold of 0.1 mg/L.');
            guidance.push('Activate neutralization module 30 minutes before discharge.');
            guidance.push('Confirm residual TRO < 0.1 mg/L at discharge point.');
        }

        if (method.id === 'hybrid') {
            guidance.push('Run UV pre-treatment first, then low-dose chemical polishing.');
            guidance.push('Expected residual TRO: 0.03–0.05 mg/L (within safe limits).');
            guidance.push('Monitor both UV transmittance and TRO inline.');
        }

        // Destination-specific
        if (portB.coralPresence) {
            guidance.push(`⚠ ${portB.name} has coral reef ecosystems – minimize all residuals.`);
        }
        if (portB.eutrophicationZone) {
            guidance.push(`⚠ ${portB.name} is in a eutrophication zone – reduce nutrient-rich discharge.`);
        }

        return guidance;
    }

    return { analyzeOrganisms, scoreTreatments, recommend };
})();
