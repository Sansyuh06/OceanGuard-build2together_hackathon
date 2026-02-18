// ============================================================
// OceanGuard – Leaflet Map & Sea Route Renderer
// ============================================================

const OceanMap = (() => {
    let map = null;
    let portMarkers = {};
    let routeLayer = null;
    let routeDecorator = null;
    let animFrame = null;
    let shipMarker = null;

    const SHIP_ICON = L.divIcon({
        className: 'ship-icon',
        html: '<div class="ship-dot">🚢</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });

    const PORT_ICON_A = L.divIcon({
        className: 'port-icon port-a',
        html: '<div class="port-marker port-marker-a"><i class="fa-solid fa-anchor"></i></div>',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
    });

    const PORT_ICON_B = L.divIcon({
        className: 'port-icon port-b',
        html: '<div class="port-marker port-marker-b"><i class="fa-solid fa-location-dot"></i></div>',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
    });

    const PORT_ICON_DEFAULT = (port) => L.divIcon({
        className: 'port-icon port-default',
        html: `<div class="port-dot" title="${port.name}"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });

    // ----- Great Circle Arc -----
    function greatCirclePoints(lat1, lng1, lat2, lng2, n = 80) {
        const toR = d => d * Math.PI / 180;
        const toD = r => r * 180 / Math.PI;
        const p1 = toR(lat1), l1 = toR(lng1);
        const p2 = toR(lat2), l2 = toR(lng2);
        const d = 2 * Math.asin(Math.sqrt(
            Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin((l2 - l1) / 2) ** 2
        ));
        if (d < 0.0001) return [[lat1, lng1], [lat2, lng2]];
        const pts = [];
        for (let i = 0; i <= n; i++) {
            const f = i / n;
            const A = Math.sin((1 - f) * d) / Math.sin(d);
            const B = Math.sin(f * d) / Math.sin(d);
            const x = A * Math.cos(p1) * Math.cos(l1) + B * Math.cos(p2) * Math.cos(l2);
            const y = A * Math.cos(p1) * Math.sin(l1) + B * Math.cos(p2) * Math.sin(l2);
            const z = A * Math.sin(p1) + B * Math.sin(p2);
            pts.push([toD(Math.atan2(z, Math.sqrt(x * x + y * y))), toD(Math.atan2(y, x))]);
        }
        return pts;
    }

    // ----- Determine route waypoints for realistic sea lanes -----
    function getWaypoints(portA, portB) {
        const cA = portA.continent, cB = portB.continent;
        const wp = ROUTE_WAYPOINTS;

        // Europe ↔ Asia (via Suez/Aden/Strait of Malacca)
        if ((cA === 'europe' && (cB === 'asia' || cB === 'oceania')) ||
            ((cA === 'asia' || cA === 'oceania') && cB === 'europe')) {
            const waypoints = [wp.gibraltar, wp.suezNorth, wp.suezSouth, wp.aden];
            if (cB === 'asia' || cA === 'asia') {
                const asiaPort = cA === 'asia' ? portA : portB;
                if (asiaPort.lng > 90) waypoints.push(wp.malacca);
            }
            return cA === 'europe' ? waypoints : [...waypoints].reverse();
        }

        // Europe ↔ Africa
        if ((cA === 'europe' && cB === 'africa') || (cA === 'africa' && cB === 'europe')) {
            return [wp.gibraltar];
        }

        // Americas ↔ Asia via Pacific
        if ((cA === 'americas' && (cB === 'asia' || cB === 'oceania')) ||
            ((cA === 'asia' || cA === 'oceania') && cB === 'americas')) {
            return []; // direct Pacific crossing
        }

        // Asia ↔ Africa
        if ((cA === 'asia' && cB === 'africa') || (cA === 'africa' && cB === 'asia')) {
            return [wp.aden];
        }

        return []; // direct route
    }

    // ----- Build full route path through waypoints -----
    function buildRoutePath(portA, portB) {
        const waypoints = getWaypoints(portA, portB);
        const allPoints = [
            [portA.lat, portA.lng],
            ...waypoints,
            [portB.lat, portB.lng]
        ];

        let fullPath = [];
        for (let i = 0; i < allPoints.length - 1; i++) {
            const seg = greatCirclePoints(
                allPoints[i][0], allPoints[i][1],
                allPoints[i + 1][0], allPoints[i + 1][1], 40
            );
            // avoid duplicate junction point
            if (i > 0) seg.shift();
            fullPath = fullPath.concat(seg);
        }
        return fullPath;
    }

    // ----- Risk-based route color -----
    function routeColor(riskScore) {
        if (riskScore <= 30) return '#10b981';
        if (riskScore <= 60) return '#f59e0b';
        return '#ef4444';
    }

    // ============= PUBLIC API =============

    function init(containerId) {
        map = L.map(containerId, {
            center: [20, 40],
            zoom: 2.5,
            minZoom: 2,
            maxZoom: 10,
            worldCopyJump: true,
            zoomControl: false
        });

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Dark ocean basemap
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; CartoDB',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(map);

        // Add all port default markers
        PORTS.forEach(port => {
            const m = L.marker([port.lat, port.lng], { icon: PORT_ICON_DEFAULT(port) })
                .bindPopup(portPopup(port))
                .addTo(map);
            portMarkers[port.id] = m;
        });
    }

    function portPopup(port) {
        const vuln = port.nativeVulnerability;
        return `
      <div class="port-popup">
        <h3>${port.name}</h3>
        <p class="port-desc">${port.description}</p>
        <table>
          <tr><td>Salinity</td><td>${port.salinity} ppt</td></tr>
          <tr><td>Temperature</td><td>${port.temperature} °C</td></tr>
          <tr><td>Turbidity</td><td>${port.turbidity} NTU</td></tr>
          <tr><td>Coral Reefs</td><td>${port.coralPresence ? '✅ Present' : '—'}</td></tr>
          <tr><td>Eco Sensitivity</td><td>${port.ecoSensitivity}/100</td></tr>
          <tr><td>Invasive Incidents</td><td>${port.invasiveIncidents}</td></tr>
          <tr><td>Native Vulnerability</td><td class="vuln-${vuln}">${vuln}</td></tr>
        </table>
      </div>`;
    }

    function drawRoute(portA, portB, riskScore) {
        clearRoute();

        // Update port markers
        if (portMarkers[portA.id]) map.removeLayer(portMarkers[portA.id]);
        if (portMarkers[portB.id]) map.removeLayer(portMarkers[portB.id]);

        portMarkers[portA.id] = L.marker([portA.lat, portA.lng], { icon: PORT_ICON_A })
            .bindPopup(portPopup(portA)).addTo(map);
        portMarkers[portB.id] = L.marker([portB.lat, portB.lng], { icon: PORT_ICON_B })
            .bindPopup(portPopup(portB)).addTo(map);

        const path = buildRoutePath(portA, portB);
        const color = routeColor(riskScore);

        // Glow layer (below)
        L.polyline(path, {
            color: color,
            weight: 6,
            opacity: 0.15,
            smoothFactor: 1
        }).addTo(map);

        // Main route line
        routeLayer = L.polyline(path, {
            color: color,
            weight: 3,
            opacity: 0.85,
            dashArray: '8 6',
            smoothFactor: 1
        }).addTo(map);

        // Animate ship along route
        animateShip(path);

        // Fit map bounds
        const group = L.featureGroup([portMarkers[portA.id], portMarkers[portB.id]]);
        map.fitBounds(group.getBounds().pad(0.3));
    }

    function animateShip(path) {
        if (shipMarker) map.removeLayer(shipMarker);
        shipMarker = L.marker(path[0], { icon: SHIP_ICON }).addTo(map);

        let idx = 0;
        function step() {
            if (idx >= path.length) idx = 0;
            shipMarker.setLatLng(path[idx]);
            idx++;
            animFrame = setTimeout(step, 80);
        }
        step();
    }

    function clearRoute() {
        if (routeLayer) { map.removeLayer(routeLayer); routeLayer = null; }
        if (shipMarker) { map.removeLayer(shipMarker); shipMarker = null; }
        if (animFrame) { clearTimeout(animFrame); animFrame = null; }

        // Remove glow layers
        map.eachLayer(layer => {
            if (layer instanceof L.Polyline && !(layer instanceof L.TileLayer)) {
                map.removeLayer(layer);
            }
        });

        // Reset port markers to default
        PORTS.forEach(port => {
            if (portMarkers[port.id]) map.removeLayer(portMarkers[port.id]);
            portMarkers[port.id] = L.marker([port.lat, port.lng], { icon: PORT_ICON_DEFAULT(port) })
                .bindPopup(portPopup(port)).addTo(map);
        });
    }

    function resize() {
        if (map) map.invalidateSize();
    }

    return { init, drawRoute, clearRoute, resize };
})();
