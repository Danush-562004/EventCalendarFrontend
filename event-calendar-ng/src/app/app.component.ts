import { Component, inject, OnInit, effect } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { ReminderNotificationService } from './core/services/reminder-notification.service';
import { AuthStore } from './core/services/auth.store';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ToastComponent],
  template: `
    <app-navbar />
    <main class="main-content">
      <router-outlet />
    </main>
    <app-toast />
  `,
  styles: [`
    :host { display: flex; flex-direction: column; min-height: 100vh; }
    .main-content { flex: 1; }
  `]
})
export class AppComponent implements OnInit {
  private reminderNotif = inject(ReminderNotificationService);
  private auth = inject(AuthStore);

  constructor() {
    // Start/stop reminder polling based on login state
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.reminderNotif.start();
      } else {
        this.reminderNotif.stop();
      }
    });
  }

  ngOnInit() {}
}
