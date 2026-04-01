"use client";

import React, { useState } from "react";
import Link from "next/link";

const CATEGORIES = [
  { id: "voirie", label: "Voirie", icon: "🛤️", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { id: "proprete", label: "Propreté", icon: "🗑️", color: "bg-green-100 text-green-700 border-green-200" },
  { id: "eclairage", label: "Éclairage", icon: "💡", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { id: "nuisances", label: "Nuisances", icon: "📢", color: "bg-red-100 text-red-700 border-red-200" },
  { id: "espaces_verts", label: "Espaces Verts", icon: "🌳", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { id: "stationnement", label: "Stationnement", icon: "🅿️", color: "bg-blue-100 text-blue-700 border-blue-200" },
];

export default function SignalementPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [step, setStep] = useState(1);
  const [isLocating, setIsLocating] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleGeolocate = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsLocating(false);
        },
        () => {
          // Fallback to Corbeil-Essonnes center
          setLocation({ lat: 48.6139, lng: 2.482 });
          setIsLocating(false);
        }
      );
    } else {
      setLocation({ lat: 48.6139, lng: 2.482 });
      setIsLocating(false);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-sm animate-fade-in-up">
          <div className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Signalement envoyé !</h1>
          <p className="text-gray-500 text-sm mb-8">
            Merci pour votre contribution. Nos équipes ont été notifiées et prendront en charge votre signalement dans les meilleurs délais.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 text-white font-medium text-sm hover:bg-orange-600 transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div className="text-center">
          <h1 className="text-sm font-semibold text-gray-900">Nouveau signalement</h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Corbeil-Essonnes</p>
        </div>
        <span className="text-xs text-gray-400 font-mono">
          {step}/3
        </span>
      </header>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-gray-200">
        <div
          className="h-full bg-orange-500 transition-all duration-500 ease-out"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 p-5 max-w-lg mx-auto w-full">
        {/* Step 1: Category */}
        {step === 1 && (
          <div className="animate-fade-in-up">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Type de problème</h2>
            <p className="text-sm text-gray-500 mb-6">Sélectionnez la catégorie qui correspond le mieux.</p>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                    selectedCategory === cat.id
                      ? "border-orange-500 bg-orange-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs font-medium text-gray-700">{cat.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => selectedCategory && setStep(2)}
              disabled={!selectedCategory}
              className="mt-6 w-full py-3 rounded-xl bg-orange-500 text-white font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors"
            >
              Continuer
            </button>
          </div>
        )}

        {/* Step 2: Description */}
        {step === 2 && (
          <div className="animate-fade-in-up">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Décrivez le problème</h2>
            <p className="text-sm text-gray-500 mb-6">Soyez aussi précis que possible pour aider nos équipes.</p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Nid de poule dangereux devant le 12 rue Jean Jaurès, environ 30cm de diamètre…"
              rows={5}
              className="w-full p-4 rounded-xl border-2 border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-500 transition-colors resize-none"
            />
            <p className="text-xs text-gray-400 mt-2 text-right">{description.length} caractères</p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Retour
              </button>
              <button
                onClick={() => {
                  setStep(3);
                  handleGeolocate();
                }}
                disabled={description.length < 10}
                className="flex-[2] py-3 rounded-xl bg-orange-500 text-white font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors"
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="animate-fade-in-up">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Localisation</h2>
            <p className="text-sm text-gray-500 mb-6">Nous utilisons votre position pour localiser le signalement.</p>

            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 text-center">
              {isLocating ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Localisation en cours…</p>
                </div>
              ) : location ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">Position détectée</p>
                  <p className="text-xs text-gray-400 font-mono">
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleGeolocate}
                  className="text-orange-500 text-sm font-medium hover:underline"
                >
                  Réessayer la géolocalisation
                </button>
              )}
            </div>

            {/* Recap */}
            <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-4">
              <h3 className="text-xs text-orange-600 font-semibold uppercase tracking-wider mb-2">Récapitulatif</h3>
              <div className="space-y-1 text-sm text-gray-700">
                <p><span className="text-gray-400">Catégorie :</span> {CATEGORIES.find((c) => c.id === selectedCategory)?.label}</p>
                <p className="truncate"><span className="text-gray-400">Description :</span> {description.slice(0, 80)}…</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Retour
              </button>
              <button
                onClick={handleSubmit}
                disabled={!location}
                className="flex-[2] py-3 rounded-xl bg-orange-500 text-white font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors"
              >
                Envoyer le signalement
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
