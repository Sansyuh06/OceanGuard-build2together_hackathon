// ============================================================
// OceanGuard – Live Traffic Simulation Engine
// Simulates real-time cargo vessel movements based on verified shipping lanes.
// ============================================================

const TrafficEngine = (() => {
    let ships = [];
    let isRunning = false;
    let mapInstance = null;
    let updateInterval = null;

    const SHIP_TYPES = [
        { type: 'Container', color: '#3b82f6', speed: 0.8 }, // Blue
        { type: 'Tanker', color: '#ef4444', speed: 0.6 },    // Red
        { type: 'Bulk Carrier', color: '#10b981', speed: 0.5 } // Green
    ];

    function init() {
        console.log('Initializing Traffic Engine...');
        mapInstance = MapEngine.getMap();
        if (!mapInstance) {
            console.error('MapEngine not ready for Traffic.');
            return;
        }
        spawnShips(60); // Spawn 60 ships
        startHidingMonitor(); // Optional: Logic to auto-hide? No, manual control better.
        start();
    }

    function spawnShips(count) {
        if (!PORTS || PORTS.length < 2) return;

        for (let i = 0; i < count; i++) {
            // Pick random start/end ports
            const startPort = PORTS[Math.floor(Math.random() * PORTS.length)];
            let endPort = PORTS[Math.floor(Math.random() * PORTS.length)];
            while (startPort.id === endPort.id) {
                endPort = PORTS[Math.floor(Math.random() * PORTS.length)];
            }

            // Get route path
            const path = MapEngine.getRoutePath(startPort, endPort);
            if (!path || path.length < 2) continue;

            const type = SHIP_TYPES[Math.floor(Math.random() * SHIP_TYPES.length)];
            const progress = Math.random(); // Start at random point along path

            const ship = {
                id: `ship-${i}`,
                type: type,
                path: path,
                progress: progress,
                marker: null
            };

            createMarker(ship);
            ships.push(ship);
        }
    }

    function createMarker(ship) {
        if (!mapInstance) return;

        // Calculate position based on progress
        const totalPoints = ship.path.length;
        const index = Math.floor(ship.progress * (totalPoints - 1));
        const pos = ship.path[index];

        const icon = L.divIcon({
            className: 'traffic-ship-icon',
            html: `<div style="
                width: 8px; 
                height: 8px; 
                background-color: ${ship.type.color}; 
                border-radius: 50%; 
                border: 1px solid white;
                box-shadow: 0 0 4px ${ship.type.color};"></div>`,
            iconSize: [8, 8],
            iconAnchor: [4, 4]
        });

        ship.marker = L.marker(pos, { icon: icon, opacity: 0.8 })
            .bindPopup(`<b>${ship.type.type} Vessel</b><br>Speed: ${(12 + Math.random() * 8).toFixed(1)} kn<br>Status: Underway`)
            .addTo(mapInstance);
    }

    function update() {
        if (!isRunning) return;

        ships.forEach(ship => {
            if (!ship.path || ship.path.length < 2) return;

            // Advance progress
            // Speed factor: 0.0005 to 0.002 depending on path length?
            // Actually paths vary in length (points). 
            // Better to move by index or percentage relative to path length.
            const speed = 0.001 * ship.type.speed;
            ship.progress += speed;

            if (ship.progress >= 1) {
                ship.progress = 0; // Loop or respawn? Loop is easier.
                // Optionally pick new random route?
                // For smoother demo, just loop on same verified route.
            }

            const totalPoints = ship.path.length;
            const exactIndex = ship.progress * (totalPoints - 1);
            const idx = Math.floor(exactIndex);
            const nextIdx = Math.min(idx + 1, totalPoints - 1);
            const ratio = exactIndex - idx;

            // Interpolate
            const p1 = ship.path[idx];
            const p2 = ship.path[nextIdx];

            // Simple linear interpolation
            const lat = p1[0] + (p2[0] - p1[0]) * ratio;
            const lng = p1[1] + (p2[1] - p1[1]) * ratio;

            if (ship.marker) {
                ship.marker.setLatLng([lat, lng]);
            }
        });
    }

    function start() {
        if (isRunning) return;
        isRunning = true;
        ships.forEach(s => {
            if (s.marker && mapInstance) s.marker.addTo(mapInstance);
        });
        updateInterval = setInterval(update, 50); // 20FPS

        // Show simulation indicator
        const indicator = document.getElementById('live-traffic-indicator');
        if (indicator) indicator.style.display = 'block';
    }

    function stop() {
        isRunning = false;
        if (updateInterval) clearInterval(updateInterval);
        ships.forEach(s => {
            if (s.marker && mapInstance) mapInstance.removeLayer(s.marker);
        });

        // Hide indicator
        const indicator = document.getElementById('live-traffic-indicator');
        if (indicator) indicator.style.display = 'none';
    }

    return { init, start, stop };
})();
