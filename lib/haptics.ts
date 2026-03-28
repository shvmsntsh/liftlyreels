/** Trigger device vibration (haptic feedback) where supported.
 *  Silent on unsupported devices. */
export function haptic(pattern: "light" | "medium" | "success" | "error" = "light") {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  const patterns = {
    light: [10],
    medium: [25],
    success: [15, 50, 30],
    error: [40, 30, 40],
  };
  navigator.vibrate(patterns[pattern]);
}
