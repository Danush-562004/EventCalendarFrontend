import { Component, inject, signal, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationApiService } from '../../../core/services/api.service';
import { AuthStore } from '../../../core/services/auth.store';
import { NotificationResponse } from '../../../core/models';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notif-wrap">
      <button class="notif-btn" (click)="toggle()" [attr.aria-label]="'Notifications, ' + unreadCount() + ' unread'">
        🔔
        @if (unreadCount() > 0) {
          <span class="notif-badge">{{ unreadCount() > 9 ? '9+' : unreadCount() }}</span>
        }
      </button>

      @if (open()) {
        <div class="notif-panel">
          <div class="notif-panel__header">
            <span class="notif-panel__title">Notifications</span>
            @if (unreadCount() > 0) {
              <button class="notif-panel__mark-all" (click)="markAllRead()">Mark all read</button>
            }
          </div>

          @if (loading()) {
            <div class="notif-empty">Loading…</div>
          } @else if (notifications().length === 0) {
            <div class="notif-empty">No notifications yet</div>
          } @else {
            <div class="notif-list">
              @for (n of notifications(); track n.id) {
                <div class="notif-item" [class.notif-item--unread]="!n.isRead" (click)="markRead(n)">
                  <span class="notif-item__icon">{{ typeIcon(n.type) }}</span>
                  <div class="notif-item__body">
                    <p class="notif-item__title">{{ n.title }}</p>
                    <p class="notif-item__msg">{{ n.message }}</p>
                    <p class="notif-item__time">{{ n.createdAt | date:'MMM d, h:mm a' }}</p>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .notif-wrap { position: relative; }
    .notif-btn {
      position: relative; background: none; border: none; cursor: pointer;
      font-size: 1.125rem; padding: .25rem .375rem; border-radius: 8px;
      transition: background .15s; line-height: 1;
    }
    .notif-btn:hover { background: rgba(0,0,0,.06); }
    .notif-badge {
      position: absolute; top: -2px; right: -4px;
      background: #ef4444; color: #fff; font-size: .625rem; font-weight: 700;
      min-width: 16px; height: 16px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; padding: 0 3px;
      line-height: 1;
    }
    .notif-panel {
      position: absolute; top: calc(100% + .5rem); right: 0;
      width: 340px; max-height: 420px;
      background: rgba(255,255,255,.97); border: 1px solid rgba(0,0,0,.1);
      border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,.14);
      backdrop-filter: blur(20px); overflow: hidden;
      display: flex; flex-direction: column;
      animation: popIn .15s ease; z-index: 300;
    }
    @keyframes popIn { from { transform: scale(.95) translateY(-4px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
    .notif-panel__header {
      display: flex; align-items: center; justify-content: space-between;
      padding: .875rem 1rem; border-bottom: 1px solid rgba(0,0,0,.07);
      flex-shrink: 0;
    }
    .notif-panel__title { font-weight: 700; font-size: .9375rem; color: #1d1d1f; }
    .notif-panel__mark-all {
      background: none; border: none; cursor: pointer;
      font-size: .75rem; color: #0071e3; font-weight: 500;
    }
    .notif-panel__mark-all:hover { text-decoration: underline; }
    .notif-list { overflow-y: auto; flex: 1; }
    .notif-empty { padding: 2rem; text-align: center; color: #86868b; font-size: .875rem; }
    .notif-item {
      display: flex; gap: .75rem; padding: .875rem 1rem;
      border-bottom: 1px solid rgba(0,0,0,.05); cursor: pointer;
      transition: background .12s;
    }
    .notif-item:hover { background: rgba(0,0,0,.03); }
    .notif-item--unread { background: rgba(0,113,227,.04); }
    .notif-item__icon { font-size: 1.25rem; flex-shrink: 0; margin-top: .125rem; }
    .notif-item__body { flex: 1; min-width: 0; }
    .notif-item__title { font-size: .8125rem; font-weight: 600; color: #1d1d1f; margin: 0 0 .25rem; }
    .notif-item__msg { font-size: .75rem; color: #555; margin: 0 0 .25rem; line-height: 1.4; }
    .notif-item__time { font-size: .6875rem; color: #86868b; margin: 0; }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private api  = inject(NotificationApiService);
  private auth = inject(AuthStore);

  open          = signal(false);
  loading       = signal(false);
  notifications = signal<NotificationResponse[]>([]);
  unreadCount   = signal(0);

  private pollInterval?: ReturnType<typeof setInterval>;

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.fetchCount();
      // Poll unread count every 30s
      this.pollInterval = setInterval(() => this.fetchCount(), 30_000);
    }
  }

  ngOnDestroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  toggle() {
    this.open.update(v => !v);
    if (this.open()) this.fetchAll();
  }

  // Close panel when clicking outside
  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    const el = e.target as HTMLElement;
    if (!el.closest('app-notification-bell')) this.open.set(false);
  }

  fetchCount() {
    if (!this.auth.isLoggedIn()) return;
    this.api.getUnreadCount().subscribe({ next: c => this.unreadCount.set(c) });
  }

  fetchAll() {
    this.loading.set(true);
    this.api.getMine().subscribe({
      next: n => { this.notifications.set(n); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  markRead(n: NotificationResponse) {
    if (n.isRead) return;
    this.api.markRead(n.id).subscribe({
      next: () => {
        this.notifications.update(list => list.map(x => x.id === n.id ? { ...x, isRead: true } : x));
        this.unreadCount.update(c => Math.max(0, c - 1));
      }
    });
  }

  markAllRead() {
    this.api.markAllRead().subscribe({
      next: () => {
        this.notifications.update(list => list.map(x => ({ ...x, isRead: true })));
        this.unreadCount.set(0);
      }
    });
  }

  typeIcon(type: string): string {
    const icons: Record<string, string> = {
      Refund: '💸',
      EventCancelled: '❌',
      Info: 'ℹ️'
    };
    return icons[type] ?? '🔔';
  }
}
