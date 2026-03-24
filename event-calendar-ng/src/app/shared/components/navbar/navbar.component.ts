import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthStore } from '../../../core/services/auth.store';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <a routerLink="/dashboard" class="navbar__brand">
        <span class="brand-icon">◆</span>
        <span class="brand-name">EventCal</span>
      </a>

      <button class="navbar__hamburger" (click)="menuOpen.set(!menuOpen())">
        <span></span><span></span><span></span>
      </button>

      <div class="navbar__links" [class.open]="menuOpen()">
        <a routerLink="/events"     routerLinkActive="active" class="nav-link" (click)="menuOpen.set(false)">Events</a>
        <a routerLink="/venues"     routerLinkActive="active" class="nav-link" (click)="menuOpen.set(false)">Venues</a>
        <a routerLink="/categories" routerLinkActive="active" class="nav-link" (click)="menuOpen.set(false)">Categories</a>

        @if (auth.isLoggedIn()) {
          <a routerLink="/tickets"   routerLinkActive="active" class="nav-link" (click)="menuOpen.set(false)">My Tickets</a>
          <a routerLink="/reminders" routerLinkActive="active" class="nav-link" (click)="menuOpen.set(false)">Reminders</a>
          @if (auth.isAdmin()) {
            <a routerLink="/admin" routerLinkActive="active" class="nav-link nav-link--admin" (click)="menuOpen.set(false)">Admin</a>
          }
          <div class="navbar__user">
            <button class="navbar__avatar" (click)="dropOpen.set(!dropOpen())">
              {{ initials() }}
            </button>
            @if (dropOpen()) {
              <div class="navbar__dropdown" (click)="dropOpen.set(false)">
                <div class="dropdown__info">
                  <span class="dropdown__name">{{ auth.user()?.fullName }}</span>
                  <span class="dropdown__role">{{ auth.user()?.role }}</span>
                </div>
                <hr class="dropdown__sep">
                <a routerLink="/profile" class="dropdown__item">Profile</a>
                <button class="dropdown__item dropdown__item--danger" (click)="logout()">Sign Out</button>
              </div>
            }
          </div>
        } @else {
          <a routerLink="/auth/login"    class="btn btn--sm btn--ghost">Login</a>
          <a routerLink="/auth/register" class="btn btn--sm">Register</a>
        }
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      position: sticky; top: 0; z-index: 100;
      display: flex; align-items: center; gap: 1.5rem;
      padding: 0 2rem; height: 64px;
      background: rgba(10,10,15,.88);
      border-bottom: 1px solid var(--border);
      backdrop-filter: blur(16px);
    }
    .navbar__brand { display: flex; align-items: center; gap: .5rem; text-decoration: none; }
    .brand-icon { font-size: 1.25rem; color: var(--accent); }
    .brand-name { font-size: 1.125rem; font-weight: 800; color: var(--text); letter-spacing: -.02em; }
    .navbar__links { display: flex; align-items: center; gap: .25rem; margin-left: auto; flex-wrap: wrap; }
    .nav-link { padding: .375rem .75rem; border-radius: 8px; color: var(--muted); font-size: .875rem; font-weight: 500; text-decoration: none; transition: all .15s; }
    .nav-link:hover, .nav-link.active { color: var(--text); background: var(--surface2); }
    .nav-link--admin { color: var(--accent); }
    .nav-link--admin:hover { background: rgba(167,139,250,.12); }
    .navbar__user { position: relative; margin-left: .5rem; }
    .navbar__avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--accent); color: #000; font-weight: 800; font-size: .8125rem; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .navbar__dropdown { position: absolute; top: calc(100% + .5rem); right: 0; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: .5rem; min-width: 200px; box-shadow: 0 16px 48px rgba(0,0,0,.4); animation: popIn .15s ease; }
    @keyframes popIn { from { transform: scale(.95) translateY(-4px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
    .dropdown__info { padding: .5rem .75rem; }
    .dropdown__name { display: block; font-weight: 600; color: var(--text); font-size: .875rem; }
    .dropdown__role { font-size: .75rem; color: var(--muted); }
    .dropdown__sep { border: none; border-top: 1px solid var(--border); margin: .5rem 0; }
    .dropdown__item { display: block; width: 100%; text-align: left; padding: .5rem .75rem; border-radius: 8px; color: var(--text); font-size: .875rem; font-weight: 500; text-decoration: none; background: none; border: none; cursor: pointer; transition: background .15s; }
    .dropdown__item:hover { background: var(--surface2); }
    .dropdown__item--danger:hover { background: rgba(239,68,68,.15); color: #ef4444; }
    .navbar__hamburger { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 4px; margin-left: auto; }
    .navbar__hamburger span { display: block; width: 22px; height: 2px; background: var(--text); border-radius: 2px; }
    @media (max-width: 768px) {
      .navbar { padding: 0 1rem; }
      .navbar__hamburger { display: flex; }
      .navbar__links { display: none; position: absolute; top: 64px; left: 0; right: 0; flex-direction: column; align-items: flex-start; background: var(--surface); border-bottom: 1px solid var(--border); padding: 1rem; gap: .5rem; z-index: 99; }
      .navbar__links.open { display: flex; }
      .navbar__user { width: 100%; }
      .navbar__dropdown { position: static; box-shadow: none; border: 1px solid var(--border); margin-top: .5rem; }
    }
  `]
})
export class NavbarComponent {
  auth     = inject(AuthStore);
  router   = inject(Router);
  menuOpen = signal(false);
  dropOpen = signal(false);

  initials(): string {
    const u = this.auth.user();
    if (!u) return '?';
    const name = u.fullName || u.username || '?';
    return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  }

  logout(): void {
    this.auth.clearAuth();
    this.router.navigate(['/auth/login']);
  }
}
