import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-100 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-50 rounded-full blur-[100px] opacity-50" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-3xl">
        {/* Logo / Brand */}
        <div className="mb-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-xs font-semibold uppercase tracking-widest mb-6">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            Plateforme Active
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight">
            CEORL
          </h1>
          <p className="mt-3 text-lg text-gray-500 font-light">
            Hyperviseur Smart City — <span className="text-orange-500 font-medium">Corbeil-Essonnes</span>
          </p>
        </div>

        {/* Dual Interface Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-10 animate-fade-in-up stagger-2">
          {/* Citizen Card */}
          <Link
            href="/signalement"
            className="group relative bg-white border border-gray-200 rounded-2xl p-8 text-left transition-all duration-300 hover:shadow-xl hover:border-orange-200 hover:-translate-y-1"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-5 group-hover:bg-orange-100 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Signaler un problème</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Signalez rapidement un problème dans votre quartier : voirie, propreté, nuisances…
            </p>
            <div className="mt-5 text-orange-500 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
              Accéder
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </Link>

          {/* Admin Card */}
          <Link
            href="/admin"
            className="group relative bg-gray-900 border border-gray-800 rounded-2xl p-8 text-left transition-all duration-300 hover:shadow-xl hover:border-orange-500/30 hover:-translate-y-1"
          >
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-5 group-hover:bg-orange-500/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Centre de Pilotage</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Tableau de bord opérationnel pour les agents municipaux. Carte 3D, heatmaps, gestion des tickets.
            </p>
            <div className="mt-5 text-orange-400 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
              Ouvrir le dashboard
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </Link>
        </div>

        <p className="mt-12 text-xs text-gray-400 animate-fade-in-up stagger-3">
          © {new Date().getFullYear()} Mairie de Corbeil-Essonnes — Propulsé par CEORL
        </p>
      </div>
    </main>
  );
}