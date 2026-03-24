import { Component, inject, signal, OnInit } from '@angular/core';
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

      @if (loading()) {
        <app-loading text="Loading tickets..." />
      } @else {
        <div class="tickets-list">
          @for (tk of tickets(); track tk.id) {
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
                  @if (!hasCompletedPayment(tk)) {
                    <button class="btn btn--ghost btn--sm" (click)="openPayment(tk)">Pay</button>
                    <button class="btn btn--danger btn--sm" (click)="cancelTarget = tk; confirmCancel = true">Cancel</button>
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
          <span>{{ paymentTarget()!.price | number }}</span>
        </div>
        <div class="breakdown-row">
          <span>Quantity</span>
          <span>× {{ paymentTarget()!.quantity }}</span>
        </div>
        <div class="breakdown-row breakdown-row--total">
          <span>Total</span>
          <span>{{ payAmount | number }} {{ payCurrency }}</span>
        </div>
      </div>

      <div class="form-field">
        <label class="form-label">Currency</label>
        <select class="form-select" [(ngModel)]="payCurrency">
          <option>INR</option><option>USD</option><option>EUR</option>
        </select>
      </div>
      <div class="form-field">
        <label class="form-label">Payment Method</label>
        <select class="form-select" [(ngModel)]="payMethod">
          <option value="CreditCard">Credit Card</option>
          <option value="DebitCard">Debit Card</option>
          <option value="PayPal">PayPal</option>
          <option value="BankTransfer">Bank Transfer</option>
          <option value="Cash">Cash</option>
        </select>
      </div>
      <div class="form-field">
        <label class="form-label">Transaction ID (auto-generated)</label>
        <input class="form-input form-input--mono" [(ngModel)]="payTxnId" readonly>
      </div>
      <!-- <div class="form-field">
        <label class="form-label">Notes (optional)</label>
        <input class="form-input" [(ngModel)]="payNotes" placeholder="Add a note...">
      </div> -->
      <div class="modal__actions">
        <button class="btn btn--ghost" (click)="paymentTarget.set(null)">Cancel</button>
        <button class="btn" [disabled]="paying()" (click)="processPayment()">
          @if (paying()) { <span class="btn-spinner"></span> Processing... }
          @else { Pay {{ payAmount | number }} {{ payCurrency }} }
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
    .ticket-card__actions { display: flex; gap: .5rem; }
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
  `]
})
export class TicketsComponent implements OnInit {
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

  payAmount = 0;
  payCurrency = 'INR';
  payMethod: PaymentMethod= 'CreditCard';
  payTxnId = '';
  payNotes = '';

  ngOnInit() { this.load(); }

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
        this.load();
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
    // Prevent cancellation if ticket has a completed payment
    if (this.cancelTarget.payments?.some(p => p.status === 'Completed')) {
      this.toast.error('Cannot cancel a ticket that has already been paid.');
      this.confirmCancel = false;
      this.cancelTarget = null;
      return;
    }
    this.ticketApi.delete(this.cancelTarget.id).subscribe({
      next: () => {
        this.toast.success('Ticket cancelled successfully.');
        this.confirmCancel = false;
        this.cancelTarget = null;
        this.load();
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
}
