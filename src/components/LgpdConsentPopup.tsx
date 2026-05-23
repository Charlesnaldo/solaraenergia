'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Cookie, ShieldCheck, SlidersHorizontal, X } from 'lucide-react';

type ConsentPreferences = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  version: number;
  updatedAt: string;
};

const CONSENT_STORAGE_KEY = 'solara_lgpd_consent_v1';
const CONSENT_VERSION = 1;

function buildConsent(preferences: Pick<ConsentPreferences, 'analytics' | 'marketing'>): ConsentPreferences {
  return {
    necessary: true,
    analytics: preferences.analytics,
    marketing: preferences.marketing,
    version: CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
  };
}

function getStoredConsent() {
  if (typeof window === 'undefined') return null;

  try {
    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) return null;

    const consent = JSON.parse(stored) as Partial<ConsentPreferences>;
    if (consent.version !== CONSENT_VERSION || consent.necessary !== true) return null;

    return consent as ConsentPreferences;
  } catch {
    return null;
  }
}

function notifyConsentUpdate(consent: ConsentPreferences) {
  window.dispatchEvent(new CustomEvent('solara:consent-updated', { detail: consent }));
}

export default function LgpdConsentPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const storedConsent = getStoredConsent();

    window.setTimeout(() => {
      if (storedConsent) {
        setAnalytics(storedConsent.analytics);
        setMarketing(storedConsent.marketing);
        notifyConsentUpdate(storedConsent);
        return;
      }

      setIsVisible(true);
    }, 0);
  }, []);

  useEffect(() => {
    const handleOpenPreferences = () => {
      const storedConsent = getStoredConsent();
      setAnalytics(storedConsent?.analytics ?? false);
      setMarketing(storedConsent?.marketing ?? false);
      setShowPreferences(true);
      setIsVisible(true);
    };

    window.addEventListener('solara:open-cookie-preferences', handleOpenPreferences);
    return () => window.removeEventListener('solara:open-cookie-preferences', handleOpenPreferences);
  }, []);

  function saveConsent(preferences: Pick<ConsentPreferences, 'analytics' | 'marketing'>) {
    const consent = buildConsent(preferences);
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
    notifyConsentUpdate(consent);
    setAnalytics(consent.analytics);
    setMarketing(consent.marketing);
    setIsVisible(false);
    setShowPreferences(false);
  }

  if (!isVisible) return null;

  return (
    <section
      aria-label="Preferências de privacidade"
      className="fixed inset-x-0 bottom-0 z-[90] px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="mx-auto max-w-5xl overflow-hidden rounded-lg border border-white/10 bg-slate-950/95 text-white shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="border-t-4 border-yellow-500" />

        <div className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:p-6">
          <div className="flex gap-4">
            <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-md border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 sm:flex">
              <Cookie size={22} />
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-yellow-400">
                    Privacidade e LGPD
                  </p>
                  <h2 className="mt-1 text-lg font-black tracking-tight text-white sm:text-xl">
                    Podemos usar seus dados para melhorar sua experiência?
                  </h2>
                </div>
              </div>

              <p className="max-w-3xl text-sm leading-relaxed text-slate-300">
                Usamos dados essenciais para manter o site funcionando. Com sua permissão, também podemos usar
                informações de navegação para medir desempenho e personalizar comunicações da Solara. Você pode
                aceitar, recusar ou configurar suas preferências.
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-yellow-400" />
                  Consentimento livre e informado
                </span>
                <Link href="/privacidade" className="font-bold text-yellow-400 hover:text-yellow-300">
                  Política de Privacidade
                </Link>
                <Link href="/cookies" className="font-bold text-yellow-400 hover:text-yellow-300">
                  Política de Cookies
                </Link>
              </div>

              {showPreferences && (
                <div className="grid gap-3 pt-2 sm:grid-cols-2">
                  <label className="flex items-center justify-between gap-4 rounded-md border border-white/10 bg-white/[0.03] p-4">
                    <span>
                      <span className="block text-sm font-bold text-white">Medição de uso</span>
                      <span className="mt-1 block text-xs leading-relaxed text-slate-400">
                        Ajuda a entender páginas acessadas e melhorar desempenho.
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={analytics}
                      onChange={(event) => setAnalytics(event.target.checked)}
                      className="h-5 w-5 accent-yellow-500"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-4 rounded-md border border-white/10 bg-white/[0.03] p-4">
                    <span>
                      <span className="block text-sm font-bold text-white">Comunicação e marketing</span>
                      <span className="mt-1 block text-xs leading-relaxed text-slate-400">
                        Permite personalizar campanhas e conteúdos sobre energia.
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={marketing}
                      onChange={(event) => setMarketing(event.target.checked)}
                      className="h-5 w-5 accent-yellow-500"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 md:w-48 md:justify-center">
            <button
              type="button"
              onClick={() => saveConsent({ analytics: true, marketing: true })}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-yellow-500 px-4 py-3 text-sm font-black uppercase tracking-wider text-slate-950 transition-colors hover:bg-yellow-400"
            >
              <Check size={16} />
              Aceitar
            </button>

            <button
              type="button"
              onClick={() => (showPreferences ? saveConsent({ analytics, marketing }) : setShowPreferences(true))}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-white/15 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:border-yellow-500/50 hover:text-yellow-300"
            >
              <SlidersHorizontal size={16} />
              {showPreferences ? 'Salvar' : 'Configurar'}
            </button>

            <button
              type="button"
              onClick={() => saveConsent({ analytics: false, marketing: false })}
              className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 transition-colors hover:text-white"
            >
              <X size={14} />
              Recusar opcionais
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
