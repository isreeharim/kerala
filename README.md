# 🌴 Kerala Horizons | 3D Open-World Exploration Game

A high-performance 3D open-world exploration game set in Kerala ("God's Own Country"), built with **Three.js**, **Vite**, **TypeScript**, and **Rapier3D Physics** using open geographic data derived from **OpenStreetMap (OSM)** and open elevation profiles.

---

## 🗺️ Open Geographic Data Architecture

Kerala Horizons turns real-world geographic data into an optimized, continuous 3D game environment without using proprietary map tiles or imagery.

### 1. Geographic Data Pipeline & Separation
All geographic data files are maintained separately from the rendering engine under `data/`:

```text
openworld/
├── data/
│   ├── roads/kerala_roads.json           # Categorized OSM road splines (Highways, Hill roads, Village links)
│   ├── buildings/kerala_buildings.json   # OSM building footprints & landmark anchors
│   ├── waterways/kerala_waterways.json   # Backwater canal & river vectors
│   └── terrain/kerala_elevation.json     # Continuous regional elevation metadata
```

### 2. Geographic Projection
`src/world/MapDataLoader.ts` projects spherical GPS coordinates $(\text{latitude}, \text{longitude})$ into local game coordinates $(x, z)$ in meters centered at a configurable origin:

```ts
export const WORLD_CONFIG = {
  region: "Kerala",
  center: {
    lat: 10.0889,
    lon: 76.2711
  },
  worldSizeKm: 20
};
```

### 3. Open Datasets, Conversion & Attribution
- **OpenStreetMap Data**:
  - Source: [OpenStreetMap](https://www.openstreetmap.org) / [Overpass Turbo](https://overpass-turbo.eu/)
  - License: Open Data Commons Open Database License (ODbL) by the OpenStreetMap Foundation (OSMF).
  - Attribution: *© OpenStreetMap contributors*.
  - Export query format: GeoJSON (extracting tags `highway=*`, `waterway=*`, `building=*` within Kerala bounding box `[76.20, 9.95, 76.35, 10.15]`).
- **Elevation Data**:
  - Derived from open public domain DEM (Digital Elevation Model) profiles matching the continuous elevation gradient from coastal Alappuzha ($0-4\text{m}$) through village plains ($5-16\text{m}$) up into the Munnar Western Ghats ($18-85\text{m}$).
- **No Google Maps/Earth Data**: No proprietary Google Maps tiles, imagery, or 3D photogrammetry are used.

---

## 🎮 Controls

| Key | Action | Description |
| :--- | :--- | :--- |
| **W, A, S, D** / Arrows | Move / Steer | Walk on foot, steer bike or car |
| **Shift** | Sprint / Turbo | Sprint on foot, high-speed acceleration on vehicles |
| **Space** | Jump / Handbrake | Jump on foot, sharp handbrake when driving |
| **F** | Mount / Dismount | Enter/Exit the Classic Motorcycle or Vintage Car |
| **M** | World Map | Open/Close full-screen Kerala State Atlas & Fast Travel |
| **C** | Camera Mode | Cycle between Third-Person Close, Far Chase, and Cockpit view |
| **H** | Horn | Authentic Kerala vehicle horn (Pip-pip / Dual-tone Honk) |
| **L** | Headlight | Toggle high-beam illumination |
| **R** | Reset Vehicle | Right vehicle if overturned |
| **Mouse** | 360° Look | Look around and orbit camera smoothly |

### 📱 Mobile & Touch Controls

The game features automatic mobile device and touch screen detection:

* **Virtual Analog Joystick (Bottom-Left)**: Smooth thumb navigation to walk, steer, accelerate, and reverse.
* **Touch Look (Right Half of Screen)**: Swipe across the screen to orbit the 360° camera freely without pointer lock.
* **Pinch to Zoom**: Two-finger pinch gesture to cycle camera perspective.
* **Contextual Action Buttons (Bottom-Right)**:
  - **RIDE / DRIVE / DISMOUNT**: Large tactile button that pulses when near a vehicle or seated.
  - **JUMP / HANDBRAKE**: Jump on foot, or sharp drift brake when driving.
  - **SPRINT / TURBO**: Boost speed on foot or high-velocity throttle in vehicles.
* **Quick Pill Toolbar (Top-Right)**: One-tap buttons for Camera View (`VIEW`), Horn (`HORN`), Headlights (`LIGHT`), Vehicle Reset (`RESET`), and Fullscreen (`FULL`).
* **Responsive Layout**: Adapts automatically to phone portrait and landscape screens with notch/safe-area support (`env(safe-area-inset)`).

---

## 🌴 World Regions (Continuous Environment)

1. **Alappuzha / Backwaters (South)**
   - Coastal lowlands, coconut groves (*Thengu*), emerald backwater canal with animated wave shader.
   - Traditional *Kettuvallam* houseboats with woven bamboo canopies.
   - Concrete & timber bridge connecting coast to central Kerala.

2. **Heritage Village & Town Square (Central)**
   - Traditional Kerala *Tharavadu* houses with terracotta tiled hip roofs and wooden verandah columns.
   - Roadside *Thattukada* (Kerala evening tea stall) with steel tea samovar and hot snacks (*Pazham Pori*).
   - *KSRTC* bus waiting shelter and sacred Banyan tree on a raised stone *Aalthara* platform.
   - Roadside utility poles and milestone boards.

3. **Munnar / Western Ghats (North)**
   - Steep mountain slopes climbing up to $85\text{m}$ elevation with atmospheric mountain mist.
   - Winding *Ghat Road* with challenging hairpin curves.
   - Contoured hillside terraces covered in hundreds of tea bushes.
   - Top Station mountain viewpoint shelter.

---

## 🚀 Running the Project

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Open `http://localhost:3000` in your web browser.
