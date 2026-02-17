package com.carlos.controledefinancas;

import android.os.Bundle;
import android.graphics.Color;
import android.view.View;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Força fundo preto para evitar flash branco
        getWindow().getDecorView().setBackgroundColor(Color.BLACK);

        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setBackgroundColor(Color.BLACK);
            getBridge().getWebView().setOverScrollMode(View.OVER_SCROLL_NEVER);
        }

        // Banner e Interstitial são gerenciados pelo plugin
        // @capacitor-community/admob via JavaScript (src/lib/admob.ts)
    }
}
