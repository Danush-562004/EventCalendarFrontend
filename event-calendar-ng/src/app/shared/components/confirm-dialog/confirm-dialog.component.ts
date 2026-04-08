import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (open()) {
      <div class="overlay" (click)="cancel.emit()">
        <div class="dialog" (click)="$event.stopPropagation()">
          <h3 class="dialog__title">{{ title() }}</h3>
          <p class="dialog__msg">{{ message() }}</p>
          @if (highlight()) {
            <p class="dialog__highlight">⚠️ {{ highlight() }}</p>
          }
          <div class="dialog__actions">
            <button class="btn btn--ghost" (click)="cancel.emit()">Cancel</button>
            <button class="btn btn--danger" (click)="confirm.emit()">{{ confirmLabel() }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.6);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; backdrop-filter: blur(4px); animation: fadeIn .15s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .dialog {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 16px; padding: 2rem; max-width: 400px; width: 90%;
      animation: popIn .2s ease;
    }
    @keyframes popIn { from { transform: scale(.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .dialog__title { font-size: 1.125rem; font-weight: 700; margin-bottom: .5rem; color: var(--text); }
    .dialog__msg { color: var(--muted); font-size: .9rem; margin-bottom: .75rem; }
    .dialog__highlight {
      font-size: .875rem; font-weight: 700; color: #b8600a;
      background: rgba(255,149,0,.12); border: 1px solid rgba(255,149,0,.35);
      border-radius: 8px; padding: .625rem .875rem; margin-bottom: 1.25rem;
    }
    .dialog__actions { display: flex; justify-content: flex-end; gap: .75rem; }
  `]
})
export class ConfirmDialogComponent {
  open = input(false);
  title = input('Confirm Action');
  message = input('Are you sure?');
  highlight = input('');
  confirmLabel = input('Delete');
  confirm = output<void>();
  cancel = output<void>();
}
