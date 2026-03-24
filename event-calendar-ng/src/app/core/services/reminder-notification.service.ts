import { Injectable, inject, OnDestroy } from '@angular/core';
import { ReminderApiService } from './api.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { AuthStore } from './auth.store';

@Injectable({ providedIn: 'root' })
export class ReminderNotificationService implements OnDestroy {
  private reminderApi = inject(ReminderApiService);
  private toast = inject(ToastService);
  private auth = inject(AuthStore);

  private intervalId: any;
  private notifiedIds = new Set<number>();

  start() {
    this.requestPermission();
    this.check();
    // Check every 60 seconds
    this.intervalId = setInterval(() => this.check(), 60_000);
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  ngOnDestroy() { this.stop(); }

  private requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  private check() {
    if (!this.auth.isLoggedIn()) return;
    this.reminderApi.getMine(1, 50).subscribe({
      next: r => {
        const now = new Date();
        const soon = new Date(now.getTime() + 5 * 60 * 1000); // 5 min window
        r.items.forEach(rm => {
          if (rm.isSent || this.notifiedIds.has(rm.id)) return;
          const dt = new Date(rm.reminderDateTime);
          if (dt >= now && dt <= soon) {
            this.notifiedIds.add(rm.id);
            const msg = `🔔 Reminder: ${rm.title} — ${rm.eventTitle}`;
            this.toast.info(msg, 8000);
            this.showBrowserNotification(rm.title, rm.eventTitle, rm.message);
          }
        });
      }
    });
  }

  private showBrowserNotification(title: string, eventTitle: string, message?: string) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    new Notification(`🔔 ${title}`, {
      body: message || `Event: ${eventTitle}`,
      icon: '/favicon.ico',
      tag: `reminder-${title}`
    });
  }
}
