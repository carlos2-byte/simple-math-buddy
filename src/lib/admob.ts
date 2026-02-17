import { Capacitor } from '@capacitor/core';

// ─── Ad Unit IDs ────────────────────────────────────────────
const BANNER_ID = 'ca-app-pub-2671131515539767/2926247201';
const INTERSTITIAL_ID = 'ca-app-pub-2671131515539767/9244243541';

// IDs de teste do Google (ativar isDebug = true para usar)
const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
const TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';

const isDebug = false; // ← Altere para true para testes

// ─── Timing ─────────────────────────────────────────────────
const MIN_INTERVAL_MS = 8 * 60 * 1000; // 8 minutos

// ─── State ──────────────────────────────────────────────────
let AdMob: any = null;
let BannerAdSize: any = null;
let BannerAdPosition: any = null;

let bannerShown = false;
let isShowingAd = false;
let hasShownFirstAd = false;
let lastAdShownTime = 0;
let initialized = false;

function getIds() {
  return {
    banner: isDebug ? TEST_BANNER_ID : BANNER_ID,
    interstitial: isDebug ? TEST_INTERSTITIAL_ID : INTERSTITIAL_ID,
  };
}

/**
 * Inicializa o SDK do AdMob.
 * Seguro para chamar no web — retorna silenciosamente.
 */
export async function initializeAdMob(): Promise<void> {
  if (!Capacitor.isNativePlatform() || initialized) return;

  try {
    const mod = await import('@capacitor-community/admob');
    AdMob = mod.AdMob;
    BannerAdSize = mod.BannerAdSize;
    BannerAdPosition = mod.BannerAdPosition;

    await AdMob.initialize({ initializeForTesting: isDebug });
    initialized = true;
    console.log('[AdMob] SDK initialized');
  } catch (e) {
    console.error('[AdMob] Init error:', e);
  }
}

/**
 * Exibe banner adaptável fixo na parte inferior.
 * Chamado uma única vez — permanece visível.
 */
export async function showBanner(): Promise<void> {
  if (!AdMob || bannerShown) return;

  try {
    const ids = getIds();
    await AdMob.showBanner({
      adId: ids.banner,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      isTesting: isDebug,
    });
    bannerShown = true;
    console.log('[AdMob] Banner shown');
  } catch (e) {
    console.error('[AdMob] Banner error:', e);
  }
}

/**
 * Mostra interstitial respeitando as regras:
 * - 1ª vez: mostra imediatamente
 * - Subsequentes: somente após 8 min desde o último
 * - Nunca dois seguidos
 */
export async function showInterstitial(): Promise<boolean> {
  if (!AdMob || isShowingAd) return false;

  if (!hasShownFirstAd) {
    return doShowInterstitial();
  }

  const elapsed = Date.now() - lastAdShownTime;
  if (elapsed >= MIN_INTERVAL_MS) {
    return doShowInterstitial();
  }

  console.log(`[AdMob] Interstitial skipped — ${Math.round((MIN_INTERVAL_MS - elapsed) / 1000)}s remaining`);
  return false;
}

async function doShowInterstitial(): Promise<boolean> {
  try {
    isShowingAd = true;
    const ids = getIds();

    await AdMob.prepareInterstitial({
      adId: ids.interstitial,
      isTesting: isDebug,
    });
    await AdMob.showInterstitial();

    hasShownFirstAd = true;
    lastAdShownTime = Date.now();
    isShowingAd = false;
    console.log('[AdMob] Interstitial shown');
    return true;
  } catch (e) {
    isShowingAd = false;
    console.error('[AdMob] Interstitial error:', e);
    return false;
  }
}

/**
 * Reseta o timer de 8 minutos (chamar ao reabrir o app).
 */
export function resetAdTimer(): void {
  lastAdShownTime = 0;
}
