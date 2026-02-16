package com.carlos.controledefinancas;

import android.app.Activity;
import android.app.Application;
import android.os.Bundle;
import android.os.SystemClock;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.lifecycle.DefaultLifecycleObserver;
import androidx.lifecycle.LifecycleOwner;
import androidx.lifecycle.ProcessLifecycleOwner;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.appopen.AppOpenAd;

/**
 * Manages App Open Ads with timing control:
 * - Shows 1 ad on first app open
 * - Shows another only after 8 minutes of app usage
 * - Prevents consecutive ads
 * - Auto-reloads after display
 */
public class AppOpenManager implements Application.ActivityLifecycleCallbacks, DefaultLifecycleObserver {

    private static final String TAG = "AppOpenManager";
    private static final String AD_UNIT_ID = "ca-app-pub-2671131515539767/9244243541";
    private static final long MIN_INTERVAL_MS = 8 * 60 * 1000; // 8 minutes

    private final Application application;
    private AppOpenAd appOpenAd = null;
    private boolean isLoadingAd = false;
    private boolean isShowingAd = false;
    private boolean hasShownFirstAd = false;
    private long lastAdShownTime = 0;
    private long appStartTime = 0;
    private Activity currentActivity = null;

    public AppOpenManager(Application application) {
        this.application = application;
        this.appStartTime = SystemClock.elapsedRealtime();
        application.registerActivityLifecycleCallbacks(this);
        ProcessLifecycleOwner.get().getLifecycle().addObserver(this);
        loadAd();
    }

    private void loadAd() {
        if (isLoadingAd || appOpenAd != null) return;

        isLoadingAd = true;
        AdRequest request = new AdRequest.Builder().build();

        AppOpenAd.load(application, AD_UNIT_ID, request, new AppOpenAd.AppOpenAdLoadCallback() {
            @Override
            public void onAdLoaded(@NonNull AppOpenAd ad) {
                appOpenAd = ad;
                isLoadingAd = false;
                Log.d(TAG, "App Open Ad loaded.");
            }

            @Override
            public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                isLoadingAd = false;
                Log.e(TAG, "App Open Ad failed to load: " + loadAdError.getMessage());
            }
        });
    }

    private boolean canShowAd() {
        if (isShowingAd || appOpenAd == null) return false;

        // First ad: show immediately
        if (!hasShownFirstAd) return true;

        // Subsequent ads: respect 8-minute interval
        long elapsed = SystemClock.elapsedRealtime() - lastAdShownTime;
        return elapsed >= MIN_INTERVAL_MS;
    }

    private void showAdIfAvailable() {
        if (!canShowAd() || currentActivity == null) return;

        appOpenAd.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override
            public void onAdDismissedFullScreenContent() {
                appOpenAd = null;
                isShowingAd = false;
                lastAdShownTime = SystemClock.elapsedRealtime();
                hasShownFirstAd = true;
                Log.d(TAG, "App Open Ad dismissed. Reloading...");
                loadAd();
            }

            @Override
            public void onAdFailedToShowFullScreenContent(@NonNull AdError adError) {
                appOpenAd = null;
                isShowingAd = false;
                Log.e(TAG, "App Open Ad failed to show: " + adError.getMessage());
                loadAd();
            }

            @Override
            public void onAdShowedFullScreenContent() {
                isShowingAd = true;
                Log.d(TAG, "App Open Ad showing.");
            }
        });

        isShowingAd = true;
        appOpenAd.show(currentActivity);
    }

    // DefaultLifecycleObserver - app comes to foreground
    @Override
    public void onStart(@NonNull LifecycleOwner owner) {
        showAdIfAvailable();
    }

    // ActivityLifecycleCallbacks
    @Override
    public void onActivityResumed(@NonNull Activity activity) {
        currentActivity = activity;
    }

    @Override
    public void onActivityPaused(@NonNull Activity activity) {
        // keep currentActivity reference
    }

    @Override public void onActivityCreated(@NonNull Activity activity, @Nullable Bundle savedInstanceState) {}
    @Override public void onActivityStarted(@NonNull Activity activity) {}
    @Override public void onActivityStopped(@NonNull Activity activity) {}
    @Override public void onActivitySaveInstanceState(@NonNull Activity activity, @NonNull Bundle outState) {}
    @Override public void onActivityDestroyed(@NonNull Activity activity) {
        if (currentActivity == activity) currentActivity = null;
    }
}
