import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketApiService, PaymentApiService } from '../../core/services/api.service';
import { AuthStore } from '../../core/services/auth.store';
import { ToastService } from '../../shared/components/toast/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { TicketResponse, CreatePaymentRequest, PaymentMethod } from '../../core/models';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LoadingComponent, ConfirmDialogComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">My Tickets</h1>
          <p class="page-sub">Manage your event bookings</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <div class="search-wrap">
          <span class="search-icon">🔍</span>
          <input class="search-input" [(ngModel)]="filterKeyword" placeholder="Search by event…" (input)="applyFilter()">
        </div>
        <select class="form-select filter-select" [(ngModel)]="filterStatus" (change)="applyFilter()">
          <option value="">All Statuses</option>
          <option value="Reserved">Reserved</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Attended">Attended</option>
        </select>
        <input class="form-input filter-price" type="number" [(ngModel)]="filterMinPrice" (input)="applyFilter()" placeholder="Min ₹" min="0">
        <input class="form-input filter-price" type="number" [(ngModel)]="filterMaxPrice" (input)="applyFilter()" placeholder="Max ₹" min="0">
        <button class="btn btn--ghost btn--sm" (click)="clearFilter()">Clear</button>
      </div>

      @if (loading()) {
        <app-loading text="Loading tickets..." />
      } @else {
        <div class="tickets-list">
          @for (tk of filteredTickets(); track tk.id) {
            <div class="ticket-card" [class.cancelled]="tk.status === 'Cancelled'">
              <div class="ticket-card__left">
                <div class="ticket-card__number">{{ tk.ticketNumber }}</div>
                <div class="ticket-card__event">{{ tk.eventTitle }}</div>
                <div class="ticket-card__meta">
                  <span class="badge badge--blue">{{ tk.type }}</span>
                  <span class="badge" [class]="'badge--' + statusColor(tk.status)">{{ tk.status }}</span>
                  @if (tk.seatNumber) { <span class="badge badge--gray">Seat {{ tk.seatNumber }}</span> }
                </div>
                <div class="ticket-card__info">
                  Qty: {{ tk.quantity }} &middot; Price: {{ tk.price | number }}
                  @if (tk.checkedIn) { &middot; Checked In {{ tk.checkInTime | date:'MMM d, h:mm a' }} }
                </div>
                <div class="ticket-card__date">Booked {{ tk.createdAt | date:'MMM d, y' }}</div>
              </div>
              <div class="ticket-card__right">
                @if (tk.payments?.length) {
                  <div class="payment-summary">
                    @for (p of tk.payments; track p.id) {
                      <div class="payment-row">
                        <span>{{ p.method }}</span>
                        <span>{{ p.amount | number }}</span>
                        <span class="badge" [class]="'badge--' + paymentColor(p.status)">{{ p.status }}</span>
                      </div>
                    }
                  </div>
                }
                <div class="ticket-card__actions">
                @if (tk.status !== 'Cancelled' && !auth.isAdmin()) {
                  @if (!hasCompletedPayment(tk) && !isEventExpired(tk) && !isPaymentExpired(tk)) {
                    <div class="pay-timer" [class.pay-timer--urgent]="getSecondsLeft(tk) <= 60">
                      ⏱ Pay within {{ formatTimer(tk) }}
                    </div>
                    <button class="btn btn--ghost btn--sm" (click)="openPayment(tk)">Pay</button>
                    <button class="btn btn--danger btn--sm" (click)="cancelTarget = tk; confirmCancel = true">Cancel</button>
                  }
                  @if (!hasCompletedPayment(tk) && !isEventExpired(tk) && isPaymentExpired(tk)) {
                    <span class="badge badge--red">⏰ Payment Time Exceeded</span>
                  }
                  @if (isEventExpired(tk) && !hasCompletedPayment(tk)) {
                    <span class="badge badge--gray">Event Ended</span>
                  }
                  @if (hasCompletedPayment(tk)) {
                    <span class="badge badge--green">✓ Paid</span>
                  }
                }
                </div>
              </div>
            </div>
          } @empty {
            <div class="empty-full">
              <span class="empty-icon">🎫</span>
              <p>No tickets yet</p>
              <a routerLink="/events" class="btn btn--sm">Browse Events</a>
            </div>
          }
        </div>
      }

      @if (paymentTarget()) {
  <div class="modal-overlay" (click)="paymentTarget.set(null)">
    <div class="modal" (click)="$event.stopPropagation()">
      <h3 class="modal__title">Process Payment</h3>
      <p class="modal__sub">{{ paymentTarget()!.ticketNumber }}</p>

      <!-- Price breakdown -->
      <div class="payment-breakdown">
        <div class="breakdown-row">
          <span>Price per ticket</span>
          <span>{{ paymentTarget()!.price > 0 ? ('₹' + (paymentTarget()!.price | number)) : 'Free' }}</span>
        </div>
        <div class="breakdown-row">
          <span>Quantity</span>
          <span>× {{ paymentTarget()!.quantity }}</span>
        </div>
        <div class="breakdown-row breakdown-row--total">
          <span>Total</span>
          <span>{{ payAmount > 0 ? ('₹' + (payAmount | number) + ' ' + payCurrency) : 'Free' }}</span>
        </div>
      </div>

      <div class="form-field">
        <label class="form-label">Currency</label>
        <select class="form-select" [(ngModel)]="payCurrency" [disabled]="payAmount === 0">
          <option>INR</option><option>USD</option><option>EUR</option>
        </select>
      </div>
      <div class="form-field">
        <label class="form-label">Payment Method</label>
        <select class="form-select" [(ngModel)]="payMethod" [disabled]="payAmount === 0">
          <option value="CreditCard">Credit Card</option>
          <option value="DebitCard">Debit Card</option>
          <option value="PayPal">PayPal</option>
          <option value="BankTransfer">Bank Transfer</option>
          <option value="Cash">Cash</option>
        </select>
      </div>
      <div class="form-field" *ngIf="payAmount > 0">
        <label class="form-label">Transaction ID (auto-generated)</label>
        <input class="form-input form-input--mono" [(ngModel)]="payTxnId" readonly>
      </div>
      <div class="modal__actions">
        <button class="btn btn--ghost" (click)="paymentTarget.set(null)">Cancel</button>
        <button class="btn" [disabled]="paying()" (click)="processPayment()">
          @if (paying()) { <span class="btn-spinner"></span> Processing... }
          @else if (payAmount > 0) { Pay ₹{{ payAmount | number }} {{ payCurrency }} }
          @else { Confirm Free Ticket }
        </button>
      </div>
    </div>
  </div>
}
      <app-confirm-dialog
        [open]="confirmCancel"
        title="Cancel Ticket"
        message="Are you sure you want to cancel this ticket?"
        confirmLabel="Yes, Cancel"
        (confirm)="cancelTicket()"
        (cancel)="confirmCancel = false"
      />
    </div>
  `,
  styles: [`
    .tickets-list { display: flex; flex-direction: column; gap: 1rem; }
    .ticket-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
      padding: 1.5rem; display: flex; justify-content: space-between; gap: 1.5rem;
      transition: box-shadow .2s; border-left: 3px solid var(--accent);
    }
    .ticket-card:hover { box-shadow: 0 4px 24px rgba(0,0,0,.2); }
    .ticket-card.cancelled { opacity: .6; border-left-color: #ef4444; }
    .ticket-card__left { flex: 1; display: flex; flex-direction: column; gap: .5rem; min-width: 0; }
    .ticket-card__number { font-family: 'JetBrains Mono', monospace; font-size: .8125rem; color: var(--accent); font-weight: 700; }
    .ticket-card__event { font-size: 1.0625rem; font-weight: 700; color: var(--text); }
    .ticket-card__meta { display: flex; gap: .5rem; flex-wrap: wrap; }
    .ticket-card__info { font-size: .8125rem; color: var(--muted); }
    .ticket-card__date { font-size: .75rem; color: var(--muted); }
    .ticket-card__right { display: flex; flex-direction: column; align-items: flex-end; gap: .75rem; justify-content: space-between; flex-shrink: 0; }
    .ticket-card__actions { display: flex; gap: .5rem; align-items: center; flex-wrap: wrap; }
    .pay-timer { font-size: .8125rem; font-weight: 700; color: #10b981; font-family: 'JetBrains Mono', monospace; padding: .25rem .5rem; background: rgba(16,185,129,.1); border-radius: 6px; }
    .pay-timer--urgent { color: #ef4444; background: rgba(239,68,68,.1); animation: timerPulse 1s ease-in-out infinite; }
    @keyframes timerPulse { 0%,100% { opacity: 1; } 50% { opacity: .6; } }
    .payment-summary { display: flex; flex-direction: column; gap: .375rem; }
    .payment-row { display: flex; gap: .625rem; align-items: center; font-size: .8125rem; color: var(--muted); }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; align-items: center; justify-content: center; z-index: 200; backdrop-filter: blur(8px); }
    .modal {
      background: var(--surface); border: 1px solid var(--border); border-radius: 20px;
      padding: 2rem; width: min(460px, 90vw); display: flex; flex-direction: column; gap: 1.25rem;
      box-shadow: var(--shadow-lg); animation: popIn .2s ease;
    }
    @keyframes popIn { from { transform: scale(.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .modal__title { font-size: 1.25rem; font-weight: 700; color: var(--text); letter-spacing: -.02em; }
    .modal__sub { font-size: .875rem; color: var(--muted); font-family: 'JetBrains Mono', monospace; }
    .modal__actions { display: flex; justify-content: flex-end; gap: .75rem; padding-top: .25rem; }
    .empty-full { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem; color: var(--muted); }
    .empty-icon { font-size: 3rem; }
    @media(max-width:600px) { .ticket-card { flex-direction: column; } .ticket-card__right { align-items: flex-start; } }
    .payment-breakdown { background: var(--bg); border-radius: 12px; padding: 1rem; display: flex; flex-direction: column; gap: .5rem; }
    .breakdown-row { display: flex; justify-content: space-between; font-size: .875rem; color: var(--muted); }
    .breakdown-row--total { font-weight: 700; font-size: 1rem; color: var(--text); border-top: 1px solid var(--border); padding-top: .5rem; margin-top: .25rem; }
    .filter-bar { display: flex; gap: .75rem; flex-wrap: wrap; align-items: center; margin-bottom: 1.5rem; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 1rem; }
    .search-wrap { position: relative; flex: 1; min-width: 180px; }
    .search-icon { position: absolute; left: .75rem; top: 50%; transform: translateY(-50%); font-size: .875rem; }
    .search-input { width: 100%; padding: .5rem .75rem .5rem 2.25rem; background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; color: var(--text); font-size: .875rem; }
    .filter-select { padding: .5rem .75rem; background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; color: var(--text); font-size: .875rem; min-width: 130px; }
    .filter-price { padding: .5rem .75rem; background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; color: var(--text); font-size: .875rem; width: 90px; }
  `]
})
export class TicketsComponent implements OnInit, OnDestroy {
  auth = inject(AuthStore);
  private ticketApi = inject(TicketApiService);
  private paymentApi = inject(PaymentApiService);
  private toast = inject(ToastService);

  loading = signal(true);
  tickets = signal<TicketResponse[]>([]);
  paymentTarget = signal<TicketResponse | null>(null);
  paying = signal(false);
  confirmCancel = false;
  cancelTarget: TicketResponse | null = null;

  // Tick signal — increments every second to force timer re-evaluation
  private tick = signal(0);
  private timerInterval?: ReturnType<typeof setInterval>;

  filterKeyword = '';
  filterStatus = '';
  filterMinPrice: number | '' = '';
  filterMaxPrice: number | '' = '';

  filteredTickets() {
    return this.tickets().filter(tk => {
      if (this.filterKeyword && !tk.eventTitle.toLowerCase().includes(this.filterKeyword.toLowerCase())) return false;
      if (this.filterStatus && tk.status !== this.filterStatus) return false;
      const total = tk.price * tk.quantity;
      if (this.filterMinPrice !== '' && total < +this.filterMinPrice) return false;
      if (this.filterMaxPrice !== '' && total > +this.filterMaxPrice) return false;
      return true;
    });
  }

  applyFilter() { /* triggers change detection via direct binding */ }

  clearFilter() {
    this.filterKeyword = '';
    this.filterStatus = '';
    this.filterMinPrice = '';
    this.filterMaxPrice = '';
  }

  payAmount = 0;
  payCurrency = 'INR';
  payMethod: PaymentMethod= 'CreditCard';
  payTxnId = '';
  payNotes = '';

  ngOnInit() {
    this.load();
    // Tick every second to update countdown timers
    this.timerInterval = setInterval(() => {
      this.tick.update(v => v + 1);
      // Auto-expire tickets whose payment window has passed
      this.tickets.update(list =>
        list.map(tk => {
          if (tk.status === 'Reserved' && !this.hasCompletedPayment(tk) && this.isPaymentExpired(tk)) {
            return { ...tk, status: 'PaymentExpired' };
          }
          return tk;
        })
      );
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  load() {
    this.loading.set(true);
    this.ticketApi.getMyTickets().subscribe({
      next: t => {
        const now = new Date();
        // Filter out cancelled tickets and tickets for past events
        const active = t.filter(tk =>
          tk.status !== 'Cancelled'
        );
        this.tickets.set(active);
        this.loading.set(false);
      },
      error: () => { this.toast.error('Failed to load tickets.'); this.loading.set(false); }
    });
  }

  openPayment(tk: TicketResponse) {
    if (this.hasCompletedPayment(tk)) {
      this.toast.info('This ticket is already paid.');
      return;
    }
    this.paymentTarget.set(tk);
    // price is per-ticket, multiply by quantity for total
    this.payAmount = +(+tk.price * tk.quantity).toFixed(2);
    this.payTxnId = 'TXN-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    this.payNotes = '';
    this.payCurrency = 'INR';
    this.payMethod = 'CreditCard';
  }

  processPayment() {
    const tk = this.paymentTarget();
    if (!tk || this.paying()) return;

    // Block payment if event has expired
    if (this.isEventExpired(tk)) {
      this.toast.error('This event has ended. Payment cannot be processed.');
      this.paymentTarget.set(null);
      return;
    }

    // Block payment if 5-min window has passed
    if (this.isPaymentExpired(tk)) {
      this.toast.error('Payment window expired. Please book a new ticket.');
      this.paymentTarget.set(null);
      return;
    }

    // Free ticket — no payment needed, just confirm
    if (this.payAmount === 0) {
      this.toast.success('Free ticket confirmed!');
      this.paymentTarget.set(null);
      this.load();
      return;
    }

    this.paying.set(true);
    const req: CreatePaymentRequest = {
      ticketId: tk.id,
      amount: this.payAmount,
      currency: this.payCurrency,
      method: this.payMethod,
      transactionId: this.payTxnId
    };
    this.paymentApi.create(req).subscribe({
      next: p => {
        this.toast.success(`Payment of ₹${p.amount} ${p.currency} completed!`);
        this.paying.set(false);
        this.paymentTarget.set(null);
        // Immediately update the ticket in the list so Pay button disappears
        this.tickets.update(list =>
          list.map(t => t.id === tk.id
            ? { ...t, status: 'Confirmed', payments: [...(t.payments || []), p] }
            : t
          )
        );
      },
      error: (err) => {
        const msg = err?.error?.message || 'Payment failed. Please try again.';
        this.toast.error(msg);
        this.paying.set(false);
      }
    });
  }

  cancelTicket() {
    if (!this.cancelTarget) return;
    if (this.cancelTarget.payments?.some(p => p.status === 'Completed')) {
      this.toast.error('Cannot cancel a ticket that has already been paid.');
      this.confirmCancel = false;
      this.cancelTarget = null;
      return;
    }
    const id = this.cancelTarget.id;
    this.ticketApi.delete(id).subscribe({
      next: () => {
        this.toast.success('Ticket cancelled successfully.');
        // Remove from list immediately
        this.tickets.update(list => list.filter(t => t.id !== id));
        this.confirmCancel = false;
        this.cancelTarget = null;
      },
      error: () => {
        this.toast.error('Failed to cancel ticket.');
        this.confirmCancel = false;
      }
    });
  }

  statusColor(s: string): string {
    const m: Record<string, string> = { Reserved: 'blue', Confirmed: 'green', Cancelled: 'red', Attended: 'purple' };
    return m[s] ?? 'gray';
  }

  paymentColor(s: string): string {
    const m: Record<string, string> = { Pending: 'amber', Completed: 'green', Failed: 'red', Refunded: 'gray' };
    return m[s] ?? 'gray';
  }
  hasCompletedPayment(tk: TicketResponse): boolean {
    return tk.payments?.some(p => p.status === 'Completed') ?? false;
  }

  hasActivePayment(tk: TicketResponse): boolean {
    return tk.payments?.some(p => p.status === 'Completed' || p.status === 'Pending') ?? false;
  }

  isEventExpired(tk: TicketResponse): boolean {
    if (!tk.eventEndDateTime) return false;
    return new Date(tk.eventEndDateTime) <= new Date();
  }

  isPaymentExpired(tk: TicketResponse): boolean {
    this.tick();
    if (!tk.paymentDeadline) return false;
    const deadlineStr = tk.paymentDeadline.endsWith('Z') ? tk.paymentDeadline : tk.paymentDeadline + 'Z';
    return new Date(deadlineStr) <= new Date();
  }

  getSecondsLeft(tk: TicketResponse): number {
    this.tick();
    if (!tk.paymentDeadline) return 0;
    // Ensure deadline is parsed as UTC (backend sends UTC, append Z if missing)
    const deadlineStr = tk.paymentDeadline.endsWith('Z') ? tk.paymentDeadline : tk.paymentDeadline + 'Z';
    return Math.max(0, Math.floor((new Date(deadlineStr).getTime() - Date.now()) / 1000));
  }

  formatTimer(tk: TicketResponse): string {
    const secs = this.getSecondsLeft(tk);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }
}
