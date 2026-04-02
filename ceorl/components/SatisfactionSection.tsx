
"use client";
import React from "react";

export default function SatisfactionSection() {
  return (
    <section className="w-full max-w-2xl mx-auto my-8 bg-orange-50 border border-orange-100 rounded-xl p-6 text-center animate-fade-in-up">
      <h3 className="text-lg font-semibold mb-2 text-orange-700">Qualité & Transparence</h3>
      <p className="text-sm text-gray-700 mb-2">
        Notre engagement : un suivi transparent, des délais maîtrisés, et une communication claire à chaque étape.
      </p>
      <p className="text-xs text-gray-500">
        Vous pouvez suivre l'évolution de votre signalement en temps réel et donner votre avis à tout moment.
      </p>
    </section>
  );
}
