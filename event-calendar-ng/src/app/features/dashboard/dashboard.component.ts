import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EventApiService, TicketApiService, ReminderApiService, CategoryApiService } from '../../core/services/api.service';
import { AuthStore } from '../../core/services/auth.store';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { EventResponse, TicketResponse, ReminderResponse } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-sub">Welcome back, <strong>{{ auth.user()?.fullName || auth.user()?.username }}</strong></p>
        </div>
        @if (auth.isAdmin()) {
          <a routerLink="/events/new" class="btn">+ New Event</a>
        }
      </div>

      @if (loading()) {
        <app-loading [full]="true" text="Loading dashboard…" />
      } @else {
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon stat-icon--blue">📅</div>
            <div class="stat-body">
              <span class="stat-value">{{ totalEvents() }}</span>
              <span class="stat-label">Total Events</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon--green">🎫</div>
            <div class="stat-body">
              <span class="stat-value">{{ myTickets().length }}</span>
              <span class="stat-label">My Tickets</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon--amber">🔔</div>
            <div class="stat-body">
              <span class="stat-value">{{ pendingReminders() }}</span>
              <span class="stat-label">Pending Reminders</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon--purple">🏷️</div>
            <div class="stat-body">
              <span class="stat-value">{{ totalCategories() }}</span>
              <span class="stat-label">Categories</span>
            </div>
          </div>
        </div>

        <div class="dash-grid">
          <section class="dash-section">
            <div class="section-header">
              <h2 class="section-title">Upcoming Events</h2>
              <a routerLink="/events" class="section-link">View all →</a>
            </div>
            <div class="event-list">
              @for (ev of upcomingEvents(); track ev.id) {
                <a [routerLink]="['/events', ev.id]" class="event-row">
                  <div class="event-row__color" [style.background]="ev.category?.colorCode || '#6366f1'"></div>
                  <div class="event-row__body">
                    <span class="event-row__title">{{ ev.title }}</span>
                    <span class="event-row__meta">{{ ev.startDateTime | date:'MMM d, y · h:mm a' }}</span>
                  </div>
                  <div class="event-row__badge" [class]="'badge badge--' + (ev.isActive ? 'green' : 'red')">
                    {{ ev.isActive ? 'Active' : 'Inactive' }}
                  </div>
                </a>
              } @empty {
                <p class="empty-state">No upcoming events found.</p>
              }
            </div>
          </section>

          <section class="dash-section">
            <div class="section-header">
              <h2 class="section-title">Recent Tickets</h2>
              <a routerLink="/tickets" class="section-link">View all →</a>
            </div>
            <div class="event-list">
              @for (tk of recentTickets(); track tk.id) {
                <a [routerLink]="['/tickets']" class="event-row">
                  <div class="event-row__icon">🎫</div>
                  <div class="event-row__body">
                    <span class="event-row__title">{{ tk.eventTitle }}</span>
                    <span class="event-row__meta">{{ tk.ticketNumber }} · {{ tk.type }}</span>
                  </div>
                  <div [class]="'badge badge--' + statusColor(tk.status)">{{ tk.status }}</div>
                </a>
              } @empty {
                <p class="empty-state">No tickets yet. <a routerLink="/events">Browse events →</a></p>
              }
            </div>
          </section>

          <section class="dash-section">
            <div class="section-header">
              <h2 class="section-title">Upcoming Reminders</h2>
              <a routerLink="/reminders" class="section-link">View all →</a>
            </div>
            <div class="event-list">
              @for (rm of reminders().slice(0, 5); track rm.id) {
                <div class="event-row">
                  <div class="event-row__icon">🔔</div>
                  <div class="event-row__body">
                    <span class="event-row__title">{{ rm.title }}</span>
                    <span class="event-row__meta">{{ rm.eventTitle }} · {{ rm.reminderDateTime | date:'MMM d · h:mm a' }}</span>
                  </div>
                  <div [class]="rm.isSent ? 'badge badge--gray' : 'badge badge--amber'">
                    {{ rm.isSent ? 'Sent' : 'Pending' }}
                  </div>
                </div>
              } @empty {
                <p class="empty-state">No reminders set.</p>
              }
            </div>
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    .dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem; }
    .dash-section:last-child { grid-column: 1 / -1; }
    @media(max-width:900px) { .dash-grid { grid-template-columns: 1fr; } .dash-section:last-child { grid-column: auto; } }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem; display: flex; align-items: center; gap: 1rem; transition: transform .2s, box-shadow .2s; }
    .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,.2); }
    .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; }
    .stat-icon--blue   { background: rgba(59,130,246,.15); }
    .stat-icon--green  { background: rgba(16,185,129,.15); }
    .stat-icon--amber  { background: rgba(245,158,11,.15); }
    .stat-icon--purple { background: rgba(139,92,246,.15); }
    .stat-body { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.875rem; font-weight: 800; color: var(--text); line-height: 1; }
    .stat-label { font-size: .8125rem; color: var(--muted); margin-top: .25rem; }
    .dash-section { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
    .section-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); }
    .section-title { font-size: 1rem; font-weight: 700; color: var(--text); }
    .section-link { font-size: .8125rem; color: var(--accent); text-decoration: none; }
    .section-link:hover { text-decoration: underline; }
    .event-list { padding: .5rem; }
    .event-row { display: flex; align-items: center; gap: .875rem; padding: .75rem 1rem; border-radius: 10px; text-decoration: none; color: inherit; transition: background .15s; }
    .event-row:hover { background: var(--surface2); }
    .event-row__color { width: 4px; height: 36px; border-radius: 4px; flex-shrink: 0; }
    .event-row__icon { font-size: 1.25rem; width: 32px; text-align: center; flex-shrink: 0; }
    .event-row__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: .125rem; }
    .event-row__title { font-size: .875rem; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .event-row__meta { font-size: .75rem; color: var(--muted); }
    .event-row__badge { flex-shrink: 0; }
    .empty-state { padding: 1.5rem; text-align: center; color: var(--muted); font-size: .875rem; }
    .empty-state a { color: var(--accent); }
  `]
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthStore);
  private eventApi    = inject(EventApiService);
  private ticketApi   = inject(TicketApiService);
  private reminderApi = inject(ReminderApiService);
  private categoryApi = inject(CategoryApiService);

  loading         = signal(true);
  events          = signal<EventResponse[]>([]);
  myTickets       = signal<TicketResponse[]>([]);
  reminders       = signal<ReminderResponse[]>([]);
  totalEvents     = signal(0);
  totalCategories = signal(0);

  upcomingEvents  = computed(() => this.events().filter(e => e.isActive).slice(0, 5));
  recentTickets   = computed(() => this.myTickets().slice(0, 5));
  pendingReminders = computed(() => this.reminders().filter(r => !r.isSent).length);

  ngOnInit() {
    let done = 0;
    const check = () => { if (++done === 4) this.loading.set(false); };

    this.eventApi.getAll(1, 20).subscribe({
      next: r => { this.events.set(r.items); this.totalEvents.set(r.totalCount); check(); },
      error: () => check()
    });
    this.ticketApi.getMyTickets().subscribe({
      next: t => { this.myTickets.set(t); check(); },
      error: () => check()
    });
    this.reminderApi.getMine(1, 20).subscribe({
      next: r => { this.reminders.set(r.items); check(); },
      error: () => check()
    });
    this.categoryApi.getAll(1, 100).subscribe({
      next: r => { this.totalCategories.set(r.totalCount); check(); },
      error: () => check()
    });
  }

  statusColor(status: string): string {
    const map: Record<string, string> = {
      Reserved: 'blue', Confirmed: 'green', Cancelled: 'red', Attended: 'purple'
    };
    return map[status] ?? 'gray';
  }
}
