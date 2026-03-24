import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private nextId = 0;

  success(message: string, duration = 3500) { this.add(message, 'success', duration); }
  error(message: string, duration = 5000) { this.add(message, 'error', duration); }
  info(message: string, duration = 3500) { this.add(message, 'info', duration); }
  warning(message: string, duration = 4000) { this.add(message, 'warning', duration); }

  private add(message: string, type: Toast['type'], duration: number) {
    const id = ++this.nextId;
    this._toasts.update(t => [...t, { id, message, type }]);
    setTimeout(() => this.remove(id), duration);
  }

  remove(id: number) {
    this._toasts.update(t => t.filter(x => x.id !== id));
  }
}
