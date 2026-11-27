import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent, type WebViewProps } from 'react-native-webview';
import type { ComponentType, RefAttributes } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import Constants from 'expo-constants';

/**
 * CalmAid mobile shell.
 * Loads the CalmAid web app in a WebView and adds what browsers can't do everywhere:
 *  - real haptics on iPhone AND Android (CPR beat, taps, success/warning)
 *  - keep the screen awake during an emergency
 *  - native text-to-speech (works even where WebView speech is unreliable)
 * If the web app can't be loaded (no internet, wrong URL), a native emergency screen
 * with a tap-to-call button and a native CPR beat is shown — the user is never stuck.
 */

const WEB_URL: string =
  process.env.EXPO_PUBLIC_WEB_URL ??
  (Constants.expoConfig?.extra as { webUrl?: string } | undefined)?.webUrl ??
  'http://localhost:5173';

const KEEP_AWAKE_TAG = 'calmaid-emergency';

// react-native-webview 14 declares `WebView<P = undefined>`, which newer TypeScript reduces to `never` props.
const CalmWebView = WebView as unknown as ComponentType<WebViewProps & RefAttributes<WebView>>;
const BEAT_MS = Math.round(60000 / 110);

type BridgeMsg =
  | { type: 'haptic'; kind: 'beat' | 'tap' | 'success' | 'warning' }
  | { type: 'keepAwake'; on: boolean }
  | { type: 'speak'; text: string; lang: string; id: number }
  | { type: 'stopSpeaking' };

function haptic(kind: 'beat' | 'tap' | 'success' | 'warning') {
  if (kind === 'success') return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  if (kind === 'warning') return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  if (Platform.OS === 'android') {
    // Recommended on Android: works like iOS haptics, no VIBRATE permission needed.
    return Haptics.performAndroidHapticsAsync(kind === 'beat' ? Haptics.AndroidHaptics.Long_Press : Haptics.AndroidHaptics.Keyboard_Tap);
  }
  return Haptics.impactAsync(kind === 'beat' ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light);
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Shell />
    </SafeAreaProvider>
  );
}

function Shell() {
  const web = useRef<WebView>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const reply = useCallback((detail: Record<string, unknown>) => {
    web.current?.injectJavaScript(
      `window.dispatchEvent(new CustomEvent('calmaid-native', { detail: ${JSON.stringify(detail)} })); true;`,
    );
  }, []);

  const onMessage = useCallback(
    (e: WebViewMessageEvent) => {
      let msg: BridgeMsg;
      try {
        msg = JSON.parse(e.nativeEvent.data);
      } catch {
        return;
      }
      switch (msg.type) {
        case 'haptic':
          void haptic(msg.kind);
          break;
        case 'keepAwake':
          if (msg.on) void activateKeepAwakeAsync(KEEP_AWAKE_TAG);
          else void deactivateKeepAwake(KEEP_AWAKE_TAG);
          break;
        case 'speak': {
          const id = msg.id;
          const done = () => reply({ type: 'speechDone', id });
          void Speech.stop();
          Speech.speak(msg.text, { language: msg.lang, rate: 0.92, onDone: done, onStopped: done, onError: done });
          break;
        }
        case 'stopSpeaking':
          void Speech.stop();
          break;
      }
    },
    [reply],
  );

  // Never leave the screen locked awake when the app closes.
  useEffect(() => () => void deactivateKeepAwake(KEEP_AWAKE_TAG), []);

  if (failed) return <NativeFallback onRetry={() => { setFailed(false); setLoading(true); setReloadKey((k) => k + 1); }} />;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <CalmWebView
        key={reloadKey}
        ref={web}
        source={{ uri: WEB_URL }}
        style={styles.web}
        onMessage={onMessage}
        // Marks the page as running in the app before any page script runs.
        injectedJavaScriptBeforeContentLoaded={`window.__CALMAID_NATIVE__ = { platform: '${Platform.OS}' }; true;`}
        onLoadEnd={() => setLoading(false)}
        onError={() => setFailed(true)}
        onHttpError={(e) => {
          if (e.nativeEvent.statusCode >= 500) setFailed(true);
        }}
        // tel: links and external pages open outside the WebView.
        onShouldStartLoadWithRequest={(req) => {
          const url = req.url;
          if (url.startsWith('tel:') || url.startsWith('geo:') || url.startsWith('mailto:')) {
            void Linking.openURL(url);
            return false;
          }
          const sameOrigin = url.startsWith(WEB_URL) || url.startsWith('about:') || url.startsWith('data:') || url.startsWith('blob:');
          if (!sameOrigin && req.isTopFrame) {
            void Linking.openURL(url);
            return false;
          }
          return true;
        }}
        geolocationEnabled
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsBackForwardNavigationGestures={false}
        pullToRefreshEnabled={false}
        setSupportMultipleWindows={false}
        bounces={false}
      />
      {loading && (
        <View style={styles.loading} pointerEvents="none">
          <ActivityIndicator size="large" color="#1f6f66" />
          <Text style={styles.loadingText}>Opening CalmAid…</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

/** Shown when the web app can't load: still lets you call and do CPR with a native beat. */
function NativeFallback({ onRetry }: { onRetry: () => void }) {
  const [cpr, setCpr] = useState(false);
  const [beats, setBeats] = useState(0);

  useEffect(() => {
    if (!cpr) return;
    void activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    const id = setInterval(() => {
      void haptic('beat');
      setBeats((b) => b + 1);
    }, BEAT_MS);
    return () => {
      clearInterval(id);
      void deactivateKeepAwake(KEEP_AWAKE_TAG);
    };
  }, [cpr]);

  return (
    <SafeAreaView style={styles.fbRoot} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.banner}>
        <Text style={styles.bannerText}>Emergency? Call 112 / 911 immediately</Text>
      </View>
      <ScrollView contentContainerStyle={styles.fbBody}>
        <Text style={styles.fbKicker}>OFFLINE EMERGENCY MODE</Text>
        <Text style={styles.fbTitle}>Not responding and not breathing normally?</Text>
        <View style={styles.row}>
          <Pressable style={[styles.btn, styles.call]} onPress={() => Linking.openURL('tel:112')}>
            <Text style={styles.btnText}>Call 112</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.call]} onPress={() => Linking.openURL('tel:911')}>
            <Text style={styles.btnText}>Call 911</Text>
          </Pressable>
        </View>
        <Text style={styles.fbText}>Push hard and fast in the center of the chest, 5–6 cm deep. Follow the beat. Don't stop until help arrives.</Text>
        <Pressable style={[styles.btn, cpr ? styles.secondary : styles.primary, styles.big]} onPress={() => { setBeats(0); setCpr(!cpr); }}>
          <Text style={[styles.btnText, cpr && styles.secondaryText]}>{cpr ? `Stop beat · ${beats} pushes` : 'Start CPR beat (vibrates)'}</Text>
        </Pressable>
        <Text style={styles.fbTitleSmall}>Heavy bleeding?</Text>
        <Text style={styles.fbText}>Press hard on the wound with a cloth. Don't let go.</Text>
        <Pressable style={[styles.btn, styles.secondary]} onPress={onRetry}>
          <Text style={[styles.btnText, styles.secondaryText]}>Try loading CalmAid again</Text>
        </Pressable>
        <Text style={styles.hint}>Could not reach {WEB_URL}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#b42318' },
  web: { flex: 1, backgroundColor: '#eef4f2' },
  loading: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eef4f2', gap: 12 },
  loadingText: { color: '#12302c', fontSize: 18, fontWeight: '600' },
  fbRoot: { flex: 1, backgroundColor: '#b42318' },
  banner: { padding: 14, backgroundColor: '#b42318' },
  bannerText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  fbBody: { padding: 20, gap: 16, backgroundColor: '#eef4f2', flexGrow: 1 },
  fbKicker: { color: '#1f6f66', fontWeight: '800', letterSpacing: 1 },
  fbTitle: { fontSize: 28, fontWeight: '800', color: '#12302c' },
  fbTitleSmall: { fontSize: 22, fontWeight: '800', color: '#12302c', marginTop: 8 },
  fbText: { fontSize: 18, color: '#4b6763', lineHeight: 26 },
  row: { flexDirection: 'row', gap: 10 },
  btn: { minHeight: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, flex: 1 },
  big: { minHeight: 80 },
  call: { backgroundColor: '#c0392b' },
  primary: { backgroundColor: '#1f6f66' },
  secondary: { backgroundColor: '#dcefeb' },
  btnText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  secondaryText: { color: '#1f6f66' },
  hint: { color: '#4b6763', fontSize: 13, textAlign: 'center' },
});
