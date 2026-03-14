type Listener = (online: boolean) => void;

class ConnectivityMonitor {
  private listeners = new Set<Listener>();
  private _isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private started = false;

  get isOnline() {
    return this._isOnline;
  }

  start() {
    if (this.started) return;
    this.started = true;

    window.addEventListener('online', () => {
      this._isOnline = true;
      this.listeners.forEach((fn) => fn(true));
    });

    window.addEventListener('offline', () => {
      this._isOnline = false;
      this.listeners.forEach((fn) => fn(false));
    });
  }

  onStatusChange(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

export const connectivity = new ConnectivityMonitor();
