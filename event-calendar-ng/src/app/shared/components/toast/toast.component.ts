import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastSvc.toasts(); track toast.id) {
        <div class="toast toast--{{ toast.type }}" (click)="toastSvc.remove(toast.id)">
          <span class="toast__icon">{{ icons[toast.type] }}</span>
          <div class="toast__content">
            <span class="toast__msg">{{ toast.message }}</span>
          </div>
          <button class="toast__close" (click)="toastSvc.remove(toast.id)">✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: .75rem;
      pointer-events: none;
      max-width: 380px;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: .75rem;
      padding: .875rem 1rem;
      border-radius: 12px;
      font-size: .875rem;
      font-weight: 500;
      cursor: pointer;
      pointer-events: all;
      animation: slideIn .25s ease;
      box-shadow: 0 8px 32px rgba(0,0,0,.22);
      border-left: 4px solid transparent;
      backdrop-filter: blur(12px);
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(40px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .toast--success { background: rgba(16,185,129,.18); border-color: #10b981; color: #6ee7b7; }
    .toast--error   { background: rgba(239,68,68,.18);  border-color: #ef4444; color: #fca5a5; }
    .toast--info    { background: rgba(59,130,246,.18); border-color: #3b82f6; color: #93c5fd; }
    .toast--warning { background: rgba(245,158,11,.18); border-color: #f59e0b; color: #fcd34d; }
    .toast__icon { font-size: 1.1rem; flex-shrink: 0; }
    .toast__content { flex: 1; }
    .toast__msg { display: block; line-height: 1.4; }
    .toast__close { background: none; border: none; cursor: pointer; opacity: .6; font-size: .875rem; padding: 0 .25rem; color: inherit; flex-shrink: 0; }
    .toast__close:hover { opacity: 1; }
  `]
})
export class ToastComponent {
  toastSvc = inject(ToastService);
  icons: Record<string, string> = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
}
