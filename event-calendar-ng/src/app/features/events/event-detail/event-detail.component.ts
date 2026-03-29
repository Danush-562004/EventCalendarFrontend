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
          <div class="event-detail__banner">
            <img [src]="getEventDetailImg(event()!.id, event()!.category?.name)" [alt]="event()!.title" class="event-detail__banner-photo">
            <div class="event-detail__banner-overlay">
              <span class="event-detail__banner-icon">{{ getCategoryIcon(event()!.category?.name) }}</span>
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

          <!-- Sign in to book — guests only -->
          @if (!auth.isLoggedIn() && event()!.isActive && !isEventPast()) {
            <div class="ticket-section signin-cta">
              <div class="signin-cta__body">
                <span class="signin-cta__icon">🎟️</span>
                <div>
                  <p class="signin-cta__title">Want to attend this event?</p>
                  <p class="signin-cta__sub">Sign in to book your tickets.</p>
                </div>
                <a routerLink="/auth/login" class="btn">Sign in to Book Tickets</a>
              </div>
            </div>
          }

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
                  <label class="form-label">Quantity <span class="qty-limit">(max 10 per event)</span></label>
                  <div class="qty-stepper">
                    <button type="button" class="qty-btn" (click)="decQty()" [disabled]="ticketQty <= 1">−</button>
                    <span class="qty-val">{{ ticketQty }}</span>
                    <button type="button" class="qty-btn" (click)="incQty()" [disabled]="ticketQty >= maxQty()">+</button>
                  </div>
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
    .event-detail__banner { height: 280px; border-radius: 16px; margin-bottom: 1.5rem; position: relative; overflow: hidden; }
    .event-detail__banner-photo { width: 100%; height: 100%; object-fit: cover; display: block; }
    .event-detail__banner-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,.1) 0%, rgba(0,0,0,.6) 100%); display: flex; align-items: flex-end; padding: 1.25rem 1.5rem; gap: .75rem; }
    .event-detail__banner-icon { font-size: 2.5rem; filter: drop-shadow(0 2px 6px rgba(0,0,0,.4)); }
    .event-detail__banner-date { font-size: 1rem; color: #fff; font-weight: 700; text-shadow: 0 1px 4px rgba(0,0,0,.5); }
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
    .qty-limit { font-weight: 400; color: var(--muted); font-size: .75rem; }
    .qty-stepper { display: flex; align-items: center; gap: .5rem; }
    .qty-btn { width: 36px; height: 36px; border-radius: 50%; border: 1.5px solid var(--border); background: var(--surface2); color: var(--text); font-size: 1.25rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .12s, border-color .12s; line-height: 1; }
    .qty-btn:hover:not(:disabled) { background: var(--accent); border-color: var(--accent); color: #fff; }
    .qty-btn:disabled { opacity: .35; cursor: not-allowed; }
    .qty-val { min-width: 2rem; text-align: center; font-size: 1.125rem; font-weight: 700; color: var(--text); }
    .type-badge { display: inline-flex; align-items: center; padding: .5rem 1rem; background: var(--surface2); border: 1px solid var(--border); border-radius: var(--radius); font-size: .9375rem; font-weight: 600; color: var(--accent); }
    .price-summary { display: flex; flex-direction: column; gap: .25rem; padding: .75rem 1rem; background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; min-width: 120px; }
    .price-summary__label { font-size: .75rem; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; }
    .price-summary__value { font-size: 1.125rem; font-weight: 800; color: var(--accent); }
    .mono { font-family: 'JetBrains Mono', monospace; font-size: .8125rem; }
    .empty-full { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem; color: var(--muted); }
    .past-event-banner { background: rgba(255,59,48,.08); border: 1px solid rgba(255,59,48,.2); border-radius: 10px; padding: .75rem 1rem; font-size: .875rem; color: #c0392b; margin-bottom: 1rem; font-weight: 500; }
    .signin-cta { background: rgba(0,113,227,.04); border: 1px solid rgba(0,113,227,.15) !important; border-radius: 14px; }
    .signin-cta__body { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .signin-cta__icon { font-size: 2rem; flex-shrink: 0; }
    .signin-cta__title { font-size: .9375rem; font-weight: 700; color: var(--text); margin: 0; }
    .signin-cta__sub { font-size: .8125rem; color: var(--muted); margin: .125rem 0 0; }
    .signin-cta .btn { margin-left: auto; white-space: nowrap; }
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

  /** Upper bound = min(10, availableSeats) */
  maxQty(): number {
    const ev = this.event();
    if (!ev) return 10;
    const seatCap = ev.maxAttendees > 0 ? ev.availableSeats : 10;
    return Math.min(10, seatCap);
  }

  incQty() { if (this.ticketQty < this.maxQty()) this.ticketQty++; }
  decQty() { if (this.ticketQty > 1) this.ticketQty--; }
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

  getBannerGradient(name?: string, color?: string): string { return ''; }

  private readonly DETAIL_PHOTOS = [
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80',
    'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1200&q=80',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80',
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&q=80',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80',
    'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&q=80',
    'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200&q=80',
    'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=1200&q=80',
    'https://images.unsplash.com/photo-1563841930606-67e2bce48b78?w=1200&q=80',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80',
  ];

  getEventDetailImg(id: number, categoryName?: string): string {
    return this.DETAIL_PHOTOS[id % this.DETAIL_PHOTOS.length];
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
