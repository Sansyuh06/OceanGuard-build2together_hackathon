# 🌊 OceanGuard
**Ecological Transition Intelligence Platform for Ballast Water Management**

[![Deploy to GitHub Pages](https://github.com/Sansyuh06/b2g-OceanGuard/actions/workflows/deploy.yml/badge.svg)](https://github.com/Sansyuh06/b2g-OceanGuard/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

> **Live Demo:** [https://sansyuh06.github.io/b2g-OceanGuard/](https://sansyuh06.github.io/b2g-OceanGuard/)

---

## 🌍 The Problem
Commercial shipping transfers **12 billion tonnes** of ballast water annually, moving thousands of invasive marine species across ecosystems. Current governance relies on single-vessel compliance checks, missing the cumulative ecological stress on trade corridors.

## 🚀 The Solution: OceanGuard
OceanGuard is a **network-level ecological intelligence platform** that shifts from reaction to prediction. It models biological compatibility, discharge risk, and treatment efficacy across entire maritime routes.

### Key Features
- **🗺️ Interactive Route Risk Map:** Visualizes great-circle routes with real-time risk assessment.
- **🦠 Organism Survival Simulation:** Predicts invasive species survival probability at destination ports.
- **🧪 Smart Treatment Advisory:** Recommends specific UV/Chemical treatment parameters based on biological load.
- **💳 Eco Credit System:** Incentivizes coral protection and safe discharge via behavioral economics.
- **🌊 Live Marine Data:** Integrates **Open-Meteo API** for real-time Sea Surface Temperature (SST), wave height, and ocean currents.

## 🛠️ Technology Stack
- **Frontend:** HTML5, CSS3 (Glassmorphism), Vanilla JavaScript (ES6+)
- **Mapping:** Leaflet.js with custom Sea Route engine
- **Data Pipeline:** Python + NOAA ERDDAP (WOA23) for oceanographic data
- **APIs:** Open-Meteo Marine API (Real-time), CartoDB (Basemaps)
- **Reporting:** jsPDF for instant compliance reports

## 📊 Data Sources (Real & Cited)
- **SST/Salinity:** NOAA World Ocean Atlas 2023 (WOA23)
- **Invasive Species:** IUCN Global Invasive Species Database (GISD) + Smithsonian NEMESIS
- **Treatment Effectiveness:** IMO MEPC.300(72) Type Approval Guidelines
- **Coral Reefs:** Allen Coral Atlas + NOAA Coral Reef Watch

## 📦 Deployment
This project naturally deploys to **GitHub Pages**.

1. Go to **Settings > Pages**
2. Select Source: **GitHub Actions**
3. Push to `master` to trigger deployment.

---
*Built for the Build2Together Hackathon 2026. Aligned with UN SDG 14: Life Below Water.*
