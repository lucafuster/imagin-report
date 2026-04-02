
"use client";
import React from "react";

const steps = [
  { label: "Signalement déposé", icon: "📝" },
  { label: "Prise en charge", icon: "👷" },
  { label: "Traitement en cours", icon: "🔧" },
  { label: "Résolu / Clôturé", icon: "✅" },
];

export default function TimelineSuivi({ currentStep = 2 }) {
  return (
    <section className="w-full max-w-2xl mx-auto my-8 animate-fade-in-up">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Suivi de votre signalement</h3>
      <ol className="flex flex-col md:flex-row items-center md:justify-between gap-4 md:gap-0">
        {steps.map((step, idx) => (
          <li key={step.label} className="flex flex-col items-center flex-1">
            <span className={`text-2xl mb-1 ${idx <= currentStep ? "text-orange-500" : "text-gray-300"}`}>{step.icon}</span>
            <span className={`text-xs font-medium ${idx <= currentStep ? "text-orange-600" : "text-gray-400"}`}>{step.label}</span>
            {idx < steps.length - 1 && (
              <span className={`hidden md:block w-24 h-1 ${idx < currentStep ? "bg-orange-200" : "bg-gray-100"} rounded-full mx-2`} />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
