// ============================================================
// OceanGuard – PDF Report Generator (jsPDF)
// ============================================================

const ReportGenerator = (() => {

    function generateVoyageReport(analysisData) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const W = 210, M = 15;

        // -- Header --
        doc.setFillColor(10, 22, 40);
        doc.rect(0, 0, W, 45, 'F');
        doc.setFillColor(0, 212, 255);
        doc.rect(0, 44, W, 1.5, 'F');

        doc.setTextColor(0, 212, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('OceanGuard', M, 18);
        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184);
        doc.text('Ecological Transition Intelligence Report', M, 26);
        doc.setFontSize(8);
        doc.text(`Generated: ${new Date().toLocaleString()}`, M, 34);
        doc.text(`Report ID: OG-${Date.now().toString(36).toUpperCase()}`, W - M - 40, 34);

        let y = 55;

        // -- Route Summary --
        doc.setTextColor(0, 212, 255);
        doc.setFontSize(13); doc.setFont('helvetica', 'bold');
        doc.text('Route Summary', M, y); y += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10); doc.setTextColor(40, 40, 40);
        const portA = analysisData.portA;
        const portB = analysisData.portB;
        doc.text(`Intake Port:     ${portA.name} (${portA.country})`, M, y); y += 6;
        doc.text(`Discharge Port:  ${portB.name} (${portB.country})`, M, y); y += 6;
        doc.text(`Salinity Shift:  ${portA.salinity} ppt → ${portB.salinity} ppt`, M, y); y += 6;
        doc.text(`Temperature:     ${portA.temperature}°C → ${portB.temperature}°C`, M, y); y += 6;
        doc.text(`Destination Eco Sensitivity: ${portB.ecoSensitivity}/100`, M, y); y += 6;
        if (portB.coralPresence) {
            doc.setTextColor(239, 68, 68);
            doc.text('⚠ Coral reef ecosystems present at discharge port', M, y);
            doc.setTextColor(40, 40, 40);
            y += 6;
        }
        y += 4;

        // -- Eco Score --
        doc.setDrawColor(200, 200, 200);
        doc.line(M, y, W - M, y); y += 8;

        const risk = analysisData.risk;
        const th = getThreshold(risk.total);
        doc.setTextColor(0, 212, 255);
        doc.setFontSize(13); doc.setFont('helvetica', 'bold');
        doc.text('Discharge Risk Assessment', M, y); y += 8;

        doc.setFontSize(28); doc.setFont('helvetica', 'bold');
        const scoreColor = risk.total <= 30 ? [16, 185, 129] : risk.total <= 60 ? [245, 158, 11] : [239, 68, 68];
        doc.setTextColor(...scoreColor);
        doc.text(`${risk.total}`, M, y);
        doc.setFontSize(12);
        doc.text(`/ 100  —  ${th.label}`, M + 20, y);
        y += 12;

        doc.setFontSize(10); doc.setTextColor(40, 40, 40);
        doc.text(`Biological Risk:      ${risk.breakdown.biological}/100`, M, y); y += 6;
        doc.text(`Chemical Risk:        ${risk.breakdown.chemical}/100`, M, y); y += 6;
        doc.text(`Ecological Risk:      ${risk.breakdown.ecological}/100`, M, y); y += 6;
        doc.text(`Compatibility Risk:   ${risk.breakdown.compatibility}/100`, M, y);
        y += 10;

        // -- Treatment Recommendation --
        doc.setDrawColor(200, 200, 200);
        doc.line(M, y, W - M, y); y += 8;

        doc.setTextColor(0, 212, 255);
        doc.setFontSize(13); doc.setFont('helvetica', 'bold');
        doc.text('Treatment Recommendation', M, y); y += 8;

        if (analysisData.treatment && analysisData.treatment.method) {
            const t = analysisData.treatment;
            doc.setFontSize(11); doc.setFont('helvetica', 'bold');
            doc.setTextColor(40, 40, 40);
            doc.text(`Recommended: ${t.method.name}`, M, y); y += 6;
            doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
            doc.text(`Avg. Effectiveness: ${t.method.avgEffectiveness}%`, M, y); y += 5;
            doc.text(`Est. TRO: ${t.method.estimatedTRO} mg/L`, M, y); y += 5;

            if (t.guidance && t.guidance.length > 0) {
                y += 3;
                doc.setFont('helvetica', 'bold');
                doc.text('Operational Guidance:', M, y); y += 5;
                doc.setFont('helvetica', 'normal');
                t.guidance.forEach(g => {
                    const clean = g.replace(/⚠/g, '[!]');
                    doc.text(`• ${clean}`, M + 4, y); y += 5;
                });
            }
        }
        y += 6;

        // -- Eco Credits --
        if (analysisData.credits) {
            doc.setDrawColor(200, 200, 200);
            doc.line(M, y, W - M, y); y += 8;

            doc.setTextColor(0, 212, 255);
            doc.setFontSize(13); doc.setFont('helvetica', 'bold');
            doc.text('Eco Credit Summary', M, y); y += 8;

            doc.setFontSize(10); doc.setFont('helvetica', 'normal');
            doc.setTextColor(40, 40, 40);
            const c = analysisData.credits;
            doc.text(`Credits Earned This Voyage: ${c.voyageCredits}`, M, y); y += 6;
            doc.text(`Lifetime Credits: ${c.lifetimeCredits}`, M, y); y += 6;
            doc.text(`CO₂ Offset Equivalent: ${c.co2Offset} tonnes`, M, y); y += 6;
            doc.text(`Estimated Port Fee Savings: $${c.feeDiscount.toLocaleString()}`, M, y);
            y += 10;
        }

        // -- Data Sources --
        doc.setDrawColor(200, 200, 200);
        doc.line(M, y, W - M, y); y += 8;
        doc.setTextColor(0, 212, 255);
        doc.setFontSize(11); doc.setFont('helvetica', 'bold');
        doc.text('Data Sources & Calibration', M, y); y += 6;

        doc.setFontSize(8); doc.setTextColor(80, 80, 80); doc.setFont('helvetica', 'normal');
        const sources = [
            '• SST & Salinity: NOAA World Ocean Atlas 2023 (Locarnini et al. 2024)',
            '• Invasive Species: IUCN Global Invasive Species Database & Smithsonian NEMESIS',
            '• Treatment Efficiency: IMO MEPC.300(72) G8 Guidelines & EPA ETV Protocol 4.6',
            '• Coral Reefs: Allen Coral Atlas & NOAA Coral Reef Watch',
            '• Live Conditions: Open-Meteo Marine API (Real-time SST, Waves, Currents)'
        ];
        sources.forEach(s => {
            doc.text(s, M, y); y += 4;
        });

        // -- Footer --
        const pageH = doc.internal.pageSize.getHeight();
        doc.setFillColor(10, 22, 40);
        doc.rect(0, pageH - 16, W, 16, 'F');
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(7);
        doc.text('OceanGuard — Ecological Transition Intelligence | SDG 14: Life Below Water', M, pageH - 7);
        doc.text('This report is auto-generated for compliance and environmental governance purposes.', M, pageH - 3);

        doc.save(`OceanGuard_Report_${Date.now()}.pdf`);
    }

    return { generateVoyageReport };
})();
