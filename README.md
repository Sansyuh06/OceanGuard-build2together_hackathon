# 🌊 OceanGuard
**Ecological Transition Intelligence Platform for Ballast Water Management**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

> OceanGuard is a practical, route-aware system built to help shipping operators, port planners, and regulators reduce the ecological harm of ballast water discharge.

---

## Problem Statement
Every day, merchant vessels unload and refill ballast water to maintain stability. That ballast water carries living organisms from one ocean region to another. When these organisms are released in a new environment, they can become invasive, damage fisheries, disrupt native ecosystems, and increase the cost of port operations.

Existing compliance systems focus on checking individual vessels at a single point in time. They do not answer a larger question: how does a route, a corridor, or a regional shipping network affect the biological and physical risk of a ballast discharge?

### Why this matters
- Invasive species introductions are one of the top threats to marine biodiversity.
- Ports are becoming warmer and saltier due to climate change, creating new survival pathways for non-native organisms.
- Treatment decisions are still often made without enough environmental context.

## Solution
OceanGuard combines route planning, environmental intelligence, and treatment advice into one dashboard.

It helps users:
- compare route risk between different origin-destination pairs
- estimate whether discharge conditions are favorable for organism survival
- suggest treatment intensity and timing based on actual marine data
- generate a clear compliance-focused report for each route

This makes ballast water management less reactive and more adaptive.

## What OceanGuard Does
- Visualizes sea routes and port connections on an interactive map
- Loads marine conditions and port compatibility data to estimate discharge risk
- Runs survival and treatment models based on route temperature, salinity, and destination port conditions
- Provides operational recommendations for safer ballast water handling
- Outputs a summary report that can support decision-making or regulatory review

## Tech Stack
- **Frontend:** HTML, CSS, and modern JavaScript
- **Mapping:** Leaflet.js for interactive route and port visualization
- **Data handling:** JavaScript modules for route scoring, treatment logic, marine API calls, and reporting
- **Static site hosting:** Built to run on a simple web server or GitHub Pages
- **Data pipeline:** Python scripts exist for oceanographic data collection and preprocessing

## How It Was Built
1. **Define the core use case** – determine what a ship operator and compliance officer need from a ballast-water route tool.
2. **Model risk factors** – use temperature, salinity, route duration, and known invasive species sensitivity to estimate survival risk.
3. **Build the map interface** – render routes, ports, and risk layers using Leaflet.
4. **Connect live data** – integrate Open-Meteo for current sea conditions and combine it with preloaded port and treatment datasets.
5. **Create outcome reports** – generate PDF-style summaries for operators and environmental stakeholders.

## Impact
OceanGuard is designed to help shipping and coastal management teams:
- make better discharge decisions before vessels arrive at their destination
- reduce the spread of invasive species by aligning treatment with actual ocean conditions
- support a more resilient maritime network through better route-level thinking
- lower long-term ecological and regulatory costs by acting earlier in the ballast process

## Quick Start
1. Open `index.html` in a browser or serve the project from a local web server.
2. Use the map to choose an origin and destination port.
3. Review the route risk, treatment advice, and generated report.

## Contribution Notes
- The project is intentionally built as a static web app for broad compatibility.
- Python scripts in `scripts/` support data collection, but the core user experience runs fully in the browser.

---

*Built for the Build2Together Hackathon 2026 with a focus on practical marine ecosystem protection.*
