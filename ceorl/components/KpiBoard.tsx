import React from "react";

export default function KpiBoard() {
  // Ces valeurs seraient idéalement dynamiques, issues d'une API ou d'un store global
  const kpis = [
    { label: "Délai moyen de traitement", value: "2j 4h", icon: "⏱️", tooltip: "Temps moyen pour traiter un signalement" },
    { label: "Taux de résolution", value: "92%", icon: "✅", tooltip: "Signalements clôturés avec succès" },
    { label: "Taux de réouverture", value: "3%", icon: "🔄", tooltip: "Signalements ré-ouverts après clôture" },
    { label: "Signalements ce mois-ci", value: "184", icon: "📈", tooltip: "Volume total sur la période" },
  ];
  return (
    <section className="w-full max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 my-8 animate-fade-in-up">
      {kpis.map((kpi, idx) => (
        <div key={kpi.label} className="bg-white border border-orange-100 rounded-xl p-4 flex flex-col items-center shadow-sm hover:shadow-md transition group relative">
          <span className="text-2xl mb-2" title={kpi.tooltip}>{kpi.icon}</span>
          <span className="text-lg font-bold text-gray-900">{kpi.value}</span>
          <span className="text-xs text-gray-500 mt-1 text-center">{kpi.label}</span>
        </div>
      ))}
    </section>
  );
}
