import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

// ─── Ad Unit IDs ────────────────────────────────────────────
const BANNER_ID = 'ca-app-pub-2671131515539767/2926247201';
const INTERSTITIAL_ID = 'ca-app-pub-2671131515539767/9244243541';

const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
const TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';

const isDebug = false; // ← true para testes

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

export async function initializeAdMob(): Promise<void> {
  if (!Capacitor.isNativePlatform() || initialized) return;

  try {
    const mod = await import('@capacitor-community/admob');
    AdMob = mod.AdMob;
    BannerAdSize = mod.BannerAdSize;
    BannerAdPosition = mod.BannerAdPosition;

    await AdMob.initialize({ initializeForTesting: isDebug });
    initialized = true;
    console.log('[AdMob] ✅ SDK initialized');
    toast.success('AdMob: inicializado com sucesso', { duration: 3000 });
  } catch (e) {
    console.error('[AdMob] ❌ Init error:', e);
    toast.error('AdMob: erro na inicialização');
  }
}

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
    console.log('[AdMob] ✅ Banner exibido (BOTTOM_CENTER)');
    toast.success('Banner: exibido na parte inferior', { duration: 3000 });
  } catch (e) {
    console.error('[AdMob] ❌ Banner error:', e);
    toast.error('Banner: erro ao exibir');
  }
}

export async function showInterstitial(): Promise<boolean> {
  if (!AdMob || isShowingAd) return false;

  if (!hasShownFirstAd) {
    return doShowInterstitial();
  }

  const elapsed = Date.now() - lastAdShownTime;
  if (elapsed >= MIN_INTERVAL_MS) {
    return doShowInterstitial();
  }

  const remaining = Math.round((MIN_INTERVAL_MS - elapsed) / 1000);
  console.log(`[AdMob] ⏳ Interstitial skipped — ${remaining}s remaining`);
  return false;
}

async function doShowInterstitial(): Promise<boolean> {
  try {
    isShowingAd = true;
    const ids = getIds();

    console.log('[AdMob] 📦 Interstitial: carregando...');
    await AdMob.prepareInterstitial({
      adId: ids.interstitial,
      isTesting: isDebug,
    });
    console.log('[AdMob] ✅ Interstitial: carregado');

    await AdMob.showInterstitial();
    hasShownFirstAd = true;
    lastAdShownTime = Date.now();
    isShowingAd = false;
    console.log('[AdMob] ✅ Interstitial: exibido');
    toast.success('Interstitial: exibido', { duration: 3000 });
    return true;
  } catch (e) {
    isShowingAd = false;
    console.error('[AdMob] ❌ Interstitial error:', e);
    toast.error('Interstitial: erro ao exibir');
    return false;
  }
}

export function resetAdTimer(): void {
  lastAdShownTime = 0;
  console.log('[AdMob] 🔄 Timer resetado');
}
