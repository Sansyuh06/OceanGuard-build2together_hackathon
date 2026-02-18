// ============================================================
// OceanGuard – Main Application Controller
// ============================================================

const App = (() => {
    let currentAnalysis = null;
    let riskChartInstance = null;
    let treatmentChartInstance = null;

    // ---- Init ----
    function init() {
        OceanMap.init('map');
        populatePortDropdowns();
        setupTabs();
        setupAnalysisForm();
        setupOrganismChecklist();
        setupReportButtons();
        updateCreditsTab();
        updateLeaderboard();

        // Default selections for demo
        document.getElementById('port-a').value = 'singapore';
        document.getElementById('port-b').value = 'chennai';
    }

    // ---- Tab switching ----
    function setupTabs() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
                document.getElementById(`tab-${tab}`).classList.add('active');
                if (tab === 'route') OceanMap.resize();
            });
        });
    }

    // ---- Port dropdowns ----
    function populatePortDropdowns() {
        const selA = document.getElementById('port-a');
        const selB = document.getElementById('port-b');
        PORTS.forEach(p => {
            selA.innerHTML += `<option value="${p.id}">${p.name}</option>`;
            selB.innerHTML += `<option value="${p.id}">${p.name}</option>`;
        });
    }

    // ---- Organism checklist ----
    function setupOrganismChecklist() {
        const container = document.getElementById('organism-list');
        if (!container) return;
        // Will be populated after port selection
    }

    function updateOrganismChecklist(portA) {
        const container = document.getElementById('organism-list');
        container.innerHTML = '';

        // Show organisms common at Port A
        const portOrgs = portA.commonOrganisms || [];
        ORGANISMS.forEach(org => {
            const isCommon = portOrgs.includes(org.id);
            container.innerHTML += `
        <label class="org-checkbox ${isCommon ? 'org-common' : ''}">
          <input type="checkbox" value="${org.id}" ${isCommon ? 'checked' : ''}>
          <span class="org-icon">${org.icon}</span>
          <span class="org-info">
            <strong>${org.name}</strong>
            <small>${org.type} — ${org.riskLevel} risk</small>
          </span>
        </label>`;
        });
    }

    // ---- Analysis ----
    function setupAnalysisForm() {
        document.getElementById('btn-analyze').addEventListener('click', runAnalysis);

        // Slider labels
        ['uv-dose', 'tro-level', 'organism-count'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', () => {
                const label = document.getElementById(`${id}-val`);
                if (label) label.textContent = el.value;
            });
        });

        // Update organisms when Port A changes
        document.getElementById('port-a').addEventListener('change', () => {
            const portA = getPortById(document.getElementById('port-a').value);
            if (portA) updateOrganismChecklist(portA);
        });

        // Initial organism list
        setTimeout(() => {
            const portA = getPortById(document.getElementById('port-a').value);
            if (portA) updateOrganismChecklist(portA);
        }, 100);
    }

    function runAnalysis() {
        const portAId = document.getElementById('port-a').value;
        const portBId = document.getElementById('port-b').value;

        if (!portAId || !portBId) { alert('Select both ports'); return; }
        if (portAId === portBId) { alert('Select different ports'); return; }

        const portA = getPortById(portAId);
        const portB = getPortById(portBId);
        const treatmentType = document.getElementById('treatment-type').value;

        const params = {
            uvDose: parseInt(document.getElementById('uv-dose').value),
            tro: parseFloat(document.getElementById('tro-level').value),
            organismCount: parseInt(document.getElementById('organism-count').value)
        };

        // Scoring
        const risk = ScoringEngine.dischargeRisk(portA, portB, params);

        // Treatment
        const selectedOrgs = [...document.querySelectorAll('#organism-list input:checked')].map(c => c.value);
        const treatment = TreatmentEngine.recommend(selectedOrgs, portA, portB);

        // Credits
        CreditsEngine.reset();
        const credits = CreditsEngine.awardForAnalysis(risk.total, portB, treatmentType);

        currentAnalysis = { portA, portB, risk, treatment, credits, params, treatmentType };

        // Update all views
        OceanMap.drawRoute(portA, portB, risk.total);
        updateRiskTab(currentAnalysis);
        updateTreatmentTab(currentAnalysis);
        updateCreditsTab();
        updateLeaderboard();

        // Fetch LIVE marine data from Open-Meteo API (free, no key)
        const livePanel = document.getElementById('live-data-panel');
        if (livePanel) {
            livePanel.innerHTML = '<div class="live-header"><span class="live-dot live-loading"></span><span>Fetching live marine data...</span></div>';
            LiveAPI.fetchRouteData(portA, portB).then(liveData => {
                LiveAPI.renderLivePanel(portA, portB, liveData);
                currentAnalysis.liveData = liveData;
            });
        }

        // Flash success
        const btn = document.getElementById('btn-analyze');
        btn.textContent = '✓ Analysis Complete';
        btn.classList.add('btn-success');
        setTimeout(() => { btn.textContent = 'Analyze Route'; btn.classList.remove('btn-success'); }, 2000);
    }

    // ---- Risk Tab ----
    function updateRiskTab(data) {
        const { risk, portA, portB } = data;
        const th = getThreshold(risk.total);

        // Gauge
        updateGauge(risk.total, th);

        // Verdict
        const verdict = document.getElementById('risk-verdict');
        verdict.textContent = th.label;
        verdict.style.color = th.color;
        verdict.style.background = th.bg;

        // Route info
        document.getElementById('risk-route-info').innerHTML =
            `<span class="route-label">${portA.name}</span>
       <span class="route-arrow">→</span>
       <span class="route-label">${portB.name}</span>`;

        // Breakdown values
        document.getElementById('bio-risk-val').textContent = risk.breakdown.biological;
        document.getElementById('chem-risk-val').textContent = risk.breakdown.chemical;
        document.getElementById('eco-risk-val').textContent = risk.breakdown.ecological;
        document.getElementById('compat-risk-val').textContent = risk.breakdown.compatibility;

        // Color the breakdown bars
        setBarWidth('bio-risk-bar', risk.breakdown.biological);
        setBarWidth('chem-risk-bar', risk.breakdown.chemical);
        setBarWidth('eco-risk-bar', risk.breakdown.ecological);
        setBarWidth('compat-risk-bar', risk.breakdown.compatibility);

        // Comparison table
        updateComparisonTable(portA, portB);

        // Risk breakdown chart
        updateRiskChart(risk);
    }

    function updateGauge(score, threshold) {
        const circle = document.getElementById('gauge-circle');
        const text = document.getElementById('gauge-text');
        if (!circle || !text) return;

        const circumference = 2 * Math.PI * 70;
        const offset = circumference - (score / 100) * circumference;
        circle.style.strokeDasharray = circumference;
        circle.style.strokeDashoffset = offset;
        circle.style.stroke = threshold.color;

        text.textContent = score;
        text.style.fill = threshold.color;

        // Animate
        circle.style.transition = 'stroke-dashoffset 1.2s ease-out, stroke 0.5s ease';
    }

    function setBarWidth(id, value) {
        const bar = document.getElementById(id);
        if (!bar) return;
        bar.style.width = `${value}%`;
        const color = value <= 30 ? '#10b981' : value <= 60 ? '#f59e0b' : '#ef4444';
        bar.style.background = color;
    }

    function updateComparisonTable(portA, portB) {
        const tbody = document.getElementById('comparison-tbody');
        if (!tbody) return;
        tbody.innerHTML = `
      <tr><td>Salinity</td><td>${portA.salinity} ppt</td><td>${portB.salinity} ppt</td><td class="${Math.abs(portA.salinity - portB.salinity) > 10 ? 'diff-high' : 'diff-low'}">${Math.abs(portA.salinity - portB.salinity)} ppt</td></tr>
      <tr><td>Temperature</td><td>${portA.temperature}°C</td><td>${portB.temperature}°C</td><td class="${Math.abs(portA.temperature - portB.temperature) > 8 ? 'diff-high' : 'diff-low'}">${Math.abs(portA.temperature - portB.temperature)}°C</td></tr>
      <tr><td>Turbidity</td><td>${portA.turbidity} NTU</td><td>${portB.turbidity} NTU</td><td>${Math.abs(portA.turbidity - portB.turbidity)} NTU</td></tr>
      <tr><td>Nutrient Load</td><td>${['—', 'Low', 'Medium', 'High'][portA.nutrientLoad]}</td><td>${['—', 'Low', 'Medium', 'High'][portB.nutrientLoad]}</td><td>${Math.abs(portA.nutrientLoad - portB.nutrientLoad) > 1 ? '⚠ Mismatch' : 'OK'}</td></tr>
      <tr><td>Coral Presence</td><td>${portA.coralPresence ? '✅' : '—'}</td><td>${portB.coralPresence ? '✅' : '—'}</td><td>${portB.coralPresence ? '⚠ Sensitive' : '—'}</td></tr>
      <tr><td>Eco Sensitivity</td><td>${portA.ecoSensitivity}/100</td><td>${portB.ecoSensitivity}/100</td><td>${portB.ecoSensitivity >= 70 ? '⚠ High' : 'OK'}</td></tr>
    `;
    }

    function updateRiskChart(risk) {
        const ctx = document.getElementById('risk-chart');
        if (!ctx) return;

        if (riskChartInstance) riskChartInstance.destroy();

        riskChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Biological', 'Chemical', 'Ecological', 'Compatibility'],
                datasets: [{
                    data: [risk.breakdown.biological, risk.breakdown.chemical, risk.breakdown.ecological, risk.breakdown.compatibility],
                    backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'],
                    borderColor: 'rgba(10,22,40,0.8)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 12, font: { size: 11 } } }
                },
                cutout: '65%'
            }
        });
    }

    // ---- Treatment Tab ----
    function updateTreatmentTab(data) {
        const { treatment, portA, portB } = data;

        // Organism survival cards
        const orgContainer = document.getElementById('organism-survival');
        if (orgContainer && treatment.organisms) {
            orgContainer.innerHTML = treatment.organisms.map(org => {
                const surv = org.survival;
                const color = surv.probability > 60 ? '#ef4444' : surv.probability > 30 ? '#f59e0b' : '#10b981';
                return `
          <div class="organism-card">
            <div class="org-header">
              <span class="org-card-icon">${org.icon}</span>
              <div>
                <h4>${org.name}</h4>
                <span class="org-type">${org.type}</span>
              </div>
            </div>
            <div class="org-survival">
              <div class="survival-bar-bg">
                <div class="survival-bar" style="width:${surv.probability}%;background:${color}"></div>
              </div>
              <span class="survival-pct" style="color:${color}">${surv.probability}% survival</span>
            </div>
            <p class="org-impact">${org.impactNote}</p>
          </div>`;
            }).join('');
        }

        // Recommended treatment
        const recContainer = document.getElementById('treatment-recommendation');
        if (recContainer && treatment.method) {
            recContainer.innerHTML = `
        <div class="rec-card">
          <div class="rec-header">
            <span class="rec-icon">${treatment.method.icon}</span>
            <div>
              <h3>${treatment.method.name}</h3>
              <span class="rec-eff">Avg. Effectiveness: ${treatment.method.avgEffectiveness}%</span>
            </div>
          </div>
          <p class="rec-reason">${treatment.reason}</p>
          <div class="rec-guidance">
            <h4>Operational Guidance</h4>
            <ul>${treatment.guidance.map(g => `<li>${g}</li>`).join('')}</ul>
          </div>
          ${treatment.warnings.length > 0 ? `
            <div class="rec-warnings">
              <h4>⚠ Resistance Warnings</h4>
              <ul>${treatment.warnings.map(w => `<li>${w}</li>`).join('')}</ul>
            </div>
          ` : ''}
        </div>`;
        }

        // Treatment comparison chart
        updateTreatmentChart(treatment.scores);
    }

    function updateTreatmentChart(scores) {
        const ctx = document.getElementById('treatment-chart');
        if (!ctx) return;

        if (treatmentChartInstance) treatmentChartInstance.destroy();

        treatmentChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: scores.map(s => s.name),
                datasets: [{
                    label: 'Avg. Effectiveness (%)',
                    data: scores.map(s => s.avgEffectiveness),
                    backgroundColor: ['#f59e0b', '#3b82f6', '#10b981'],
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                scales: {
                    x: { max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                    y: { grid: { display: false }, ticks: { color: '#e2e8f0', font: { size: 12 } } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // ---- Credits Tab ----
    function updateCreditsTab() {
        const stats = CreditsEngine.getStats();

        setText('credits-voyage', stats.voyageCredits);
        setText('credits-lifetime', stats.lifetimeCredits);
        setText('credits-co2', `${stats.co2Offset} tonnes`);
        setText('credits-savings', `$${stats.feeDiscount.toLocaleString()}`);
        setText('credits-voyages-count', stats.totalVoyages);
    }

    function updateLeaderboard() {
        const board = CreditsEngine.getLeaderboard();
        const tbody = document.getElementById('leaderboard-tbody');
        if (!tbody) return;

        tbody.innerHTML = board.map((ship, i) => `
      <tr class="${ship.isYou ? 'leaderboard-you' : ''}">
        <td class="rank">${i === 0 ? '🏆' : i + 1}</td>
        <td>${ship.flag} ${ship.name}</td>
        <td class="credits-cell">${ship.credits}</td>
        <td>${ship.voyages}</td>
        <td class="${ship.avgRisk <= 30 ? 'risk-low' : ship.avgRisk <= 60 ? 'risk-mod' : 'risk-high'}">${ship.avgRisk}</td>
      </tr>
    `).join('');
    }

    // ---- Reports ----
    function setupReportButtons() {
        document.getElementById('btn-download-report')?.addEventListener('click', () => {
            if (!currentAnalysis) { alert('Run analysis first'); return; }
            ReportGenerator.generateVoyageReport(currentAnalysis);
        });
    }

    // ---- Helpers ----
    function setText(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    // ---- Boot ----
    document.addEventListener('DOMContentLoaded', init);

    return { runAnalysis };
})();
