// ============================================================
// OceanGuard – Eco Credit Engine
// ============================================================

const CreditsEngine = (() => {

    let voyageCredits = 0;
    let lifetimeCredits = 0;
    let history = [];

    function reset() {
        voyageCredits = 0;
    }

    function awardForAnalysis(riskScore, portB, treatmentId) {
        let credits = 5; // base credit for completing analysis
        const reasons = ['Analysis completed (+5)'];

        // Safe discharge in sensitive zone
        if (riskScore <= 30 && portB.ecoSensitivity >= 60) {
            credits += 25;
            reasons.push('Safe discharge in sensitive zone (+25)');
        } else if (riskScore <= 30) {
            credits += 15;
            reasons.push('Safe discharge (+15)');
        } else if (riskScore <= 60) {
            credits += 5;
            reasons.push('Moderate risk managed (+5)');
        } else {
            credits -= 20;
            reasons.push('High risk attempt (−20)');
        }

        // Coral protection bonus
        if (riskScore <= 40 && portB.coralPresence) {
            credits += 15;
            reasons.push('Coral ecosystem protected (+15)');
        }

        // Zero chemical residual bonus
        if (treatmentId === 'uv') {
            credits += 10;
            reasons.push('Zero TRO discharge (+10)');
        } else if (treatmentId === 'hybrid') {
            credits += 5;
            reasons.push('Minimal TRO discharge (+5)');
        }

        voyageCredits = credits;
        lifetimeCredits += Math.max(credits, 0);

        history.push({
            timestamp: new Date().toISOString(),
            credits: credits,
            port: portB.name,
            riskScore: riskScore
        });

        return {
            voyageCredits: credits,
            lifetimeCredits,
            reasons,
            co2Offset: ScoringEngine.co2Offset(lifetimeCredits),
            feeDiscount: ScoringEngine.feeDiscount(lifetimeCredits),
            history
        };
    }

    function getLeaderboard() {
        // Combine fleet demo data with current ship
        const combined = [
            ...FLEET_DATA,
            {
                id: 'MV-CURRENT',
                name: 'MV Your Ship',
                credits: lifetimeCredits,
                voyages: history.length,
                avgRisk: history.length > 0
                    ? Math.round(history.reduce((s, h) => s + h.riskScore, 0) / history.length)
                    : 0,
                flag: '🏁',
                isYou: true
            }
        ];
        return combined.sort((a, b) => b.credits - a.credits);
    }

    function getStats() {
        return {
            voyageCredits,
            lifetimeCredits,
            co2Offset: ScoringEngine.co2Offset(lifetimeCredits),
            feeDiscount: ScoringEngine.feeDiscount(lifetimeCredits),
            totalVoyages: history.length,
            history
        };
    }

    return { reset, awardForAnalysis, getLeaderboard, getStats };
})();
