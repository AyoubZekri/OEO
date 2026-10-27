package com.kaidoeo.olympic;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // The voice note: written and recorded at once (see VoiceNotePlugin)
        registerPlugin(VoiceNotePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
