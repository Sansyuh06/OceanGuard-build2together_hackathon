// ============================================================
// OceanGuard – Live API Integration (Free, No API Keys)
// ============================================================
// APIs used:
//   1. Open-Meteo Marine API  — Real-time SST, wave height, ocean current
//      https://marine-api.open-meteo.com (Free, no key, CORS)
//   2. Open-Meteo Geocoding   — Reverse geocoding (free)
// ============================================================

const LiveAPI = (() => {
    const MARINE_BASE = 'https://marine-api.open-meteo.com/v1/marine';
    const cache = {};

    // ---- Fetch real-time marine conditions at a port ----
    async function fetchMarineData(port) {
        const key = port.id;
        if (cache[key] && (Date.now() - cache[key].ts < 600000)) { // 10 min cache
            return cache[key].data;
        }

        const params = new URLSearchParams({
            latitude: port.lat,
            longitude: port.lng,
            current: [
                'wave_height',
                'wave_direction',
                'wave_period',
                'wind_wave_height',
                'swell_wave_height',
                'ocean_current_velocity',
                'ocean_current_direction'
            ].join(','),
            hourly: 'sea_surface_temperature',
            forecast_days: 1,
            timezone: 'auto'
        });

        try {
            const resp = await fetch(`${MARINE_BASE}?${params}`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const json = await resp.json();

            // Extract current-hour SST from hourly array
            const now = new Date();
            const currentHour = now.getHours();
            const sst = json.hourly?.sea_surface_temperature?.[currentHour] ?? null;

            const result = {
                sst: sst,
                waveHeight: json.current?.wave_height ?? null,
                waveDirection: json.current?.wave_direction ?? null,
                wavePeriod: json.current?.wave_period ?? null,
                windWaveHeight: json.current?.wind_wave_height ?? null,
                swellWaveHeight: json.current?.swell_wave_height ?? null,
                oceanCurrentVelocity: json.current?.ocean_current_velocity ?? null,
                oceanCurrentDirection: json.current?.ocean_current_direction ?? null,
                sstForecast: json.hourly?.sea_surface_temperature ?? [],
                sstTimes: json.hourly?.time ?? [],
                source: 'Open-Meteo Marine API (live)',
                fetchedAt: new Date().toISOString()
            };

            cache[key] = { data: result, ts: Date.now() };
            return result;

        } catch (err) {
            console.warn(`LiveAPI: Failed to fetch marine data for ${port.name}:`, err.message);
            return null;
        }
    }

    // ---- Fetch marine data for both ports in parallel ----
    async function fetchRouteData(portA, portB) {
        const [dataA, dataB] = await Promise.all([
            fetchMarineData(portA),
            fetchMarineData(portB)
        ]);
        return { portA: dataA, portB: dataB };
    }

    // ---- Update the UI with live data ----
    function renderLivePanel(portA, portB, liveData) {
        const panel = document.getElementById('live-data-panel');
        if (!panel) return;

        const a = liveData.portA;
        const b = liveData.portB;

        if (!a && !b) {
            panel.innerHTML = '<p class="live-error">⚠ Live data unavailable — using WOA23 climatology baseline.</p>';
            return;
        }

        panel.innerHTML = `
      <div class="live-header">
        <span class="live-dot"></span>
        <span>LIVE Marine Conditions</span>
        <small>via Open-Meteo API • ${new Date().toLocaleTimeString()}</small>
      </div>
      <div class="live-grid">
        ${renderPortLive(portA.name, a)}
        ${renderPortLive(portB.name, b)}
      </div>
    `;
    }

    function renderPortLive(name, data) {
        if (!data) return `<div class="live-port"><h4>${name}</h4><p class="live-na">Data unavailable</p></div>`;

        const sstDisplay = data.sst !== null ? `${data.sst.toFixed(1)}°C` : 'N/A';
        const waveDisplay = data.waveHeight !== null ? `${data.waveHeight.toFixed(1)} m` : 'N/A';
        const currentDisplay = data.oceanCurrentVelocity !== null ? `${data.oceanCurrentVelocity.toFixed(2)} m/s` : 'N/A';
        const swellDisplay = data.swellWaveHeight !== null ? `${data.swellWaveHeight.toFixed(1)} m` : 'N/A';

        return `
      <div class="live-port">
        <h4>${name}</h4>
        <div class="live-stats">
          <div class="live-stat">
            <span class="live-val">${sstDisplay}</span>
            <span class="live-label">SST (Live)</span>
          </div>
          <div class="live-stat">
            <span class="live-val">${waveDisplay}</span>
            <span class="live-label">Wave Height</span>
          </div>
          <div class="live-stat">
            <span class="live-val">${currentDisplay}</span>
            <span class="live-label">Ocean Current</span>
          </div>
          <div class="live-stat">
            <span class="live-val">${swellDisplay}</span>
            <span class="live-label">Swell Height</span>
          </div>
        </div>
      </div>
    `;
    }

    // ---- Compute live SST delta for risk adjustment ----
    function sstDelta(liveData, portA, portB) {
        const liveA = liveData?.portA?.sst;
        const liveB = liveData?.portB?.sst;
        if (liveA === null || liveB === null || liveA === undefined || liveB === undefined) return 0;

        // Compare live SST difference vs climatological baseline
        const climateDiff = Math.abs(portA.temperature - portB.temperature);
        const liveDiff = Math.abs(liveA - liveB);
        // Positive = live conditions are MORE different than climatology expects
        return liveDiff - climateDiff;
    }

    return { fetchMarineData, fetchRouteData, renderLivePanel, sstDelta };
})();
