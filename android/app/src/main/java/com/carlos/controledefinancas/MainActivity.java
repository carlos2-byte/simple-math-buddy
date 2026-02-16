package com.carlos.controledefinancas;

import android.os.Bundle;
import android.graphics.Color;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Display;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import com.getcapacitor.BridgeActivity;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "MainActivity";
    private static final String BANNER_AD_UNIT_ID = "ca-app-pub-2671131515539767/2926247201";
    private AdView adView;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Force black background to avoid white flash
        getWindow().getDecorView().setBackgroundColor(Color.BLACK);

        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setBackgroundColor(Color.BLACK);
            getBridge().getWebView().setOverScrollMode(View.OVER_SCROLL_NEVER);
        }

        // Setup adaptive banner at bottom
        setupBannerAd();
    }

    private void setupBannerAd() {
        try {
            adView = new AdView(this);
            adView.setAdUnitId(BANNER_AD_UNIT_ID);
            adView.setAdSize(getAdaptiveBannerSize());
            adView.setBackgroundColor(Color.parseColor("#0f1729"));

            // Add banner to the bottom of the content view
            FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
            );
            params.gravity = android.view.Gravity.BOTTOM;

            ViewGroup rootView = (ViewGroup) getWindow().getDecorView().findViewById(android.R.id.content);
            if (rootView != null) {
                rootView.addView(adView, params);
            }

            AdRequest adRequest = new AdRequest.Builder().build();
            adView.loadAd(adRequest);
            Log.d(TAG, "Banner ad loading...");
        } catch (Exception e) {
            Log.e(TAG, "Error setting up banner ad: " + e.getMessage());
        }
    }

    private AdSize getAdaptiveBannerSize() {
        Display display = getWindowManager().getDefaultDisplay();
        DisplayMetrics metrics = new DisplayMetrics();
        display.getMetrics(metrics);
        float widthPixels = metrics.widthPixels;
        float density = metrics.density;
        int adWidth = (int) (widthPixels / density);
        return AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(this, adWidth);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (adView != null) adView.resume();
    }

    @Override
    protected void onPause() {
        if (adView != null) adView.pause();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (adView != null) adView.destroy();
        super.onDestroy();
    }
}
