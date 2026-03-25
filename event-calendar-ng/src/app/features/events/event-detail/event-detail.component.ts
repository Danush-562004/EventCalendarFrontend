import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventApiService, TicketApiService, ReminderApiService } from '../../../core/services/api.service';
import { AuthStore } from '../../../core/services/auth.store';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EventResponse, TicketResponse, CreateTicketRequest, CreateReminderRequest } from '../../../core/models';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LoadingComponent, ConfirmDialogComponent],
  template: `
    <div class="page">
      @if (loading()) {
        <app-loading [full]="true" text="Loading event…" />
      } @else if (event()) {
        <!-- Back -->
        <a routerLink="/events" class="back-link">← Back to Events</a>

        <div class="event-detail">
          <!-- Header -->
          <div class="event-detail__header">
            <div class="event-detail__cat" [style.background]="event()!.category?.colorCode + '22'" [style.color]="event()!.category?.colorCode">
              {{ event()!.category?.name }}
            </div>
            <div class="event-detail__actions">
              @if (auth.isAdmin()) {
                <a [routerLink]="['/events', event()!.id, 'edit']" class="btn btn--ghost btn--sm">✏️ Edit</a>
                <button class="btn btn--danger btn--sm" (click)="confirmDelete = true">🗑 Delete</button>
              }
            </div>
          </div>

          <h1 class="event-detail__title">{{ event()!.title }}</h1>

          @if (isEventPast()) {
            <div class="past-event-banner">⏰ This event has ended — booking is no longer available.</div>
          }

          <!-- Event Banner -->
          <div class="event-detail__banner" [style.background]="getBannerGradient(event()!.category?.name, event()!.category?.colorCode)">
            <span class="event-detail__banner-icon">{{ getCategoryIcon(event()!.category?.name) }}</span>
            <div class="event-detail__banner-overlay">
              <span class="event-detail__banner-date">{{ event()!.startDateTime | date:'EEEE, MMMM d, y' }}</span>
            </div>
          </div>

          <div class="event-detail__meta-bar">
            <span>📅 {{ event()!.startDateTime | date:'EEEE, MMMM d, y · h:mm a' }}</span>
            <span>🏁 Ends {{ event()!.endDateTime | date:'EEEE, MMMM d, y · h:mm a' }}</span>
            @if (event()!.venue) {
              <span>📍 {{ event()!.venue!.name }}, {{ event()!.venue!.city }}</span>
            } @else if (event()!.location) {
              <span>📍 {{ event()!.location }}</span>
            }
            <span>👤 {{ event()!.organizerName }}</span>
          </div>

          @if (event()!.description) {
            <div class="event-detail__desc">{{ event()!.description }}</div>
          }

          <div class="event-detail__info-grid">
            <div class="info-card">
              <span class="info-card__label">Attendees</span>
              <span class="info-card__value">{{ event()!.ticketCount }}{{ event()!.maxAttendees > 0 ? ' / ' + event()!.maxAttendees : ' registered' }}</span>
            </div>
            @if (event()!.maxAttendees > 0) {
              <div class="info-card" [class.info-card--warn]="event()!.availableSeats <= 5">
                <span class="info-card__label">Available Seats</span>
                <span class="info-card__value">{{ event()!.availableSeats === 0 ? 'Sold Out' : event()!.availableSeats }}</span>
              </div>
            }
            <div class="info-card">
              <span class="info-card__label">Ticket Price</span>
              <span class="info-card__value">{{ event()!.price > 0 ? '₹' + (event()!.price | number) : 'Free' }}</span>
            </div>
            @if (event()!.venue) {
              <div class="info-card">
                <span class="info-card__label">Venue Capacity</span>
                <span class="info-card__value">{{ event()!.venue!.capacity | number }}</span>
              </div>
              <div class="info-card">
                <span class="info-card__label">Location</span>
                <span class="info-card__value">{{ event()!.venue!.address }}, {{ event()!.venue!.city }}, {{ event()!.venue!.state }}</span>
              </div>
            }
            @if (event()!.reminderEnabled) {
              <div class="info-card">
                <span class="info-card__label">Reminder</span>
                <span class="info-card__value">{{ event()!.reminderMinutesBefore }} min before</span>
              </div>
            }
          </div>

          <!-- Book Ticket Section (users only) -->
          @if (!auth.isAdmin() && auth.isLoggedIn() && event()!.isActive && !isEventPast()) {
            <div class="ticket-section">
              <h2 class="section-h2">Book a Ticket</h2>

              <!-- Availability info -->
              <div class="availability-bar">
                @if (event()!.maxAttendees > 0) {
                  <span class="avail-badge" [class.avail-badge--low]="event()!.availableSeats <= 5">
                    🎟 {{ event()!.availableSeats }} seats available
                  </span>
                  @if (event()!.availableSeats === 0) {
                    <span class="avail-badge avail-badge--full">Sold Out</span>
                  }
                } @else {
                  <span class="avail-badge">🎟 Unlimited seats</span>
                }
                @if (event()!.price > 0) {
                  <span class="price-badge">₹{{ event()!.price | number }} per ticket</span>
                } @else {
                  <span class="price-badge price-badge--free">Free</span>
                }
              </div>

              <div class="ticket-form">
                <div class="form-field">
                  <label class="form-label">Ticket Type</label>
                  <div class="type-badge">
                    {{ event()!.price > 0 ? 'Paid' : 'Free' }}
                  </div>
                </div>
                <div class="form-field">
                  <label class="form-label">Quantity</label>
                  <input class="form-input" type="number" [(ngModel)]="ticketQty" min="1" [max]="event()!.maxAttendees > 0 ? event()!.availableSeats : 10">
                </div>
                <div class="form-field">
                  <label class="form-label">Seat Number <span class="optional">(optional)</span></label>
                  <input class="form-input" type="text" [(ngModel)]="seatNumber" placeholder="e.g. A12">
                </div>
                @if (event()!.price > 0) {
                  <div class="price-summary">
                    <span class="price-summary__label">Total</span>
                    <span class="price-summary__value">₹{{ (event()!.price * ticketQty) | number }}</span>
                  </div>
                }
                <button class="btn" [disabled]="bookingTicket() || (event()!.maxAttendees > 0 && event()!.availableSeats === 0)" (click)="bookTicket()">
                  @if (bookingTicket()) { <span class="btn-spinner"></span> }
                  {{ event()!.maxAttendees > 0 && event()!.availableSeats === 0 ? 'Sold Out' : 'Book Ticket' }}
                </button>
              </div>
            </div>
          }

          <!-- Set Reminder Section (users only, not admin) -->
          @if (!auth.isAdmin() && auth.isLoggedIn() && event()!.isActive && !isEventPast()) {
            <div class="ticket-section">
              <h2 class="section-h2">Set a Reminder</h2>
              <div class="ticket-form">
                <div class="form-field">
                  <label class="form-label">Title</label>
                  <input class="form-input" [(ngModel)]="reminderTitle" placeholder="Reminder title">
                </div>
                <div class="form-field">
                  <label class="form-label">Date & Time</label>
                  <input class="form-input" type="datetime-local" [(ngModel)]="reminderDateTime" [min]="minReminderDateTime">
                </div>
                <div class="form-field">
                  <label class="form-label">Type</label>
                  <select class="form-select" [(ngModel)]="reminderType">
                    <option value="Email">Email</option>
                    <option value="Push">Push</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
                <button class="btn btn--ghost" [disabled]="addingReminder()" (click)="addReminder()">
                  @if (addingReminder()) { <span class="btn-spinner"></span> }
                  🔔 Set Reminder
                </button>
              </div>
            </div>
          }

          <!-- Tickets List (admin only) -->
          @if (auth.isAdmin() && tickets().length > 0) {
            <div class="ticket-section">
              <h2 class="section-h2">Ticket List ({{ tickets().length }})</h2>
              <div class="table-wrap">
                <table class="table">
                  <thead><tr>
                    <th>Ticket #</th><th>User</th><th>Type</th><th>Status</th><th>Qty</th><th>Price</th>
                  </tr></thead>
                  <tbody>
                    @for (tk of tickets(); track tk.id) {
                      <tr>
                        <td><span class="mono">{{ tk.ticketNumber }}</span></td>
                        <td>{{ tk.userFullName }}</td>
                        <td><span class="badge badge--blue">{{ tk.type }}</span></td>
                        <td><span class="badge" [class]="'badge--' + statusColor(tk.status)">{{ tk.status }}</span></td>
                        <td>{{ tk.quantity }}</td>
                        <td>₹{{ tk.price | number }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="empty-full"><p>Event not found.</p><a routerLink="/events" class="btn btn--sm">Back to Events</a></div>
      }

      <app-confirm-dialog
        [open]="confirmDelete"
        title="Delete Event"
        message="This will soft-delete the event and make it inactive. Continue?"
        confirmLabel="Delete"
        (confirm)="deleteEvent()"
        (cancel)="confirmDelete = false"
      />
    </div>
  `,
  styles: [`
    .event-detail__banner { height: 220px; border-radius: 16px; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
    .event-detail__banner-icon { font-size: 6rem; filter: drop-shadow(0 4px 12px rgba(0,0,0,.2)); }
    .event-detail__banner-overlay { position: absolute; bottom: 0; left: 0; right: 0; padding: 1rem 1.25rem; background: linear-gradient(transparent, rgba(0,0,0,.55)); }
    .event-detail__banner-date { font-size: .9375rem; color: rgba(255,255,255,.92); font-weight: 600; }
    .back-link { display: inline-flex; align-items: center; gap: .375rem; color: var(--muted); font-size: .875rem; text-decoration: none; margin-bottom: 1.5rem; }
    .back-link:hover { color: var(--text); }
    .event-detail { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 2rem; }
    .event-detail__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
    .event-detail__cat { font-size: .75rem; font-weight: 700; padding: .375rem .875rem; border-radius: 8px; }
    .event-detail__actions { display: flex; gap: .5rem; }
    .event-detail__title { font-size: 2rem; font-weight: 900; color: var(--text); margin-bottom: 1rem; line-height: 1.2; }
    .event-detail__meta-bar { display: flex; gap: 1.25rem; flex-wrap: wrap; color: var(--muted); font-size: .875rem; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border); }
    .event-detail__desc { color: var(--text); font-size: .9375rem; line-height: 1.7; margin-bottom: 1.5rem; }
    .event-detail__info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .info-card { background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; padding: 1rem; display: flex; flex-direction: column; gap: .25rem; }
    .info-card--warn { border-color: #f59e0b; background: rgba(245,158,11,.08); }
    .info-card__label { font-size: .75rem; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; }
    .info-card__value { font-size: .9375rem; font-weight: 600; color: var(--text); }
    .ticket-section { border-top: 1px solid var(--border); padding-top: 1.5rem; margin-top: 1.5rem; }
    .section-h2 { font-size: 1.125rem; font-weight: 700; color: var(--text); margin-bottom: 1rem; }
    .availability-bar { display: flex; gap: .75rem; align-items: center; flex-wrap: wrap; margin-bottom: 1rem; }
    .avail-badge { font-size: .8125rem; font-weight: 600; padding: .375rem .875rem; border-radius: 20px; background: rgba(16,185,129,.12); color: #10b981; }
    .avail-badge--low { background: rgba(245,158,11,.12); color: #f59e0b; }
    .avail-badge--full { background: rgba(239,68,68,.12); color: #ef4444; }
    .price-badge { font-size: .8125rem; font-weight: 700; padding: .375rem .875rem; border-radius: 20px; background: rgba(167,139,250,.12); color: var(--accent); }
    .price-badge--free { background: rgba(16,185,129,.12); color: #10b981; }
    .ticket-form { display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end; }
    .ticket-form .form-field { min-width: 160px; }
    .type-badge { display: inline-flex; align-items: center; padding: .5rem 1rem; background: var(--surface2); border: 1px solid var(--border); border-radius: var(--radius); font-size: .9375rem; font-weight: 600; color: var(--accent); }
    .price-summary { display: flex; flex-direction: column; gap: .25rem; padding: .75rem 1rem; background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; min-width: 120px; }
    .price-summary__label { font-size: .75rem; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; }
    .price-summary__value { font-size: 1.125rem; font-weight: 800; color: var(--accent); }
    .mono { font-family: 'JetBrains Mono', monospace; font-size: .8125rem; }
    .empty-full { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem; color: var(--muted); }
    .past-event-banner { background: rgba(255,59,48,.08); border: 1px solid rgba(255,59,48,.2); border-radius: 10px; padding: .75rem 1rem; font-size: .875rem; color: #c0392b; margin-bottom: 1rem; font-weight: 500; }
  `]
})
export class EventDetailComponent implements OnInit {
  auth = inject(AuthStore);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventApi = inject(EventApiService);
  private ticketApi = inject(TicketApiService);
  private reminderApi = inject(ReminderApiService);
  private toast = inject(ToastService);

  loading = signal(true);
  event = signal<EventResponse | null>(null);
  tickets = signal<TicketResponse[]>([]);
  bookingTicket = signal(false);
  addingReminder = signal(false);
  confirmDelete = false;

  ticketQty = 1;
  seatNumber = '';
  reminderTitle = '';
  reminderDateTime = '';
  reminderType: any = 'Email';

  get minReminderDateTime(): string {
    return new Date().toISOString().slice(0, 16);
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.eventApi.getById(id).subscribe({
      next: ev => {
        this.event.set(ev);
        this.loading.set(false);
        if (this.auth.isAdmin()) {
          this.ticketApi.getByEvent(id).subscribe({ next: t => this.tickets.set(t) });
        }
      },
      error: () => this.loading.set(false)
    });
  }

  bookTicket() {
    const ev = this.event();
    if (!ev) return;
    if (ev.maxAttendees > 0 && ev.availableSeats < this.ticketQty) {
      this.toast.error(`Only ${ev.availableSeats} seats available.`);
      return;
    }
    this.bookingTicket.set(true);
    // Derive ticket type from event price — no user choice needed
    const type = ev.price > 0 ? 'Paid' : 'Free';
    const req: CreateTicketRequest = { eventId: ev.id, type, quantity: this.ticketQty };
    if (this.seatNumber) req.seatNumber = this.seatNumber;
    this.ticketApi.create(req).subscribe({
      next: t => {
        const totalPrice = ev.price > 0 ? ` · Total: ₹${(ev.price * this.ticketQty).toLocaleString()}` : '';
        this.toast.success(`Ticket booked! #${t.ticketNumber}${totalPrice}`);
        this.bookingTicket.set(false);
        this.event.update(e => e ? {
          ...e,
          ticketCount: e.ticketCount + 1,
          availableSeats: Math.max(0, e.availableSeats - this.ticketQty)
        } : e);
        this.ticketQty = 1;
        this.seatNumber = '';
      },
      error: (err) => {
        const msg = err?.error?.message || 'Failed to book ticket. Please try again.';
        this.toast.error(msg);
        this.bookingTicket.set(false);
      }
    });
  }

  addReminder() {
    const ev = this.event();
    if (!ev || !this.reminderTitle || !this.reminderDateTime) {
      this.toast.warning('Please fill reminder title and date/time.'); return;
    }
    if (new Date(this.reminderDateTime) <= new Date()) {
      this.toast.error('Reminder time must be in the future.'); return;
    }
    this.addingReminder.set(true);
    const req: CreateReminderRequest = {
      title: this.reminderTitle,
      reminderDateTime: this.reminderDateTime,
      type: this.reminderType,
      eventId: ev.id
    };
    this.reminderApi.create(req).subscribe({
      next: () => {
        this.toast.success('⏰ Reminder set! You will be notified at the scheduled time.');
        this.addingReminder.set(false);
        this.reminderTitle = '';
        this.reminderDateTime = '';
      },
      error: () => {
        this.toast.error('Failed to set reminder.');
        this.addingReminder.set(false);
      }
    });
  }

  deleteEvent() {
    const ev = this.event();
    if (!ev) return;
    this.eventApi.delete(ev.id).subscribe({
      next: () => {
        this.toast.success('Event deleted successfully.');
        this.router.navigate(['/events']);
      },
      error: () => this.toast.error('Failed to delete event.')
    });
  }

  statusColor(status: string) {
    const m: Record<string, string> = { Reserved: 'blue', Confirmed: 'green', Cancelled: 'red', Attended: 'purple' };
    return m[status] || 'gray';
  }

  isEventPast(): boolean {
    const ev = this.event();
    if (!ev) return false;
    return new Date(ev.endDateTime) <= new Date();
  }

  getBannerGradient(name?: string, color?: string): string {
    const c = color || '#6366f1';
    const gradients: Record<string, string> = {
      music:    `linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, ${c}88 100%)`,
      sport:    `linear-gradient(135deg, #134e5e 0%, #71b280 100%)`,
      tech:     `linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)`,
      art:      `linear-gradient(135deg, #f093fb 0%, #f5576c 100%)`,
      food:     `linear-gradient(135deg, #f7971e 0%, #ffd200 100%)`,
      business: `linear-gradient(135deg, #1c3c5a 0%, #2d6a9f 100%)`,
      health:   `linear-gradient(135deg, #11998e 0%, #38ef7d 100%)`,
      education:`linear-gradient(135deg, #4776e6 0%, #8e54e9 100%)`,
      film:     `linear-gradient(135deg, #232526 0%, #414345 100%)`,
      travel:   `linear-gradient(135deg, #2980b9 0%, #6dd5fa 80%, #fff 100%)`,
    };
    if (!name) return `linear-gradient(135deg, ${c}55, ${c}22)`;
    const n = name.toLowerCase();
    for (const [key, grad] of Object.entries(gradients)) {
      if (n.includes(key)) return grad;
    }
    return `linear-gradient(135deg, ${c}88 0%, ${c}33 100%)`;
  }

  getCategoryIcon(name?: string): string {
    if (!name) return '🎭';
    const n = name.toLowerCase();
    if (n.includes('music') || n.includes('concert')) return '🎵';
    if (n.includes('sport') || n.includes('game')) return '⚽';
    if (n.includes('tech') || n.includes('code') || n.includes('dev')) return '💻';
    if (n.includes('art') || n.includes('paint') || n.includes('gallery')) return '🎨';
    if (n.includes('food') || n.includes('cook') || n.includes('culinary')) return '🍽️';
    if (n.includes('business') || n.includes('conference') || n.includes('summit')) return '💼';
    if (n.includes('health') || n.includes('wellness') || n.includes('yoga')) return '🧘';
    if (n.includes('education') || n.includes('workshop') || n.includes('seminar')) return '📚';
    if (n.includes('film') || n.includes('movie') || n.includes('cinema')) return '🎬';
    if (n.includes('travel') || n.includes('tour')) return '✈️';
    return '🎭';
  }
}
