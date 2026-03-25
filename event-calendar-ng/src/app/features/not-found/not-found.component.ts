import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="notfound-page">
      <div class="notfound-card">
        <div class="notfound-art" aria-hidden="true">
          <div class="ghost">
            <div class="ghost__body">
              <div class="ghost__eye ghost__eye--left"></div>
              <div class="ghost__eye ghost__eye--right"></div>
              <div class="ghost__mouth"></div>
            </div>
            <div class="ghost__tail"></div>
            <div class="ghost__shadow"></div>
          </div>
        </div>
        <h1 class="notfound-code">404</h1>
        <h2 class="notfound-title">Page not found</h2>
        <p class="notfound-sub">Looks like this page wandered off into the void.</p>
        <div class="notfound-actions">
          <a routerLink="/venues" class="btn">Go Home</a>
          <a routerLink="/events" class="btn btn--ghost">Browse Events</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notfound-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: var(--bg); padding: 2rem;
    }
    .notfound-card {
      display: flex; flex-direction: column; align-items: center; gap: 1rem;
      text-align: center; max-width: 420px;
    }
    .notfound-code {
      font-size: 6rem; font-weight: 900; color: var(--accent);
      letter-spacing: -.05em; line-height: 1; margin: 0;
    }
    .notfound-title { font-size: 1.75rem; font-weight: 700; color: var(--text); margin: 0; }
    .notfound-sub { color: var(--muted); font-size: .9375rem; margin: 0; }
    .notfound-actions { display: flex; gap: .75rem; margin-top: .5rem; }

    /* Ghost cartoon */
    .notfound-art { margin-bottom: .5rem; }
    .ghost { position: relative; width: 80px; height: 100px; margin: 0 auto; animation: float 3s ease-in-out infinite; }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-12px); }
    }
    .ghost__body {
      width: 80px; height: 80px; background: #0071e3;
      border-radius: 40px 40px 0 0; position: relative;
      display: flex; align-items: center; justify-content: center; gap: 12px;
    }
    .ghost__eye {
      width: 12px; height: 14px; background: #fff;
      border-radius: 50%; position: relative; top: -4px;
    }
    .ghost__eye::after {
      content: ''; position: absolute; width: 5px; height: 6px;
      background: #1d1d1f; border-radius: 50%; top: 4px; left: 3px;
    }
    .ghost__mouth {
      position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
      width: 20px; height: 8px; border: 2px solid #fff;
      border-top: none; border-radius: 0 0 10px 10px;
    }
    .ghost__tail {
      display: flex; width: 80px;
    }
    .ghost__tail::before, .ghost__tail::after,
    .ghost__tail { position: relative; }
    .ghost__tail {
      height: 20px; background: #0071e3;
      clip-path: polygon(0 0, 20% 0, 20% 100%, 40% 60%, 60% 100%, 80% 60%, 100% 100%, 100% 0);
    }
    .ghost__shadow {
      width: 60px; height: 10px; background: rgba(0,113,227,.15);
      border-radius: 50%; margin: 4px auto 0; animation: shadow 3s ease-in-out infinite;
    }
    @keyframes shadow {
      0%, 100% { transform: scaleX(1); opacity: .4; }
      50% { transform: scaleX(.7); opacity: .2; }
    }
  `]
})
export class NotFoundComponent {}
