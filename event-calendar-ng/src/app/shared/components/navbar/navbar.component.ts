import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthStore } from '../../../core/services/auth.store';
import { ToastService } from '../toast/toast.service';

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

      <button class="navbar__hamburger" (click)="menuOpen.set(!menuOpen())" aria-label="Toggle menu">
        <span></span><span></span><span></span>
      </button>

      <div class="navbar__links" [class.open]="menuOpen()">
        <a routerLink="/events" routerLinkActive="active" class="nav-link" (click)="menuOpen.set(false)">Events</a>
        <a routerLink="/venues" routerLinkActive="active" class="nav-link" (click)="menuOpen.set(false)">Venues</a>

        @if (auth.isLoggedIn()) {
          <a routerLink="/categories" routerLinkActive="active" class="nav-link" (click)="menuOpen.set(false)">Categories</a>
          @if (!auth.isAdmin()) {
            <a routerLink="/tickets"   routerLinkActive="active" class="nav-link" (click)="menuOpen.set(false)">My Tickets</a>
            <a routerLink="/reminders" routerLinkActive="active" class="nav-link" (click)="menuOpen.set(false)">Reminders</a>
          }
          @if (auth.isAdmin()) {
            <a routerLink="/admin" routerLinkActive="active" class="nav-link nav-link--admin" (click)="menuOpen.set(false)">Admin</a>
          }
          <div class="navbar__user">
            <button class="navbar__avatar" (click)="dropOpen.set(!dropOpen())" [attr.aria-expanded]="dropOpen()">
              {{ initials() }}
            </button>
            @if (dropOpen()) {
              <div class="navbar__dropdown" (click)="dropOpen.set(false)">
                <div class="dropdown__info">
                  <span class="dropdown__name">{{ auth.user()?.fullName }}</span>
                  <span class="dropdown__role">{{ auth.user()?.role }}</span>
                </div>
                <hr class="dropdown__sep">
                <a routerLink="/dashboard" class="dropdown__item">Dashboard</a>
                <a routerLink="/profile"   class="dropdown__item">Profile</a>
                <button class="dropdown__item dropdown__item--danger" (click)="logout()">Sign Out</button>
              </div>
            }
          </div>
        } @else {
          <a routerLink="/auth/login"    class="btn btn--sm btn--ghost">Sign In</a>
          <a routerLink="/auth/register" class="btn btn--sm">Get Started</a>
        }
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      position: sticky; top: 0; z-index: 100;
      display: flex; align-items: center; gap: 1.5rem;
      padding: 0 2rem; height: 52px;
      background: rgba(255,255,255,.82);
      border-bottom: 1px solid rgba(0,0,0,.08);
      backdrop-filter: saturate(180%) blur(20px);
      -webkit-backdrop-filter: saturate(180%) blur(20px);
    }
    .navbar__brand { display: flex; align-items: center; gap: .5rem; text-decoration: none; }
    .brand-icon { font-size: 1.125rem; color: #0071e3; }
    .brand-name { font-size: 1.0625rem; font-weight: 700; color: #1d1d1f; letter-spacing: -.02em; }
    .navbar__links { display: flex; align-items: center; gap: .125rem; margin-left: auto; }
    .nav-link {
      padding: .375rem .75rem; border-radius: 980px;
      color: #1d1d1f; font-size: .875rem; font-weight: 400;
      text-decoration: none; transition: background .15s;
      background: none; border: none; cursor: pointer; font-family: inherit;
    }
    .nav-link:hover { background: rgba(0,0,0,.06); }
    .nav-link.active { color: #0071e3; font-weight: 500; }
    .nav-link--admin { color: #0071e3; }
    .navbar__user { position: relative; margin-left: .5rem; }
    .navbar__avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: #0071e3; color: #fff;
      font-weight: 700; font-size: .75rem; border: none;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: opacity .15s;
    }
    .navbar__avatar:hover { opacity: .85; }
    .navbar__dropdown {
      position: absolute; top: calc(100% + .5rem); right: 0;
      background: rgba(255,255,255,.95); border: 1px solid rgba(0,0,0,.1);
      border-radius: 14px; padding: .5rem; min-width: 200px;
      box-shadow: 0 8px 32px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.06);
      backdrop-filter: blur(20px);
      animation: popIn .15s ease;
    }
    @keyframes popIn { from { transform: scale(.95) translateY(-4px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
    .dropdown__info { padding: .5rem .75rem; }
    .dropdown__name { display: block; font-weight: 600; color: #1d1d1f; font-size: .875rem; }
    .dropdown__role { font-size: .75rem; color: #86868b; }
    .dropdown__sep { border: none; border-top: 1px solid rgba(0,0,0,.08); margin: .375rem 0; }
    .dropdown__item {
      display: block; width: 100%; text-align: left;
      padding: .5rem .75rem; border-radius: 8px;
      color: #1d1d1f; font-size: .875rem; font-weight: 400;
      text-decoration: none; background: none; border: none;
      cursor: pointer; transition: background .12s;
    }
    .dropdown__item:hover { background: rgba(0,0,0,.05); }
    .dropdown__item--danger:hover { background: rgba(255,59,48,.1); color: #ff3b30; }
    .navbar__hamburger { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 4px; margin-left: auto; }
    .navbar__hamburger span { display: block; width: 22px; height: 2px; background: #1d1d1f; border-radius: 2px; }
    @media (max-width: 768px) {
      .navbar { padding: 0 1rem; }
      .navbar__hamburger { display: flex; }
      .navbar__links {
        display: none; position: absolute; top: 52px; left: 0; right: 0;
        flex-direction: column; align-items: flex-start;
        background: rgba(255,255,255,.96); border-bottom: 1px solid rgba(0,0,0,.08);
        padding: 1rem; gap: .25rem; z-index: 99;
        backdrop-filter: blur(20px);
      }
      .navbar__links.open { display: flex; }
      .navbar__user { width: 100%; }
      .navbar__dropdown { position: static; box-shadow: none; margin-top: .5rem; }
    }
  `]
})
export class NavbarComponent {
  auth     = inject(AuthStore);
  router   = inject(Router);
  private toast = inject(ToastService);
  menuOpen = signal(false);
  dropOpen = signal(false);

  initials(): string {
    const u = this.auth.user();
    if (!u) return '?';
    const name = u.fullName || u.username || '?';
    return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  }

  requireLogin(feature: string) {
    this.toast.warning(`Please sign in to access ${feature}.`);
    this.router.navigate(['/auth/login']);
  }

  logout(): void {
    this.auth.clearAuth();
    this.router.navigate(['/auth/login']);
  }
}
