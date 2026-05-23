'use client';

import { SlidersHorizontal } from 'lucide-react';

export default function CookiePreferencesButton() {
  function openPreferences() {
    window.dispatchEvent(new Event('solara:open-cookie-preferences'));
  }

  return (
    <button
      type="button"
      onClick={openPreferences}
      className="inline-flex items-center justify-center gap-2 rounded-md bg-yellow-500 px-6 py-3 text-sm font-black uppercase tracking-wider text-slate-950 transition-colors hover:bg-yellow-400"
    >
      <SlidersHorizontal size={16} />
      Gerenciar preferências
    </button>
  );
}
