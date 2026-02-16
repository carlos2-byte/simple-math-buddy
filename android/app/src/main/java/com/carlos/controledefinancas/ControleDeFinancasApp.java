package com.carlos.controledefinancas;

import android.app.Application;
import android.util.Log;

import com.google.android.gms.ads.MobileAds;

/**
 * Application class that initializes Mobile Ads SDK
 * and sets up the App Open Ad manager.
 */
public class ControleDeFinancasApp extends Application {

    private static final String TAG = "ControleDeFinancasApp";

    @Override
    public void onCreate() {
        super.onCreate();

        // Initialize Mobile Ads SDK
        MobileAds.initialize(this, initializationStatus -> {
            Log.d(TAG, "MobileAds SDK initialized.");
        });

        // Initialize App Open Ad manager
        new AppOpenManager(this);
    }
}
