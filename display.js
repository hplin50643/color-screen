// Viewport display is independent from native fullscreen (which may be denied).
export class DisplayController {
  constructor({ requestFullscreen, exitFullscreen, isFullscreen, onChange }) {
    Object.assign(this, { requestFullscreen, exitFullscreen, isFullscreen, onChange });
    this.displaying = false;
    this.nativeEntered = false;
    this.exiting = false;
  }

  enter() {
    if (this.displaying) return;
    this.displaying = true;
    this.nativeEntered = false;
    this.onChange(true);
    // A previous exit may still be settling. Preserve this new viewport session
    // without making another native request that the old exit would cancel.
    if (this.exiting) return;
    // Call immediately: awaiting anything here can lose user activation.
    try {
      Promise.resolve(this.requestFullscreen?.()).then(() => {
        if (!this.displaying) this.exitNative();
        else if (!this.exiting) this.nativeEntered = this.isFullscreen();
      }).catch(() => { /* Keep the pure-color viewport fallback. */ });
    } catch { /* Unsupported/denied native fullscreen is not a fatal error. */ }
  }

  leave() {
    if (!this.displaying) return;
    this.displaying = false;
    this.nativeEntered = false;
    this.onChange(false);
    this.exitNative();
  }

  exitNative() {
    if (!this.isFullscreen() || this.exiting) return;
    this.exiting = true;
    try {
      Promise.resolve(this.exitFullscreen()).catch(() => {}).finally(() => { this.exiting = false; });
    } catch { this.exiting = false; }
  }

  fullscreenChanged() {
    if (this.exiting) return;
    if (this.isFullscreen()) {
      if (this.displaying) this.nativeEntered = true;
      else this.exitNative(); // A late request must not strand the user fullscreen.
    } else if (this.displaying && this.nativeEntered) this.leave();
  }
}
