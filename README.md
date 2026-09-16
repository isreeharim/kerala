# 🏛️ Manjeri 3D Open-World Explorer | Malappuram, Kerala

A high-performance 3D open-world exploration game recreating **Manjeri Municipality** in the **Malappuram District of Kerala**, built with **Three.js**, **Vite**, **TypeScript**, and **Rapier3D Physics** using open geographic data derived from **OpenStreetMap (OSM)** and open elevation profiles.

---

## 🗺️ Open Geographic Data Architecture

Manjeri Open World turns real-world geographic data into an optimized, continuous 3D game environment without using proprietary map tiles or imagery.

### 1. Geographic Data Pipeline & Separation
All geographic data files are maintained separately from the rendering engine under `data/`:

```text
openworld/
├── data/
│   ├── roads/kerala_roads.json           # Categorized OSM road splines (Calicut Rd SH28, Nilambur Rd, Pandikkad Rd, Malappuram Rd SH71, Court Rd)
│   ├── buildings/kerala_buildings.json   # Real Manjeri building anchors (District Court, Medical College, IGBT Bus Terminal, Old Bus Stand, Masjid, Temple)
│   ├── waterways/kerala_waterways.json   # Cherupuzha / Kadalundi River tributary
│   └── terrain/kerala_elevation.json     # Continuous regional elevation metadata (Valley 30m -> Hills 78m)
```

### 2. Geographic Projection
`src/world/MapDataLoader.ts` projects spherical GPS coordinates $(\text{latitude}, \text{longitude})$ into local game coordinates $(x, z)$ in meters centered at Kacherippadi junction:

```ts
export const WORLD_CONFIG = {
  region: "Manjeri, Malappuram",
  center: {
    lat: 11.1200,
    lon: 76.1200
  },
  worldSizeKm: 5
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

## 🏛️ Manjeri Localities & Major Landmarks

1. **Kacherippadi Town Center & Junction (Center)**
   - The bustling heart of Manjeri where SH 28 (Calicut Road), Nilambur Road, Pandikkad Road, and SH 71 converge.
   - Traditional *Aalthara* banyan tree, KSRTC passenger shelter, and evening *Thattukada* tea stalls.
   - Multi-story commercial streetfront shopping plazas.

2. **Court Road & Judicial Complex (South-East Plateau)**
   - Colonial & Kerala-style District & Sessions Court Complex with majestic portico pillars, pediment, and flagpole.
   - Manjeri Head Post Office and advocate office avenues.

3. **Melakkam & Govt. Medical College Hospital (North-West Ridge)**
   - High-altitude ridge overlooking the town, home to the sprawling Government Medical College Hospital Manjeri.
   - Dedicated Emergency / Trauma care entrance canopy, patient ward wings, and hilltop residential villas.

4. **Indira Gandhi Bus Terminal (New Bus Stand) & Old Bus Stand**
   - Modern IGBT transport hub with wide concourse canopy and parked KSRTC buses.
   - Historic Old Bus Stand commercial arcade with lively fruit, textile, and spice markets.

5. **Historic Cultural Heritage**
   - Historic Manjeri Town Juma Masjid featuring dual minarets and central emerald dome.
   - Karnakkaparambu Temple with granite *Chuttambalam*, copper-toned *Sreekovil*, and brass *Deepastambham*.

6. **Cherupuzha River & Anakkayam Bridge (South)**
   - Kadalundi River tributary lowlands with coconut groves, sandy riverbanks, and concrete bridge crossing on SH 71.

7. **Vettekkode Scenic Hills (East)**
   - Elevated laterite hill summit ($78\text{m}$) offering panoramic views of the entire Manjeri valley.

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
