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

        // Fundo preto apenas na janela (não na WebView, para não cobrir banner/splash)
        getWindow().getDecorView().setBackgroundColor(Color.BLACK);

        // Splash video — exibido apenas na abertura
        showSplashVideo();

        // Banner e Interstitial são gerenciados pelo plugin
        // @capacitor-community/admob via JavaScript (src/lib/admob.ts)
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
            });

            videoView.setOnErrorListener((mp, what, extra) -> {
                android.util.Log.e("MainActivity", "Splash video: erro " + what);
                rootView.removeView(videoView);
                return true;
            });

            rootView.addView(videoView);
            videoView.start();
        } catch (Exception e) {
            android.util.Log.w("MainActivity", "Splash video not found, skipping: " + e.getMessage());
        }
    }
}
