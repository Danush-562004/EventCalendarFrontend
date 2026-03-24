import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading',
  standalone: true,
  template: `
    <div class="loading-wrap" [class.full]="full()">
      <div class="spinner"></div>
      @if (text()) { <p class="loading-text">{{ text() }}</p> }
    </div>
  `,
  styles: [`
    .loading-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; padding: 3rem; }
    .loading-wrap.full { min-height: 60vh; }
    .spinner {
      width: 40px; height: 40px;
      border: 3px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-text { color: var(--muted); font-size: .875rem; }
  `]
})
export class LoadingComponent {
  full = input(false);
  text = input('');
}
