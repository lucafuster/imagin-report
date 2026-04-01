"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import Map, { Layer, Source, Marker } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

/* ================================================
   Mock Data — Signalements
   ================================================ */
interface Signalement {
  id: string;
  category: string;
  description: string;
  lat: number;
  lng: number;
  status: "nouveau" | "en_cours" | "resolu";
  date: string;
  severity: "low" | "medium" | "high";
}

const MOCK_SIGNALEMENTS: Signalement[] = [
  { id: "S-001", category: "Voirie", description: "Nid de poule profond angle rue Jean Jaurès / Av. Darblay", lat: 48.6145, lng: 2.4835, status: "nouveau", date: "2026-03-31", severity: "high" },
  { id: "S-002", category: "Propreté", description: "Dépôt sauvage de gravats près du parc Robinson", lat: 48.6120, lng: 2.4790, status: "en_cours", date: "2026-03-30", severity: "medium" },
  { id: "S-003", category: "Éclairage", description: "Lampadaire éteint depuis 2 semaines, rue Widmer", lat: 48.6160, lng: 2.4850, status: "nouveau", date: "2026-03-29", severity: "medium" },
  { id: "S-004", category: "Nuisances", description: "Nuisances sonores nocturnes récurrentes, quartier Tarterêts", lat: 48.6100, lng: 2.4900, status: "en_cours", date: "2026-03-28", severity: "low" },
  { id: "S-005", category: "Voirie", description: "Fissure importante chaussée bd Jean Jaurès", lat: 48.6155, lng: 2.4810, status: "resolu", date: "2026-03-27", severity: "high" },
  { id: "S-006", category: "Espaces Verts", description: "Arbre tombé bloquant le trottoir, allée des Platanes", lat: 48.6132, lng: 2.4870, status: "nouveau", date: "2026-03-31", severity: "high" },
  { id: "S-007", category: "Propreté", description: "Poubelles débordantes près de la gare", lat: 48.6140, lng: 2.4760, status: "en_cours", date: "2026-03-30", severity: "medium" },
  { id: "S-008", category: "Stationnement", description: "Véhicule abandonné depuis 3 mois, rue Champlouis", lat: 48.6170, lng: 2.4820, status: "nouveau", date: "2026-03-31", severity: "low" },
];

/* ================================================
   Heatmap GeoJSON data
   ================================================ */
const generateHeatmapData = (type: string) => {
  const basePoints = [
    { lat: 48.6145, lng: 2.4835, v: 0.9 },
    { lat: 48.6120, lng: 2.4790, v: 0.7 },
    { lat: 48.6160, lng: 2.4850, v: 0.6 },
    { lat: 48.6100, lng: 2.4900, v: 0.8 },
    { lat: 48.6155, lng: 2.4810, v: 0.5 },
    { lat: 48.6132, lng: 2.4870, v: 0.9 },
    { lat: 48.6140, lng: 2.4760, v: 0.4 },
    { lat: 48.6170, lng: 2.4820, v: 0.3 },
    { lat: 48.6110, lng: 2.4830, v: 0.6 },
    { lat: 48.6135, lng: 2.4780, v: 0.7 },
    { lat: 48.6148, lng: 2.4890, v: 0.5 },
    { lat: 48.6125, lng: 2.4860, v: 0.8 },
  ];

  // Vary intensity based on type
  const multiplier = type === "vitesse" ? 1.0 : type === "proprete" ? 0.8 : 0.6;

  return {
    type: "FeatureCollection" as const,
    features: basePoints.map((p, i) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [p.lng + (Math.sin(i * 1.5) * 0.002), p.lat + (Math.cos(i * 1.2) * 0.001)],
      },
      properties: {
        intensity: p.v * multiplier,
      },
    })),
  };
};

const HEATMAP_CONFIGS: Record<string, { label: string; colors: string[] }> = {
  vitesse: {
    label: "Vitesse excessive",
    colors: ["rgba(0,0,0,0)", "#fde68a", "#fb923c", "#ea580c", "#dc2626"],
  },
  proprete: {
    label: "Propreté",
    colors: ["rgba(0,0,0,0)", "#a7f3d0", "#34d399", "#059669", "#064e3b"],
  },
  nuisances: {
    label: "Nuisances sonores",
    colors: ["rgba(0,0,0,0)", "#c4b5fd", "#8b5cf6", "#6d28d9", "#4c1d95"],
  },
};

/* ================================================
   Status / Severity helpers
   ================================================ */
const statusConfig = {
  nouveau: { label: "Nouveau", color: "bg-orange-500", text: "text-orange-600", bg: "bg-orange-50" },
  en_cours: { label: "En cours", color: "bg-blue-500", text: "text-blue-600", bg: "bg-blue-50" },
  resolu: { label: "Résolu", color: "bg-green-500", text: "text-green-600", bg: "bg-green-50" },
};

const severityConfig = {
  low: { label: "Faible", color: "text-gray-400" },
  medium: { label: "Modéré", color: "text-yellow-500" },
  high: { label: "Élevé", color: "text-red-500" },
};

const categoryColors: Record<string, string> = {
  Voirie: "#f97316",
  Propreté: "#22c55e",
  Éclairage: "#eab308",
  Nuisances: "#ef4444",
  "Espaces Verts": "#10b981",
  Stationnement: "#3b82f6",
};

/* ================================================
   Component
   ================================================ */
export default function AdminDashboard() {
  const mapRef = useRef<MapRef>(null);
  const [activeHeatmap, setActiveHeatmap] = useState<string | null>(null);
  const [selectedSignalement, setSelectedSignalement] = useState<Signalement | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"signalements" | "analytics">("signalements");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showMarkers, setShowMarkers] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);

  const filteredSignalements = filterCategory === "all"
    ? MOCK_SIGNALEMENTS
    : MOCK_SIGNALEMENTS.filter((s) => s.category === filterCategory);

  const flyToSignalement = useCallback((s: Signalement) => {
    setSelectedSignalement(s);
    mapRef.current?.flyTo({
      center: [s.lng, s.lat],
      zoom: 18,
      pitch: 60,
      duration: 1200,
    });
  }, []);

  const heatmapGeoJSON = activeHeatmap ? generateHeatmapData(activeHeatmap) : null;

  // Stats
  const stats = {
    total: MOCK_SIGNALEMENTS.length,
    nouveau: MOCK_SIGNALEMENTS.filter((s) => s.status === "nouveau").length,
    en_cours: MOCK_SIGNALEMENTS.filter((s) => s.status === "en_cours").length,
    resolu: MOCK_SIGNALEMENTS.filter((s) => s.status === "resolu").length,
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-gray-950">
      {/* ========== SIDEBAR ========== */}
      <aside className="w-[380px] min-w-[380px] bg-white border-r border-gray-200 flex flex-col z-20">
        {/* Sidebar Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">CE</span>
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900 leading-none">CEORL</h1>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Centre de Pilotage</p>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-gray-400 uppercase">Live</span>
            </div>
          </div>

          {/* Stats Cards Row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Total", value: stats.total, color: "text-gray-900" },
              { label: "Nouveaux", value: stats.nouveau, color: "text-orange-500" },
              { label: "En cours", value: stats.en_cours, color: "text-blue-500" },
              { label: "Résolus", value: stats.resolu, color: "text-green-500" },
            ].map((stat) => (
              <div key={stat.label} className="bg-gray-50 rounded-lg p-2 text-center">
                <p className={`text-lg font-bold font-mono ${stat.color}`}>{stat.value}</p>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {(["signalements", "analytics"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSidebarTab(tab)}
              className={`flex-1 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors ${
                sidebarTab === tab
                  ? "text-orange-500 border-b-2 border-orange-500"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab === "signalements" ? "Signalements" : "Analytique"}
            </button>
          ))}
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {sidebarTab === "signalements" && (
            <div className="p-4">
              {/* Filter */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {["all", "Voirie", "Propreté", "Éclairage", "Nuisances"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                      filterCategory === cat
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {cat === "all" ? "Tous" : cat}
                  </button>
                ))}
              </div>

              {/* Signalement List */}
              <div className="space-y-2">
                {filteredSignalements.map((s, i) => {
                  const sc = statusConfig[s.status];
                  return (
                    <button
                      key={s.id}
                      onClick={() => flyToSignalement(s)}
                      className={`w-full text-left p-3 rounded-xl border transition-all duration-200 animate-fade-in-up ${
                        selectedSignalement?.id === s.id
                          ? "border-orange-300 bg-orange-50/50 shadow-sm"
                          : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                      }`}
                      style={{ animationDelay: `${i * 0.04}s` }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: categoryColors[s.category] || "#9ca3af" }}
                          />
                          <span className="text-xs font-semibold text-gray-900">{s.category}</span>
                        </div>
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 ml-[18px]">
                        {s.description}
                      </p>
                      <div className="flex items-center justify-between mt-2 ml-[18px]">
                        <span className="text-[9px] text-gray-400 font-mono">{s.id}</span>
                        <span className="text-[9px] text-gray-400">{s.date}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {sidebarTab === "analytics" && (
            <div className="p-4 space-y-4">
              {/* Heatmap Controls */}
              <div>
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Couches Heatmap</h3>
                <div className="space-y-2">
                  {Object.entries(HEATMAP_CONFIGS).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setActiveHeatmap(activeHeatmap === key ? null : key)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        activeHeatmap === key
                          ? "border-orange-300 bg-orange-50"
                          : "border-gray-100 bg-white hover:border-gray-200"
                      }`}
                    >
                      <div className="flex gap-0.5">
                        {cfg.colors.slice(1).map((c, i) => (
                          <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-gray-700">{cfg.label}</span>
                      {activeHeatmap === key && (
                        <span className="ml-auto text-[9px] text-orange-500 font-medium">ACTIF</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Layer toggles */}
              <div>
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Affichage</h3>
                <label className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white cursor-pointer">
                  <span className="text-xs text-gray-700">Marqueurs individuels</span>
                  <input
                    type="checkbox"
                    checked={showMarkers}
                    onChange={() => setShowMarkers(!showMarkers)}
                    className="accent-orange-500"
                  />
                </label>
              </div>

              {/* Breakdown by category */}
              <div>
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Répartition</h3>
                <div className="space-y-2">
                  {Object.entries(
                    MOCK_SIGNALEMENTS.reduce((acc, s) => {
                      acc[s.category] = (acc[s.category] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([cat, count]) => (
                    <div key={cat} className="flex items-center gap-3 p-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: categoryColors[cat] || "#9ca3af" }}
                      />
                      <span className="text-xs text-gray-600 flex-1">{cat}</span>
                      <span className="text-xs font-bold text-gray-900 font-mono">{count}</span>
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(count / MOCK_SIGNALEMENTS.length) * 100}%`,
                            backgroundColor: categoryColors[cat] || "#9ca3af",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ========== MAP ========== */}
      <div className="flex-1 relative">
        {!MAPBOX_TOKEN && (
          <div className="absolute inset-0 z-50 bg-gray-950 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-orange-50 border-2 border-orange-200 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Token Mapbox requis</h2>
              <p className="text-sm text-gray-500 mb-4">
                Ajoutez votre token dans le fichier <code className="text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded text-xs">.env.local</code>
              </p>
              <code className="block text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 text-left text-gray-600 font-mono">
                NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
              </code>
            </div>
          </div>
        )}

        <Map
          ref={mapRef}
          initialViewState={{
            longitude: 2.482,
            latitude: 48.6139,
            zoom: 15.5,
            pitch: 55,
            bearing: -10,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
          antialias={true}
          attributionControl={false}
          onLoad={() => setMapLoaded(true)}
        >
          {/* 3D Buildings */}
          <Layer
            id="3d-buildings"
            source="composite"
            source-layer="building"
            filter={["==", "extrude", "true"]}
            type="fill-extrusion"
            minzoom={14}
            paint={{
              "fill-extrusion-color": "#1a1f2e",
              "fill-extrusion-height": [
                "interpolate", ["linear"], ["zoom"],
                14, 0, 14.05, ["get", "height"],
              ],
              "fill-extrusion-base": [
                "interpolate", ["linear"], ["zoom"],
                14, 0, 14.05, ["get", "min_height"],
              ],
              "fill-extrusion-opacity": 0.75,
            }}
          />

          {/* Heatmap Layer */}
          {activeHeatmap && heatmapGeoJSON && (
            <Source id="heatmap-source" type="geojson" data={heatmapGeoJSON}>
              <Layer
                id="heatmap-layer"
                type="heatmap"
                paint={{
                  "heatmap-weight": ["get", "intensity"],
                  "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 11, 1, 18, 3],
                  "heatmap-color": [
                    "interpolate", ["linear"], ["heatmap-density"],
                    0, HEATMAP_CONFIGS[activeHeatmap].colors[0],
                    0.25, HEATMAP_CONFIGS[activeHeatmap].colors[1],
                    0.5, HEATMAP_CONFIGS[activeHeatmap].colors[2],
                    0.75, HEATMAP_CONFIGS[activeHeatmap].colors[3],
                    1, HEATMAP_CONFIGS[activeHeatmap].colors[4],
                  ],
                  "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 11, 15, 18, 40],
                  "heatmap-opacity": 0.7,
                }}
              />
            </Source>
          )}

          {/* Individual Markers */}
          {showMarkers && mapLoaded &&
            filteredSignalements.map((s) => (
              <Marker
                key={s.id}
                longitude={s.lng}
                latitude={s.lat}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  flyToSignalement(s);
                }}
              >
                <div className="relative group cursor-pointer">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white shadow-lg transition-transform group-hover:scale-125"
                    style={{ backgroundColor: categoryColors[s.category] || "#9ca3af" }}
                  />
                  {s.severity === "high" && (
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </div>
              </Marker>
            ))}
        </Map>

        {/* Map HUD — Top bar */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
          {/* Active Heatmap Label */}
          {activeHeatmap && (
            <div className="pointer-events-auto bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-lg animate-fade-in-up">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {HEATMAP_CONFIGS[activeHeatmap].colors.slice(1).map((c, i) => (
                    <div key={i} className="w-2 h-2 rounded-sm" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <span className="text-xs text-white/80 font-medium">
                  {HEATMAP_CONFIGS[activeHeatmap].label}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Selected Signalement Detail Panel */}
        {selectedSignalement && (
          <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-10 animate-slide-in-right">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: categoryColors[selectedSignalement.category] || "#9ca3af" }}
                  />
                  <span className="text-sm font-bold text-gray-900">{selectedSignalement.category}</span>
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${statusConfig[selectedSignalement.status].bg} ${statusConfig[selectedSignalement.status].text}`}>
                    {statusConfig[selectedSignalement.status].label}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedSignalement(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">{selectedSignalement.description}</p>
              <div className="flex items-center justify-between text-[10px] text-gray-400 border-t border-gray-100 pt-3">
                <span className="font-mono">{selectedSignalement.id}</span>
                <span>{selectedSignalement.date}</span>
                <span className={severityConfig[selectedSignalement.severity].color}>
                  ● {severityConfig[selectedSignalement.severity].label}
                </span>
              </div>
              <button className="mt-3 w-full py-2 rounded-lg bg-orange-500 text-white text-xs font-medium hover:bg-orange-600 transition-colors">
                Créer un ticket de résolution
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
