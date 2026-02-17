package com.carlos.controledefinancas;

import android.net.Uri;
import android.os.Bundle;
import android.graphics.Color;
import android.view.View;
import android.widget.VideoView;
import android.widget.FrameLayout;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Fundo preto na janela para evitar flash branco
        getWindow().getDecorView().setBackgroundColor(Color.BLACK);

        // Esconder a WebView do Capacitor durante o splash
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setVisibility(View.INVISIBLE);
        }

        // Splash video — exibido apenas na abertura
        showSplashVideo();
    }

    private void showSplashVideo() {
        try {
            android.util.Log.d("MainActivity", "Splash video: iniciando");
            FrameLayout rootView = (FrameLayout) getWindow().getDecorView().findViewById(android.R.id.content);

            VideoView videoView = new VideoView(this);
            videoView.setBackgroundColor(Color.BLACK);
            videoView.setLayoutParams(new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            ));

            Uri videoUri = Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.splash_video);
            videoView.setVideoURI(videoUri);

            videoView.setOnCompletionListener(mp -> {
                android.util.Log.d("MainActivity", "Splash video: finalizado");
                rootView.removeView(videoView);
                // Mostrar WebView somente após o vídeo terminar
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().setVisibility(View.VISIBLE);
                }
            });

            videoView.setOnErrorListener((mp, what, extra) -> {
                android.util.Log.e("MainActivity", "Splash video: erro " + what);
                rootView.removeView(videoView);
                // Em caso de erro, mostrar WebView imediatamente
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().setVisibility(View.VISIBLE);
                }
                return true;
            });

            // Adicionar VideoView por cima de tudo
            rootView.addView(videoView);
            videoView.bringToFront();
            videoView.start();
        } catch (Exception e) {
            android.util.Log.w("MainActivity", "Splash video not found, skipping: " + e.getMessage());
            // Sem vídeo, mostrar WebView direto
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().setVisibility(View.VISIBLE);
            }
        }
    }
}
