/**
 * Muvaffaqiyatli skan uchun qisqa "beep" + tebranish.
 * Web Audio + navigator.vibrate — brauzerda ham, native WebView'da ham ishlaydi
 * (native ML Kit skaneri o'z ovozini bermaydi, shuning uchun shu yerda chiqaramiz).
 */
export function scanFeedback(): void {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
    osc.onended = () => ctx.close();
  } catch {
    /* ovoz qo'llab-quvvatlanmasa jim o'tadi */
  }
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(80);
    }
  } catch {
    /* tebranish qo'llab-quvvatlanmasa jim o'tadi */
  }
}
