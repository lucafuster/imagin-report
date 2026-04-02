
"use client";
import React, { useState } from "react";

export default function FeedbackModule() {
  const [note, setNote] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-center my-8 animate-fade-in-up">
        Merci pour votre retour !
      </div>
    );
  }

  return (
    <section className="w-full max-w-xl mx-auto bg-white border border-orange-100 rounded-xl p-6 my-8 shadow-sm animate-fade-in-up">
      <h3 className="text-lg font-semibold mb-2 text-gray-900">Votre avis compte</h3>
      <p className="text-sm text-gray-500 mb-4">Aidez-nous à améliorer le service après chaque signalement.</p>
      <div className="flex items-center gap-2 mb-3">
        {[1,2,3,4,5].map((n) => (
          <button
            key={n}
            className={`text-2xl ${note && n <= note ? "text-orange-400" : "text-gray-300"}`}
            onClick={() => setNote(n)}
            aria-label={`Note ${n}`}
          >★</button>
        ))}
      </div>
      <textarea
        className="w-full border border-gray-200 rounded-md p-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-orange-200"
        rows={2}
        placeholder="Un commentaire ? (optionnel)"
        value={comment}
        onChange={e => setComment(e.target.value)}
      />
      <button
        className="bg-orange-500 text-white px-4 py-2 rounded-md font-medium hover:bg-orange-600 transition"
        disabled={!note}
        onClick={() => setSent(true)}
      >Envoyer</button>
    </section>
  );
}
