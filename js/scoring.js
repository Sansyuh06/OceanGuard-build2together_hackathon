// ============================================================
// OceanGuard – Ecological Scoring Engine
// ============================================================

const ScoringEngine = (() => {

    // ---------- Ecological Compatibility Score ----------
    // Measures environmental mismatch between Port A and Port B
    // Lower = more compatible, Higher = more ecological shock risk

    function ecologicalCompatibility(portA, portB) {
        const salinityDiff = Math.abs(portA.salinity - portB.salinity);
        const tempDiff = Math.abs(portA.temperature - portB.temperature);
        const nutrientDiff = Math.abs(portA.nutrientLoad - portB.nutrientLoad);

        // Normalised component scores (0–100)
        const salinityScore = Math.min((salinityDiff / 25) * 100, 100);
        const tempScore = Math.min((tempDiff / 15) * 100, 100);
        const nutrientScore = (nutrientDiff / 2) * 100;
        const invasiveScore = Math.min(portB.invasiveIncidents * 6, 100);
        const sensitivityScore = portB.ecoSensitivity;
        const coralPenalty = portB.coralPresence ? 15 : 0;
        const eutrophPenalty = portB.eutrophicationZone ? 10 : 0;

        const weighted =
            salinityScore * 0.20 +
            tempScore * 0.15 +
            nutrientScore * 0.12 +
            invasiveScore * 0.18 +
            sensitivityScore * 0.20 +
            coralPenalty * 1.0 +
            eutrophPenalty * 1.0;

        return {
            total: Math.min(Math.round(weighted), 100),
            breakdown: {
                salinity: Math.round(salinityScore),
                temperature: Math.round(tempScore),
                nutrient: Math.round(nutrientScore),
                invasive: Math.round(invasiveScore),
                sensitivity: Math.round(sensitivityScore),
                coral: coralPenalty,
                eutrophication: eutrophPenalty
            }
        };
    }

    // ---------- Organism Survival Probability ----------
    // Estimates if organisms from Port A can survive in Port B

    function organismSurvival(organism, portA, portB) {
        const sal = portB.salinity;
        const temp = portB.temperature;

        const salOk = sal >= organism.salinityRange[0] && sal <= organism.salinityRange[1];
        const tempOk = temp >= organism.tempRange[0] && temp <= organism.tempRange[1];

        let probability = 0;

        if (salOk && tempOk) {
            // Both within range – high survival
            const salCenter = (organism.salinityRange[0] + organism.salinityRange[1]) / 2;
            const salRange = (organism.salinityRange[1] - organism.salinityRange[0]) / 2;
            const salFit = 1 - Math.abs(sal - salCenter) / salRange;

            const tempCenter = (organism.tempRange[0] + organism.tempRange[1]) / 2;
            const tempRange = (organism.tempRange[1] - organism.tempRange[0]) / 2;
            const tempFit = 1 - Math.abs(temp - tempCenter) / tempRange;

            probability = Math.round(((salFit + tempFit) / 2) * 100);
        } else if (salOk || tempOk) {
            probability = Math.round(Math.random() * 20 + 10); // marginal
        }

        return {
            id: organism.id,
            name: organism.name,
            probability: Math.min(probability, 100),
            salOk, tempOk,
            risk: probability > 60 ? 'high' : probability > 30 ? 'moderate' : 'low'
        };
    }

    // ---------- Discharge Risk Score ----------
    // Integrates compatibility + treatment params + destination sensitivity

    function dischargeRisk(portA, portB, treatmentParams) {
        const compat = ecologicalCompatibility(portA, portB);

        // Biological compliance risk
        let bioRisk = 0;
        if (treatmentParams.uvDose < 40) bioRisk += 35;
        else if (treatmentParams.uvDose < 80) bioRisk += 15;
        if (portA.turbidity > 15) bioRisk += 15;
        if (treatmentParams.organismCount > 10) bioRisk += 20;
        bioRisk = Math.min(bioRisk, 100);

        // Chemical residual risk
        let chemRisk = 0;
        const tro = treatmentParams.tro;
        if (tro > 0.2) chemRisk = 90;
        else if (tro > 0.1) chemRisk = 60;
        else if (tro > 0.05) chemRisk = 25;
        else chemRisk = 5;

        // Eco sensitivity risk
        let ecoRisk = portB.ecoSensitivity;
        if (portB.coralPresence) ecoRisk += 10;
        if (portB.eutrophicationZone) ecoRisk += 8;
        ecoRisk = Math.min(ecoRisk, 100);

        // Compatibility contribution
        const compatRisk = compat.total;

        const total = Math.round(
            bioRisk * 0.30 +
            chemRisk * 0.25 +
            ecoRisk * 0.25 +
            compatRisk * 0.20
        );

        return {
            total: Math.min(total, 100),
            compatibility: compat,
            breakdown: {
                biological: Math.round(bioRisk),
                chemical: Math.round(chemRisk),
                ecological: Math.round(ecoRisk),
                compatibility: compat.total
            }
        };
    }

    // ---------- Eco Credit Calculation ----------
    function calculateCredits(riskScore, portB) {
        let credits = 0;

        // Base credit for completing analysis
        credits += 5;

        // Safe discharge in sensitive zone
        if (riskScore <= 30 && portB.ecoSensitivity >= 60) credits += 25;
        else if (riskScore <= 30) credits += 15;
        else if (riskScore <= 60) credits += 5;
        else credits -= 20; // penalty

        // Coral protection bonus
        if (riskScore <= 40 && portB.coralPresence) credits += 15;

        // Zero TRO bonus
        // (handled in app based on treatment type)

        return credits;
    }

    // ---------- CO₂ offset estimate ----------
    function co2Offset(credits) {
        // 1 credit ≈ 0.057 tonnes CO₂ prevented (indicative)
        return Math.round(credits * 0.057 * 100) / 100;
    }

    // ---------- Port fee discount projection ----------
    function feeDiscount(credits) {
        // $300 per credit (indicative incentive model)
        return credits * 300;
    }

    return {
        ecologicalCompatibility,
        organismSurvival,
        dischargeRisk,
        calculateCredits,
        co2Offset,
        feeDiscount
    };
})();
