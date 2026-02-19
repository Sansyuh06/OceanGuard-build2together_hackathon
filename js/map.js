// ============================================================
// OceanGuard – Leaflet Map & Sea Route Renderer
// ============================================================
// Realistic maritime routing: all routes follow actual sea lanes,
// avoiding land masses via mandatory choke points and waypoints.
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
    function greatCirclePoints(lat1, lng1, lat2, lng2, n = 60) {
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

    // ============================================================
    // MARITIME WAYPOINTS — Key choke points and sea-lane nodes
    // ============================================================
    const W = {
        // Strait of Gibraltar
        gibraltar: [36.00, -5.50],
        // Mediterranean
        medCentral: [35.50, 16.00],
        crete: [35.20, 24.50],
        // Suez Canal
        suezNorth: [31.27, 32.34],
        suezSouth: [29.95, 32.57],
        // Red Sea
        redSeaCentral: [20.50, 38.50],
        babElMandeb: [12.60, 43.40],
        // Gulf of Aden / Arabian Sea
        aden: [12.80, 45.00],
        arabianSea: [15.00, 58.00],
        // Strait of Hormuz / Persian Gulf
        hormuz: [26.56, 56.25],
        hormuzApproach: [24.50, 58.50],
        // Indian Ocean
        indianOceanW: [8.00, 60.00],
        indianOceanC: [5.00, 72.00],
        sriLankaSouth: [5.80, 80.20],
        // Bay of Bengal
        bayBengalW: [10.00, 80.50],
        bayBengalE: [8.00, 88.00],
        // Strait of Malacca
        malaccaNorth: [4.50, 98.50],
        malaccaSouth: [1.25, 103.60],
        // South China Sea
        southChinaSeaSW: [2.00, 106.00],
        southChinaSeaC: [8.00, 112.00],
        southChinaSeaNE: [18.00, 116.00],
        // East China Sea
        taiwanStrait: [24.00, 119.50],
        eastChinaSea: [28.00, 123.00],
        // Korea Strait / Sea of Japan
        koreaStrait: [34.00, 129.00],
        // Pacific — Japan approach
        japanPacific: [33.00, 137.00],
        // Cape of Good Hope
        goodHopeW: [-34.50, 17.50],
        goodHopeE: [-34.36, 20.00],
        // Mozambique Channel / East Africa
        mozambique: [-24.00, 36.00],
        eastAfrica: [-5.00, 42.00],
        // South Atlantic / Brazil
        southAtlanticW: [-25.00, -40.00],
        brazilNE: [-5.00, -34.50],
        brazilE: [-13.00, -37.00],
        brazilSE: [-22.00, -40.00],
        // North Atlantic
        northAtlanticE: [40.00, -10.00],
        bermuda: [32.00, -64.00],
        // US East Coast
        usEastCoast: [32.00, -78.00],
        // Caribbean
        caribbeanE: [15.00, -62.00],
        caribbeanW: [19.00, -76.00],
        caribbeanS: [12.00, -68.00],
        // Gulf of Mexico approach
        floridaStrait: [25.00, -80.50],
        gulfMexico: [27.50, -90.00],
        // Pacific — US West Coast
        pacificNE: [32.00, -120.00],
        pacificHawaii: [22.00, -155.00],
        pacificCentral: [15.00, 170.00],
        // Central America Pacific
        centralAmericaPac: [10.00, -90.00],
        // Australia approach
        torresStrait: [-10.50, 142.00],
        sydneyApproach: [-33.50, 152.50],
        // Panama Canal approach
        panamaCarib: [9.40, -79.90],
        panamaPacific: [8.90, -79.50],

        // English Channel / North Sea approach
        englishChannelDover: [51.0, 1.5],
        englishChannelLandsEnd: [49.5, -6.0],
        finisterre: [43.0, -10.0],

        // Sri Lanka East
        sriLankaEast: [7.0, 82.0],

        // Japan South Coast (to avoid land crossing)
        kyushuSouth: [30.50, 130.50],
        shikokuSouth: [31.50, 134.00],
        tokyoApproach: [34.50, 139.50],
    };

    // ============================================================
    // PORT REGION CLASSIFICATION
    // Assigns each port to a maritime sub-region for routing
    // ============================================================
    function getPortRegion(port) {
        const id = port.id;
        // Indian subcontinent - west coast
        if (id === 'mumbai') return 'india_west';
        // Indian subcontinent - east coast
        if (id === 'chennai') return 'india_east';
        // Persian Gulf / Middle East
        if (id === 'dubai') return 'persian_gulf';
        // Southeast Asia / Malacca
        if (id === 'singapore') return 'malacca';
        // East China Sea
        if (id === 'shanghai') return 'east_china_sea';
        // Korea
        if (id === 'busan') return 'korea';
        // Japan
        if (id === 'yokohama') return 'japan';
        // North Europe
        if (id === 'rotterdam' || id === 'hamburg') return 'north_europe';
        // US Gulf
        if (id === 'houston') return 'us_gulf';
        // US Pacific
        if (id === 'losangeles') return 'us_pacific';
        // South America Atlantic
        if (id === 'santos') return 'south_america_atlantic';
        // South Africa — Atlantic side
        if (id === 'capetown') return 'south_africa_west';
        // South Africa — Indian Ocean side
        if (id === 'durban') return 'south_africa_east';
        // Australia
        if (id === 'sydney') return 'australia';
        return 'unknown';
    }

    // ============================================================
    // ROUTE GRAPH — Defines waypoint sequences between regions
    // Each key pair defines the ordered sea-lane waypoints
    // ============================================================
    function getSeaLaneWaypoints(regionA, regionB, portA, portB) {
        // Normalize to ordered pair so we only need to define each route once
        const key = [regionA, regionB].sort().join('|');
        const reversed = regionA > regionB;

        const routes = {
            // ==== INDIA ↔ EAST ASIA (the user's exact bug) ====
            'east_china_sea|india_east': [
                W.bayBengalW, W.bayBengalE, W.malaccaNorth, W.malaccaSouth,
                W.southChinaSeaSW, W.southChinaSeaC, W.southChinaSeaNE,
                W.taiwanStrait, W.eastChinaSea
            ],
            'india_east|korea': [
                W.bayBengalW, W.bayBengalE, W.malaccaNorth, W.malaccaSouth,
                W.southChinaSeaSW, W.southChinaSeaC, W.southChinaSeaNE,
                W.taiwanStrait, W.eastChinaSea, W.koreaStrait
            ],
            'india_east|japan': [
                W.bayBengalW, W.bayBengalE, W.malaccaNorth, W.malaccaSouth,
                W.southChinaSeaSW, W.southChinaSeaC, W.southChinaSeaNE,
                W.taiwanStrait, W.eastChinaSea
            ],
            'india_east|malacca': [
                W.bayBengalW, W.bayBengalE, W.malaccaNorth
            ],
            'india_west|east_china_sea': [
                W.sriLankaSouth, W.bayBengalE, W.malaccaNorth, W.malaccaSouth,
                W.southChinaSeaSW, W.southChinaSeaC, W.southChinaSeaNE,
                W.taiwanStrait, W.eastChinaSea
            ],
            'india_west|korea': [
                W.sriLankaSouth, W.bayBengalE, W.malaccaNorth, W.malaccaSouth,
                W.southChinaSeaSW, W.southChinaSeaC, W.southChinaSeaNE,
                W.taiwanStrait, W.eastChinaSea, W.koreaStrait
            ],
            'india_west|japan': [
                W.sriLankaSouth, W.bayBengalE, W.malaccaNorth, W.malaccaSouth,
                W.southChinaSeaSW, W.southChinaSeaC, W.southChinaSeaNE,
                W.taiwanStrait, W.eastChinaSea
            ],
            'india_west|malacca': [
                W.sriLankaSouth, W.sriLankaEast, W.bayBengalE, W.malaccaNorth
            ],
            'india_east|india_west': [
                W.sriLankaSouth, W.sriLankaEast
            ],

            // ==== MALACCA (Singapore) ↔ EAST ASIA ====
            'east_china_sea|malacca': [
                W.southChinaSeaSW, W.southChinaSeaC, W.southChinaSeaNE,
                W.taiwanStrait, W.eastChinaSea
            ],
            'korea|malacca': [
                W.southChinaSeaSW, W.southChinaSeaC, W.southChinaSeaNE,
                W.taiwanStrait, W.eastChinaSea, W.koreaStrait
            ],
            'japan|malacca': [
                W.southChinaSeaSW, W.southChinaSeaC, W.southChinaSeaNE,
                W.taiwanStrait, W.eastChinaSea
            ],

            // ==== EAST ASIA internal ====
            'east_china_sea|korea': [W.eastChinaSea, W.koreaStrait],
            'east_china_sea|japan': [
                W.eastChinaSea, W.kyushuSouth, W.shikokuSouth,
                W.japanPacific, W.tokyoApproach
            ],
            'japan|korea': [
                W.koreaStrait, W.kyushuSouth, W.shikokuSouth,
                W.japanPacific, W.tokyoApproach
            ],

            // ==== PERSIAN GULF ↔ ASIA ====
            'india_east|persian_gulf': [
                W.sriLankaSouth, W.indianOceanC, W.indianOceanW,
                W.arabianSea, W.hormuzApproach, W.hormuz
            ],
            'india_west|persian_gulf': [
                W.arabianSea, W.hormuzApproach, W.hormuz
            ],
            'malacca|persian_gulf': [
                W.malaccaNorth, W.bayBengalE, W.sriLankaSouth,
                W.indianOceanC, W.indianOceanW, W.arabianSea,
                W.hormuzApproach, W.hormuz
            ],
            'east_china_sea|persian_gulf': [
                W.southChinaSeaNE, W.southChinaSeaC, W.southChinaSeaSW,
                W.malaccaSouth, W.malaccaNorth, W.bayBengalE, W.sriLankaSouth,
                W.indianOceanC, W.indianOceanW, W.arabianSea,
                W.hormuzApproach, W.hormuz
            ],
            'japan|persian_gulf': [
                W.eastChinaSea, W.taiwanStrait,
                W.southChinaSeaNE, W.southChinaSeaC, W.southChinaSeaSW,
                W.malaccaSouth, W.malaccaNorth, W.bayBengalE, W.sriLankaSouth,
                W.indianOceanC, W.indianOceanW, W.arabianSea,
                W.hormuzApproach, W.hormuz
            ],
            'korea|persian_gulf': [
                W.koreaStrait, W.eastChinaSea, W.taiwanStrait,
                W.southChinaSeaNE, W.southChinaSeaC, W.southChinaSeaSW,
                W.malaccaSouth, W.malaccaNorth, W.bayBengalE, W.sriLankaSouth,
                W.indianOceanC, W.indianOceanW, W.arabianSea,
                W.hormuzApproach, W.hormuz
            ],

            // ==== EUROPE ↔ ASIA (via Suez) ====
            'india_east|north_europe': [
                W.bayBengalW, W.sriLankaSouth, W.indianOceanC, W.indianOceanW,
                W.arabianSea, W.aden, W.babElMandeb, W.redSeaCentral,
                W.suezSouth, W.suezNorth, W.crete, W.medCentral, W.gibraltar,
                W.finisterre, W.englishChannelLandsEnd, W.englishChannelDover,
                W.northAtlanticE // treated as North Sea approach
            ],
            'india_west|north_europe': [
                W.arabianSea, W.aden, W.babElMandeb, W.redSeaCentral,
                W.suezSouth, W.suezNorth, W.crete, W.medCentral, W.gibraltar,
                W.finisterre, W.englishChannelLandsEnd, W.englishChannelDover,
                W.northAtlanticE
            ],
            'malacca|north_europe': [
                W.malaccaNorth, W.bayBengalE, W.sriLankaSouth,
                W.indianOceanC, W.indianOceanW, W.arabianSea,
                W.aden, W.babElMandeb, W.redSeaCentral,
                W.suezSouth, W.suezNorth, W.crete, W.medCentral, W.gibraltar,
                W.finisterre, W.englishChannelLandsEnd, W.englishChannelDover,
                W.northAtlanticE
            ],
            'east_china_sea|north_europe': [
                W.eastChinaSea, W.taiwanStrait,
                W.southChinaSeaNE, W.southChinaSeaC, W.southChinaSeaSW,
                W.malaccaSouth, W.malaccaNorth, W.bayBengalE, W.sriLankaSouth,
                W.indianOceanC, W.indianOceanW, W.arabianSea,
                W.aden, W.babElMandeb, W.redSeaCentral,
                W.suezSouth, W.suezNorth, W.crete, W.medCentral, W.gibraltar,
                W.finisterre, W.englishChannelLandsEnd, W.englishChannelDover,
                W.northAtlanticE
            ],
            'japan|north_europe': [
                W.eastChinaSea, W.taiwanStrait,
                W.southChinaSeaNE, W.southChinaSeaC, W.southChinaSeaSW,
                W.malaccaSouth, W.malaccaNorth, W.bayBengalE, W.sriLankaSouth,
                W.indianOceanC, W.indianOceanW, W.arabianSea,
                W.aden, W.babElMandeb, W.redSeaCentral,
                W.suezSouth, W.suezNorth, W.crete, W.medCentral, W.gibraltar,
                W.finisterre, W.englishChannelLandsEnd, W.englishChannelDover,
                W.northAtlanticE
            ],
            'korea|north_europe': [
                W.koreaStrait, W.eastChinaSea, W.taiwanStrait,
                W.southChinaSeaNE, W.southChinaSeaC, W.southChinaSeaSW,
                W.malaccaSouth, W.malaccaNorth, W.bayBengalE, W.sriLankaSouth,
                W.indianOceanC, W.indianOceanW, W.arabianSea,
                W.aden, W.babElMandeb, W.redSeaCentral,
                W.suezSouth, W.suezNorth, W.crete, W.medCentral, W.gibraltar,
                W.finisterre, W.englishChannelLandsEnd, W.englishChannelDover,
                W.northAtlanticE
            ],
            'north_europe|persian_gulf': [
                W.northAtlanticE, W.englishChannelDover, W.englishChannelLandsEnd,
                W.finisterre, W.gibraltar, W.medCentral, W.crete,
                W.suezNorth, W.suezSouth, W.redSeaCentral, W.babElMandeb,
                W.aden, W.arabianSea, W.hormuzApproach, W.hormuz
            ],

            // ==== EUROPE ↔ AFRICA ====
            'north_europe|south_africa_west': [
                W.northAtlanticE, W.englishChannelDover, W.englishChannelLandsEnd,
                W.finisterre, W.gibraltar, W.goodHopeW
            ],
            'north_europe|south_africa_east': [
                W.northAtlanticE, W.englishChannelDover, W.englishChannelLandsEnd,
                W.finisterre, W.gibraltar, W.goodHopeW, W.goodHopeE,
                W.mozambique
            ],

            // ==== ASIA ↔ AFRICA ====
            'india_west|south_africa_east': [
                W.indianOceanC, W.indianOceanW, W.eastAfrica, W.mozambique
            ],
            'india_east|south_africa_east': [
                W.sriLankaSouth, W.indianOceanC, W.indianOceanW,
                W.eastAfrica, W.mozambique
            ],
            'india_west|south_africa_west': [
                W.indianOceanC, W.indianOceanW, W.eastAfrica,
                W.mozambique, W.goodHopeE, W.goodHopeW
            ],
            'india_east|south_africa_west': [
                W.sriLankaSouth, W.indianOceanC, W.indianOceanW,
                W.eastAfrica, W.mozambique, W.goodHopeE, W.goodHopeW
            ],
            'malacca|south_africa_east': [
                W.malaccaNorth, W.bayBengalE, W.sriLankaSouth,
                W.indianOceanC, W.indianOceanW, W.eastAfrica, W.mozambique
            ],
            'malacca|south_africa_west': [
                W.malaccaNorth, W.bayBengalE, W.sriLankaSouth,
                W.indianOceanC, W.indianOceanW, W.eastAfrica,
                W.mozambique, W.goodHopeE, W.goodHopeW
            ],
            'persian_gulf|south_africa_east': [
                W.hormuz, W.hormuzApproach, W.arabianSea,
                W.indianOceanW, W.eastAfrica, W.mozambique
            ],
            'persian_gulf|south_africa_west': [
                W.hormuz, W.hormuzApproach, W.arabianSea,
                W.indianOceanW, W.eastAfrica, W.mozambique,
                W.goodHopeE, W.goodHopeW
            ],
            'south_africa_east|south_africa_west': [
                W.goodHopeE, W.goodHopeW
            ],

            // ==== AMERICAS ↔ EUROPE ====
            'north_europe|us_gulf': [
                W.northAtlanticE, W.englishChannelDover, W.englishChannelLandsEnd,
                W.finisterre,
                W.bermuda, W.usEastCoast,
                W.floridaStrait, W.gulfMexico
            ],
            'north_europe|south_america_atlantic': [
                W.northAtlanticE, W.englishChannelDover, W.englishChannelLandsEnd,
                W.finisterre,
                W.bermuda, W.caribbeanE,
                W.brazilNE, W.brazilE, W.brazilSE
            ],
            'north_europe|us_pacific': [
                W.northAtlanticE, W.englishChannelDover, W.englishChannelLandsEnd,
                W.finisterre,
                W.bermuda, W.usEastCoast,
                W.floridaStrait, W.panamaCarib, W.panamaPacific,
                W.pacificNE
            ],

            // ==== AMERICAS ↔ ASIA (via Pacific) ====
            'east_china_sea|us_pacific': [
                W.eastChinaSea, W.taiwanStrait, W.southChinaSeaNE,
                W.pacificCentral, W.pacificHawaii, W.pacificNE
            ],
            'japan|us_pacific': [
                W.japanPacific, W.pacificHawaii, W.pacificNE
            ],
            'korea|us_pacific': [
                W.koreaStrait, W.japanPacific, W.pacificHawaii, W.pacificNE
            ],
            'malacca|us_pacific': [
                W.southChinaSeaSW, W.southChinaSeaC, W.southChinaSeaNE,
                W.taiwanStrait, W.eastChinaSea, W.japanPacific,
                W.pacificHawaii, W.pacificNE
            ],
            'india_west|us_pacific': [
                W.sriLankaSouth, W.bayBengalE, W.malaccaNorth, W.malaccaSouth,
                W.southChinaSeaSW, W.southChinaSeaC, W.southChinaSeaNE,
                W.taiwanStrait, W.eastChinaSea, W.japanPacific,
                W.pacificHawaii, W.pacificNE
            ],
            'india_east|us_pacific': [
                W.bayBengalW, W.bayBengalE, W.malaccaNorth, W.malaccaSouth,
                W.southChinaSeaSW, W.southChinaSeaC, W.southChinaSeaNE,
                W.taiwanStrait, W.eastChinaSea, W.japanPacific,
                W.pacificHawaii, W.pacificNE
            ],
            'persian_gulf|us_pacific': [
                W.hormuz, W.hormuzApproach, W.arabianSea, W.indianOceanW,
                W.indianOceanC, W.sriLankaSouth, W.bayBengalE,
                W.malaccaNorth, W.malaccaSouth, W.southChinaSeaSW,
                W.southChinaSeaC, W.southChinaSeaNE, W.taiwanStrait,
                W.eastChinaSea, W.japanPacific, W.pacificHawaii, W.pacificNE
            ],

            // ==== AMERICAS ↔ ASIA (via Atlantic/Suez/Indian for US Gulf) ====
            'east_china_sea|us_gulf': [
                W.eastChinaSea, W.taiwanStrait,
                W.southChinaSeaNE, W.southChinaSeaC, W.southChinaSeaSW,
                W.malaccaSouth, W.malaccaNorth, W.bayBengalE, W.sriLankaSouth,
                W.indianOceanC, W.indianOceanW, W.arabianSea,
                W.aden, W.babElMandeb, W.redSeaCentral,
                W.suezSouth, W.suezNorth, W.crete, W.medCentral, W.gibraltar,
                W.northAtlanticE, W.floridaStrait, W.gulfMexico
            ],
            'india_east|us_gulf': [
                W.sriLankaSouth, W.indianOceanC, W.indianOceanW,
                W.arabianSea, W.aden, W.babElMandeb, W.redSeaCentral,
                W.suezSouth, W.suezNorth, W.crete, W.medCentral, W.gibraltar,
                W.northAtlanticE, W.floridaStrait, W.gulfMexico
            ],
            'india_west|us_gulf': [
                W.arabianSea, W.aden, W.babElMandeb, W.redSeaCentral,
                W.suezSouth, W.suezNorth, W.crete, W.medCentral, W.gibraltar,
                W.northAtlanticE, W.floridaStrait, W.gulfMexico
            ],
            'malacca|us_gulf': [
                W.malaccaNorth, W.bayBengalE, W.sriLankaSouth,
                W.indianOceanC, W.indianOceanW, W.arabianSea,
                W.aden, W.babElMandeb, W.redSeaCentral,
                W.suezSouth, W.suezNorth, W.crete, W.medCentral, W.gibraltar,
                W.northAtlanticE, W.floridaStrait, W.gulfMexico
            ],
            'persian_gulf|us_gulf': [
                W.hormuz, W.hormuzApproach, W.arabianSea,
                W.aden, W.babElMandeb, W.redSeaCentral,
                W.suezSouth, W.suezNorth, W.crete, W.medCentral, W.gibraltar,
                W.northAtlanticE, W.floridaStrait, W.gulfMexico
            ],

            // ==== SOUTH AMERICA ↔ US ====
            'south_america_atlantic|us_gulf': [
                W.brazilSE, W.brazilE, W.brazilNE,
                W.caribbeanS, W.caribbeanW, W.floridaStrait, W.gulfMexico
            ],
            'south_america_atlantic|us_pacific': [
                W.brazilSE, W.brazilE, W.brazilNE,
                W.caribbeanS, W.caribbeanW,
                W.panamaCarib, W.panamaPacific,
                W.centralAmericaPac, W.pacificNE
            ],
            'south_america_atlantic|south_africa_west': [
                W.brazilSE, W.brazilE, W.brazilNE, W.southAtlanticW,
                W.goodHopeW
            ],
            'south_america_atlantic|south_africa_east': [
                W.brazilSE, W.brazilE, W.brazilNE, W.southAtlanticW,
                W.goodHopeW, W.goodHopeE, W.mozambique
            ],
            'east_china_sea|south_america_atlantic': [
                W.eastChinaSea, W.taiwanStrait, W.southChinaSeaNE,
                W.southChinaSeaC, W.southChinaSeaSW, W.malaccaSouth,
                W.malaccaNorth, W.bayBengalE, W.sriLankaSouth,
                W.indianOceanC, W.indianOceanW, W.eastAfrica,
                W.mozambique, W.goodHopeE, W.goodHopeW, W.southAtlanticW,
                W.brazilNE, W.brazilE, W.brazilSE
            ],
            'india_east|south_america_atlantic': [
                W.sriLankaSouth, W.indianOceanC, W.indianOceanW,
                W.eastAfrica, W.mozambique, W.goodHopeE, W.goodHopeW,
                W.southAtlanticW, W.brazilNE, W.brazilE, W.brazilSE
            ],
            'india_west|south_america_atlantic': [
                W.indianOceanC, W.indianOceanW, W.eastAfrica,
                W.mozambique, W.goodHopeE, W.goodHopeW, W.southAtlanticW,
                W.brazilNE, W.brazilE, W.brazilSE
            ],
            'malacca|south_america_atlantic': [
                W.malaccaNorth, W.bayBengalE, W.sriLankaSouth,
                W.indianOceanC, W.indianOceanW, W.eastAfrica,
                W.mozambique, W.goodHopeE, W.goodHopeW, W.southAtlanticW,
                W.brazilNE, W.brazilE, W.brazilSE
            ],

            // ==== AUSTRALIA ====
            'australia|malacca': [
                W.torresStrait, W.southChinaSeaC, W.southChinaSeaSW
            ],
            'australia|east_china_sea': [
                W.torresStrait, W.southChinaSeaC, W.southChinaSeaNE,
                W.taiwanStrait, W.eastChinaSea
            ],
            'australia|japan': [
                W.torresStrait, W.southChinaSeaC, W.southChinaSeaNE,
                W.taiwanStrait, W.eastChinaSea
            ],
            'australia|korea': [
                W.torresStrait, W.southChinaSeaC, W.southChinaSeaNE,
                W.taiwanStrait, W.eastChinaSea, W.koreaStrait
            ],
            'australia|india_east': [
                W.torresStrait, W.southChinaSeaC, W.southChinaSeaSW,
                W.malaccaSouth, W.malaccaNorth, W.bayBengalE, W.bayBengalW
            ],
            'australia|india_west': [
                W.torresStrait, W.southChinaSeaC, W.southChinaSeaSW,
                W.malaccaSouth, W.malaccaNorth, W.bayBengalE,
                W.sriLankaSouth
            ],
            'australia|persian_gulf': [
                W.torresStrait, W.southChinaSeaC, W.southChinaSeaSW,
                W.malaccaSouth, W.malaccaNorth, W.bayBengalE,
                W.sriLankaSouth, W.indianOceanC, W.indianOceanW,
                W.arabianSea, W.hormuzApproach, W.hormuz
            ],
            'australia|north_europe': [
                W.torresStrait, W.southChinaSeaC, W.southChinaSeaSW,
                W.malaccaSouth, W.malaccaNorth, W.bayBengalE,
                W.sriLankaSouth, W.indianOceanC, W.indianOceanW,
                W.arabianSea, W.aden, W.babElMandeb, W.redSeaCentral,
                W.suezSouth, W.suezNorth, W.crete, W.medCentral,
                W.gibraltar, W.finisterre, W.englishChannelLandsEnd, W.englishChannelDover,
                W.northAtlanticE
            ],
            'australia|south_africa_east': [
                W.sydneyApproach, W.goodHopeE, W.mozambique
            ],
            'australia|south_africa_west': [
                W.sydneyApproach, W.goodHopeE, W.goodHopeW
            ],
            'australia|us_pacific': [
                W.sydneyApproach, W.pacificCentral, W.pacificHawaii, W.pacificNE
            ],

            // ==== AUSTRALIA (Extended) ====
            'australia|us_gulf': [
                W.sydneyApproach, W.pacificCentral, W.pacificHawaii, W.pacificNE,
                W.centralAmericaPac, W.panamaPacific, W.panamaCarib,
                W.caribbeanW, W.floridaStrait, W.gulfMexico
            ],
            'australia|south_america_atlantic': [
                W.sydneyApproach, W.goodHopeE, W.goodHopeW, W.southAtlanticW,
                W.brazilSE
            ],

            // ==== AFRICA ↔ AMERICAS ====
            'south_africa_west|us_gulf': [
                W.goodHopeW, W.southAtlanticW, W.brazilNE,
                W.caribbeanS, W.caribbeanW, W.floridaStrait, W.gulfMexico
            ],
            'south_africa_east|us_gulf': [
                W.mozambique, W.goodHopeE, W.goodHopeW, W.southAtlanticW,
                W.brazilNE, W.caribbeanS, W.caribbeanW,
                W.floridaStrait, W.gulfMexico
            ],
            'south_africa_west|us_pacific': [
                W.goodHopeW, W.southAtlanticW, W.brazilNE,
                W.caribbeanS, W.caribbeanW,
                W.panamaCarib, W.panamaPacific,
                W.centralAmericaPac, W.pacificNE
            ],
            'south_africa_east|us_pacific': [
                W.mozambique, W.goodHopeE, W.goodHopeW, W.southAtlanticW,
                W.brazilNE, W.caribbeanS, W.caribbeanW,
                W.panamaCarib, W.panamaPacific,
                W.centralAmericaPac, W.pacificNE
            ],

            // ==== US Gulf ↔ US Pacific ====
            'us_gulf|us_pacific': [
                W.gulfMexico, W.floridaStrait, W.caribbeanW,
                W.panamaCarib, W.panamaPacific,
                W.centralAmericaPac, W.pacificNE
            ],

            // ==== East Asia ↔ Africa (via Indian Ocean) ====
            'east_china_sea|south_africa_east': [
                W.eastChinaSea, W.taiwanStrait, W.southChinaSeaNE,
                W.southChinaSeaC, W.southChinaSeaSW, W.malaccaSouth,
                W.malaccaNorth, W.bayBengalE, W.sriLankaSouth,
                W.indianOceanC, W.indianOceanW, W.eastAfrica, W.mozambique
            ],
            'east_china_sea|south_africa_west': [
                W.eastChinaSea, W.taiwanStrait, W.southChinaSeaNE,
                W.southChinaSeaC, W.southChinaSeaSW, W.malaccaSouth,
                W.malaccaNorth, W.bayBengalE, W.sriLankaSouth,
                W.indianOceanC, W.indianOceanW, W.eastAfrica,
                W.mozambique, W.goodHopeE, W.goodHopeW
            ],
            'japan|south_africa_east': [
                W.eastChinaSea, W.taiwanStrait, W.southChinaSeaNE,
                W.southChinaSeaC, W.southChinaSeaSW, W.malaccaSouth,
                W.malaccaNorth, W.bayBengalE, W.sriLankaSouth,
                W.indianOceanC, W.indianOceanW, W.eastAfrica, W.mozambique
            ],
            'korea|south_africa_east': [
                W.koreaStrait, W.eastChinaSea, W.taiwanStrait,
                W.southChinaSeaNE, W.southChinaSeaC, W.southChinaSeaSW,
                W.malaccaSouth, W.malaccaNorth, W.bayBengalE, W.sriLankaSouth,
                W.indianOceanC, W.indianOceanW, W.eastAfrica, W.mozambique
            ],
            'japan|south_africa_west': [
                W.eastChinaSea, W.taiwanStrait, W.southChinaSeaNE,
                W.southChinaSeaC, W.southChinaSeaSW, W.malaccaSouth,
                W.malaccaNorth, W.bayBengalE, W.sriLankaSouth,
                W.indianOceanC, W.indianOceanW, W.eastAfrica,
                W.mozambique, W.goodHopeE, W.goodHopeW
            ],
            'korea|south_africa_west': [
                W.koreaStrait, W.eastChinaSea, W.taiwanStrait,
                W.southChinaSeaNE, W.southChinaSeaC, W.southChinaSeaSW,
                W.malaccaSouth, W.malaccaNorth, W.bayBengalE, W.sriLankaSouth,
                W.indianOceanC, W.indianOceanW, W.eastAfrica,
                W.mozambique, W.goodHopeE, W.goodHopeW
            ],
            // Missing South America links for East Asia
            'japan|south_america_atlantic': [
                W.eastChinaSea, W.taiwanStrait, W.southChinaSeaNE,
                W.southChinaSeaC, W.southChinaSeaSW, W.malaccaSouth,
                W.malaccaNorth, W.bayBengalE, W.sriLankaSouth,
                W.indianOceanC, W.indianOceanW, W.eastAfrica,
                W.mozambique, W.goodHopeE, W.goodHopeW, W.southAtlanticW,
                W.brazilNE, W.brazilE, W.brazilSE
            ],
            'korea|south_america_atlantic': [
                W.koreaStrait, W.eastChinaSea, W.taiwanStrait,
                W.southChinaSeaNE, W.southChinaSeaC, W.southChinaSeaSW,
                W.malaccaSouth, W.malaccaNorth, W.bayBengalE, W.sriLankaSouth,
                W.indianOceanC, W.indianOceanW, W.eastAfrica,
                W.mozambique, W.goodHopeE, W.goodHopeW, W.southAtlanticW,
                W.brazilNE, W.brazilE, W.brazilSE
            ],
        };

        let waypoints = routes[key] || [];

        // If no defined route, return empty (the system will use great circle as fallback)
        if (!waypoints.length) return [];

        // If the pair was defined in opposite order, reverse the waypoints
        if (reversed) {
            waypoints = [...waypoints].reverse();
        }

        return waypoints;
    }

    // ----- Build full route path through waypoints -----
    function buildRoutePath(portA, portB) {
        const regionA = getPortRegion(portA);
        const regionB = getPortRegion(portB);

        const waypoints = getSeaLaneWaypoints(regionA, regionB, portA, portB);
        const allPoints = [
            [portA.lat, portA.lng],
            ...waypoints,
            [portB.lat, portB.lng]
        ];

        let fullPath = [];
        for (let i = 0; i < allPoints.length - 1; i++) {
            const seg = greatCirclePoints(
                allPoints[i][0], allPoints[i][1],
                allPoints[i + 1][0], allPoints[i + 1][1], 30
            );
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

        // Glow layer
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

        // Animate ship
        animateShip(path);

        // Fit bounds to see full route
        map.fitBounds(L.latLngBounds(path).pad(0.15));
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

        map.eachLayer(layer => {
            if (layer instanceof L.Polyline && !(layer instanceof L.TileLayer)) {
                map.removeLayer(layer);
            }
        });

        PORTS.forEach(port => {
            if (portMarkers[port.id]) map.removeLayer(portMarkers[port.id]);
            portMarkers[port.id] = L.marker([port.lat, port.lng], { icon: PORT_ICON_DEFAULT(port) })
                .bindPopup(portPopup(port)).addTo(map);
        });
    }

    function resize() {
        if (map) map.invalidateSize();
    }

    return { init, drawRoute, clearRoute, resize, getRoutePath: buildRoutePath, getMap: () => map };
})();
