"use client";

import React, { useState, useCallback, useRef, useMemo } from "react";
import Map, { Layer, Source, Marker } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";
import signalementsData from "./signalements-data.json";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY || "";

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

const MOCK_SIGNALEMENTS: Signalement[] = signalementsData as Signalement[];

/* ================================================
   Heatmap GeoJSON data
   ================================================ */
const generateHeatmapData = (type: string) => {
  const typeConfig = HEATMAP_CONFIGS[type as keyof typeof HEATMAP_CONFIGS];
  const points = typeConfig.categories.length
    ? MOCK_SIGNALEMENTS.filter((s) => typeConfig.categories.includes(s.category))
    : MOCK_SIGNALEMENTS;

  if (points.length === 0) {
    return null;
  }

  const distanceKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const earthRadius = 6371;
    return 2 * earthRadius * Math.asin(Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng));
  };

  const neighborhoodBoost = (point: Signalement) => {
    const nearbyCount = points.filter((other) => other.id !== point.id && distanceKm(point, other) <= 0.24).length;
    return Math.min(0.4, nearbyCount * 0.1);
  };

  const categoryWeight: Record<string, number> = {
    Voirie: 1.0,
    Propreté: 0.85,
    Éclairage: 0.75,
    Nuisances: 0.8,
    Stationnement: 0.65,
    Pollution: 0.95,
    Circulation: 1.0,
    Sécurité: 0.9,
    "Eau Potable": 0.9,
    "Espaces Verts": 0.7,
  };

  return {
    type: "FeatureCollection" as const,
    features: points
      .map((point) => {
        const baseSeverity = point.severity === "high" ? 1.0 : point.severity === "medium" ? 0.72 : 0.45;
        const statusModifier = point.status === "en_cours" ? 0.18 : point.status === "nouveau" ? 0.1 : -0.08;
        const categoryModifier = categoryWeight[point.category] ?? 0.8;
        const densityBoost = neighborhoodBoost(point);
        const intensity = Math.min(1, Math.max(0.25, baseSeverity * categoryModifier + statusModifier + densityBoost));

        return {
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [point.lng, point.lat],
          },
          properties: {
            intensity,
          },
        };
      })
      .filter((feature) => feature.properties.intensity > 0),
  };
};

type HeatmapType = keyof typeof HEATMAP_CONFIGS;

const FILTER_CATEGORIES = [
  "all",
  "Voirie",
  "Propreté",
  "Éclairage",
  "Nuisances",
  "Stationnement",
  "Espaces Verts",
  "Pollution",
  "Circulation",
  "Sécurité",
  "Eau Potable",
] as const;

const BOUNDARY_SOURCE_ID = "ceorl-boundary-source";
const HEATMAP_SOURCE_ID = "ceorl-heatmap-source";

const HEATMAP_CONFIGS: Record<string, { label: string; colors: string[]; categories: string[] }> = {
  global: {
    label: "Toutes catégories",
    colors: ["rgba(0,0,0,0)", "#60a5fa", "#38bdf8", "#0ea5e9", "#0369a1"],
    categories: [],
  },
  voirie: {
    label: "Voirie",
    colors: ["rgba(0,0,0,0)", "#fde68a", "#fb923c", "#ea580c", "#dc2626"],
    categories: ["Voirie"],
  },
  proprete: {
    label: "Propreté",
    colors: ["rgba(0,0,0,0)", "#a7f3d0", "#34d399", "#059669", "#064e3b"],
    categories: ["Propreté"],
  },
  eclairage: {
    label: "Éclairage",
    colors: ["rgba(0,0,0,0)", "#fef08a", "#facc15", "#f59e0b", "#c2410c"],
    categories: ["Éclairage"],
  },
  nuisances: {
    label: "Nuisances",
    colors: ["rgba(0,0,0,0)", "#c4b5fd", "#8b5cf6", "#6d28d9", "#4c1d95"],
    categories: ["Nuisances"],
  },
  stationnement: {
    label: "Stationnement",
    colors: ["rgba(0,0,0,0)", "#d8b4fe", "#c084fc", "#a855f7", "#7e22ce"],
    categories: ["Stationnement"],
  },
  pollution: {
    label: "Pollution",
    colors: ["rgba(0,0,0,0)", "#fca5a5", "#f87171", "#ef4444", "#b91c1c"],
    categories: ["Pollution"],
  },
  circulation: {
    label: "Circulation",
    colors: ["rgba(0,0,0,0)", "#93c5fd", "#60a5fa", "#3b82f6", "#1d4ed8"],
    categories: ["Circulation"],
  },
};

const CORBEIL_BOUNDARY = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "Polygon" as const,
        coordinates: [[
          [2.4366347, 48.6109217],
          [2.438989, 48.610519],
          [2.440592, 48.610565],
          [2.442994, 48.61],
          [2.445013, 48.609011],
          [2.447457, 48.6071751],
          [2.448611, 48.605762],
          [2.450149, 48.60519],
          [2.450416, 48.605107],
          [2.451001, 48.604938],
          [2.451694, 48.604737],
          [2.451944, 48.604748],
          [2.452534, 48.604813],
          [2.453512, 48.604488],
          [2.4548144, 48.6044377],
          [2.45639, 48.604652],
          [2.457866, 48.604514],
          [2.4577041, 48.6042992],
          [2.4569276, 48.604262],
          [2.4560757, 48.6041568],
          [2.4545779, 48.6033969],
          [2.4527249, 48.6031526],
          [2.4516662, 48.6030714],
          [2.4500637, 48.6024642],
          [2.4496011, 48.601706],
          [2.4490432, 48.6003404],
          [2.448997, 48.598795],
          [2.449453, 48.597824],
          [2.450715, 48.5953978],
          [2.4558066, 48.5965638],
          [2.4590319, 48.5957015],
          [2.4606491, 48.5956214],
          [2.4615055, 48.5952224],
          [2.4636243, 48.5954297],
          [2.4657566, 48.5928367],
          [2.4668676, 48.5903792],
          [2.4682157, 48.5899007],
          [2.4683672, 48.5890171],
          [2.4691712, 48.5885702],
          [2.469373, 48.5875987],
          [2.46925, 48.586547],
          [2.4690583, 48.5859041],
          [2.468975, 48.58522],
          [2.468859, 48.584602],
          [2.469025, 48.584223],
          [2.469175, 48.584035],
          [2.469877, 48.583812],
          [2.470371, 48.583743],
          [2.470597, 48.583502],
          [2.47055, 48.58334],
          [2.470301, 48.583092],
          [2.470312, 48.582921],
          [2.470663, 48.582448],
          [2.470763, 48.582113],
          [2.47067, 48.581816],
          [2.470536, 48.58133],
          [2.469674, 48.5809182],
          [2.4703902, 48.5800683],
          [2.4694077, 48.5789332],
          [2.4709211, 48.5788566],
          [2.4737282, 48.5777946],
          [2.4758353, 48.5774895],
          [2.4759793, 48.5759204],
          [2.4756896, 48.5725041],
          [2.4770053, 48.5709556],
          [2.4792966, 48.5704496],
          [2.4817199, 48.5698256],
          [2.4781025, 48.5768616],
          [2.4781935, 48.5781865],
          [2.4790016, 48.5798878],
          [2.4793757, 48.5804007],
          [2.4797664, 48.5803272],
          [2.482218, 48.582611],
          [2.4849775, 48.5875552],
          [2.4853446, 48.5911771],
          [2.4856749, 48.5975968],
          [2.4890263, 48.6007136],
          [2.4906578, 48.6027721],
          [2.4907583, 48.6065402],
          [2.4917252, 48.60976],
          [2.4922688, 48.6104439],
          [2.4908844, 48.6110599],
          [2.4903331, 48.6118309],
          [2.4893329, 48.6128567],
          [2.4877206, 48.6138204],
          [2.4868894, 48.614641],
          [2.4866234, 48.6153456],
          [2.4864431, 48.6157466],
          [2.486159, 48.6155197],
          [2.4858386, 48.6152628],
          [2.485251, 48.6154831],
          [2.4846276, 48.6158734],
          [2.484515, 48.61673],
          [2.4835088, 48.6171679],
          [2.4834038, 48.6177265],
          [2.482949, 48.6177684],
          [2.4814903, 48.6189325],
          [2.4792671, 48.6211789],
          [2.4766647, 48.6211742],
          [2.4727223, 48.6236776],
          [2.4646312, 48.6232649],
          [2.4565753, 48.621735],
          [2.4542067, 48.6196601],
          [2.4424806, 48.6134219],
          [2.4389268, 48.6141161],
          [2.4367415, 48.6110639],
          [2.4366347, 48.6109217]
        ]],
      },
    },
  ],
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
  Pollution: "#c026d3",
  Circulation: "#0284c7",
  Sécurité: "#0f766e",
  "Eau Potable": "#2563eb",
};

/* ================================================
   Component
   ================================================ */
export default function AdminDashboard() {
  const mapRef = useRef<MapRef>(null);
  const [activeHeatmap, setActiveHeatmap] = useState<HeatmapType | null>(null);
  const [selectedSignalement, setSelectedSignalement] = useState<Signalement | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"signalements" | "analytics">("signalements");
  const [filterCategory, setFilterCategory] = useState<(typeof FILTER_CATEGORIES)[number]>("all");
  const [showMarkers, setShowMarkers] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);

  const filteredSignalements = useMemo(
    () =>
      filterCategory === "all"
        ? MOCK_SIGNALEMENTS
        : MOCK_SIGNALEMENTS.filter((s) => s.category === filterCategory),
    [filterCategory]
  );

  const heatmapGeoJSON = useMemo(
    () => (activeHeatmap ? generateHeatmapData(activeHeatmap) : null),
    [activeHeatmap]
  );

  const flyToSignalement = useCallback((s: Signalement) => {
    setSelectedSignalement(s);
    mapRef.current?.flyTo({
      center: [s.lng, s.lat],
      zoom: 18,
      pitch: 60,
      duration: 1200,
    });
  }, []);


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
                {FILTER_CATEGORIES.map((cat) => (
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
                {activeHeatmap && !heatmapGeoJSON && (
                  <div className="mt-3 rounded-2xl border border-yellow-100 bg-yellow-50 p-3 text-xs text-yellow-600">
                    Aucune donnée de signalement disponible pour cette couche. Désactivez la couche ou changez de filtre.
                  </div>
                )}
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
        {!MAPTILER_KEY && (
          <div className="absolute inset-0 z-50 bg-gray-950 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-orange-50 border-2 border-orange-200 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Token MapTiler requis</h2>
              <p className="text-sm text-gray-500 mb-4">
                Ajoutez votre token dans le fichier <code className="text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded text-xs">.env.local</code>
              </p>
              <code className="block text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 text-left text-gray-600 font-mono">
                NEXT_PUBLIC_MAPTILER_KEY=YOUR_MAPTILER_KEY
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
          mapStyle={`https://api.maptiler.com/maps/019d49e4-82bf-7a39-8641-1f403ad436a4/style.json?key=${MAPTILER_KEY}`}
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

          {/* Corbeil-Essonnes boundary */}
          <Source key={BOUNDARY_SOURCE_ID} id={BOUNDARY_SOURCE_ID} type="geojson" data={CORBEIL_BOUNDARY}>
            <Layer
              id="boundary-fill"
              type="fill"
              paint={{
                "fill-color": "rgba(251, 146, 60, 0.08)",
                "fill-outline-color": "#fb923c",
              }}
            />
            <Layer
              id="boundary-line"
              type="line"
              paint={{
                "line-color": "#fb923c",
                "line-width": 3,
                "line-opacity": 0.8,
              }}
            />
          </Source>

          {/* Heatmap Layer */}
          {activeHeatmap && heatmapGeoJSON && (
            <Source key={HEATMAP_SOURCE_ID} id={HEATMAP_SOURCE_ID} type="geojson" data={heatmapGeoJSON}>
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
