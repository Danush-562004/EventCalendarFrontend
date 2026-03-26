import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserApiService, PaymentApiService, TicketApiService, AuditLogApiService } from '../../core/services/api.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { UserResponse, PaymentResponse, TicketResponse, AuditLogResponse } from '../../core/models';

type AdminTab = 'users' | 'payments' | 'tickets' | 'auditlogs';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingComponent, ConfirmDialogComponent, PaginationComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Admin Panel</h1>
          <p class="page-sub">Manage users, payments, tickets, and audit logs</p>
        </div>
      </div>

      <div class="tabs">
        <button class="tab" [class.active]="tab() === 'users'"     (click)="switchTab('users')">👥 Users</button>
        <button class="tab" [class.active]="tab() === 'payments'"  (click)="switchTab('payments')">💳 Payments</button>
        <button class="tab" [class.active]="tab() === 'tickets'"   (click)="switchTab('tickets')">🎫 All Tickets</button>
        <button class="tab" [class.active]="tab() === 'auditlogs'" (click)="switchTab('auditlogs')">📋 Audit Logs</button>
      </div>

      @if (tab() === 'users') {
        <!-- Search bar -->
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input class="search-input" [(ngModel)]="userSearch" placeholder="Search by username, name or email…" (input)="onUserSearch()">
          @if (userSearch) {
            <button class="search-clear" (click)="userSearch = ''; onUserSearch()">✕</button>
          }
        </div>

        @if (usersLoading()) {
          <app-loading text="Loading users…" />
        } @else {
          <div class="table-wrap">
            <table class="table">
              <thead><tr>
                <th>#</th><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th>
              </tr></thead>
              <tbody>
                @for (u of users(); track u.id) {
                  <tr>
                    <td>{{ u.id }}</td>
                    <td><strong>{{ u.firstName }} {{ u.lastName }}</strong></td>
                    <td><span class="mono">{{ u.username }}</span></td>
                    <td>{{ u.email }}</td>
                    <td><span class="badge" [class]="u.role === 'Admin' ? 'badge--purple' : 'badge--blue'">{{ u.role }}</span></td>
                    <td>{{ u.createdAt | date:'MMM d, y' }}</td>
                    <td>
                      <button class="btn btn--danger btn--xs" (click)="deleteUserTarget = u; confirmDeleteUser = true">🗑</button>
                    </td>
                  </tr>
                }
                @if (users().length === 0) {
                  <tr><td colspan="7" style="text-align:center;color:var(--muted);padding:2rem">No users match "{{ userSearch }}"</td></tr>
                }
              </tbody>
            </table>
          </div>
          <app-pagination [currentPage]="usersPage()" [pageSize]="pageSize" [totalCount]="usersTotalCount()" (pageChange)="onUsersPage($event)" />
        }
      }

      @if (tab() === 'payments') {
        <!-- Payment status filter -->
        <div class="filter-row">
          <select class="form-select filter-select filter-select--half" [(ngModel)]="paymentStatusFilter" (change)="paymentsPage.set(1); loadPayments()">
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Failed">Failed</option>
          </select>
          @if (paymentStatusFilter) {
            <button class="btn btn--ghost btn--sm" (click)="paymentStatusFilter = ''; paymentsPage.set(1); loadPayments()">Clear</button>
          }
        </div>
        @if (paymentsLoading()) {
          <app-loading text="Loading payments…" />
        } @else {
          <div class="table-wrap">
            <table class="table">
              <thead><tr>
                <th>#</th><th>Ticket ID</th><th>Amount</th><th>Currency</th><th>Method</th><th>Status</th><th>Date</th><th>Actions</th>
              </tr></thead>
              <tbody>
                @for (p of payments(); track p.id) {
                  <tr>
                    <td>{{ p.id }}</td>
                    <td><span class="mono">{{ p.ticketId }}</span></td>
                    <td><strong>{{ p.amount | number }}</strong></td>
                    <td>{{ p.currency }}</td>
                    <td>{{ p.method }}</td>
                    <td><span class="badge" [class]="'badge--' + payColor(p.status)">{{ p.status }}</span></td>
                    <td>{{ p.paymentDate | date:'MMM d, y' }}</td>
                    <td>
                      <div style="display:flex;gap:.375rem;">
                        <button class="btn btn--ghost btn--xs" (click)="openEditPayment(p)">✏️</button>
                        <button class="btn btn--danger btn--xs" (click)="deletePaymentTarget = p; confirmDeletePayment = true">🗑</button>
                      </div>
                    </td>
                  </tr>
                }
                @if (payments().length === 0) {
                  <tr><td colspan="8" style="text-align:center;color:var(--muted);padding:2rem">No payments found.</td></tr>
                }
              </tbody>
            </table>
          </div>
          <app-pagination [currentPage]="paymentsPage()" [pageSize]="pageSize" [totalCount]="paymentsTotalCount()" (pageChange)="onPaymentsPage($event)" />
        }
      }

      @if (tab() === 'tickets') {
        <!-- Ticket status filter -->
        <div class="filter-row">
          <select class="form-select filter-select filter-select--half" [(ngModel)]="ticketStatusFilter" (change)="ticketsPage.set(1); loadTickets()">
            <option value="">All Statuses</option>
            <option value="Reserved">Reserved</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          @if (ticketStatusFilter) {
            <button class="btn btn--ghost btn--sm" (click)="ticketStatusFilter = ''; ticketsPage.set(1); loadTickets()">Clear</button>
          }
        </div>
        @if (ticketsLoading()) {
          <app-loading text="Loading tickets…" />
        } @else {
          <div class="table-wrap">
            <table class="table">
              <thead><tr>
                <th>Ticket #</th><th>Event</th><th>User</th><th>Email</th><th>Type</th><th>Status</th><th>Qty</th><th>Price</th><th>Actions</th>
              </tr></thead>
              <tbody>
                @for (tk of allTickets(); track tk.id) {
                  <tr>
                    <td><span class="mono">{{ tk.ticketNumber }}</span></td>
                    <td>{{ tk.eventTitle }}</td>
                    <td>{{ tk.userFullName }}</td>
                    <td><span class="mono" style="font-size:.8125rem">{{ tk.userEmail }}</span></td>
                    <td><span class="badge badge--blue">{{ tk.type }}</span></td>
                    <td><span class="badge" [class]="'badge--' + statusColor(tk.status)">{{ tk.status }}</span></td>
                    <td>{{ tk.quantity }}</td>
                    <td>{{ tk.price | number }}</td>
                    <td>
                      <button class="btn btn--danger btn--xs" (click)="deleteTicketTarget = tk; confirmDeleteTicket = true">Cancel</button>
                    </td>
                  </tr>
                }
                @if (allTickets().length === 0) {
                  <tr><td colspan="9" style="text-align:center;color:var(--muted);padding:2rem">No tickets found.</td></tr>
                }
              </tbody>
            </table>
          </div>
          <app-pagination [currentPage]="ticketsPage()" [pageSize]="pageSize" [totalCount]="ticketsTotalCount()" (pageChange)="onTicketsPage($event)" />
        }
      }

      @if (tab() === 'auditlogs') {
        <!-- Audit Log Filters -->
        <div class="filter-bar">
          <div class="form-field">
            <label class="form-label">Action</label>
            <select class="form-select" [(ngModel)]="auditAction" (change)="loadAuditLogs()">
              <option value="">All Actions</option>
              <option value="Login">Login</option>
              <option value="Register">Register</option>
              <option value="Create">Create</option>
              <option value="Update">Update</option>
              <option value="Delete">Delete</option>
              <option value="Cancel">Cancel</option>
              <option value="ChangePassword">ChangePassword</option>
            </select>
          </div>
          <div class="form-field">
            <label class="form-label">Entity Type</label>
            <select class="form-select" [(ngModel)]="auditEntityType" (change)="loadAuditLogs()">
              <option value="">All Entities</option>
              <option value="User">User</option>
              <option value="Event">Event</option>
              <option value="Category">Category</option>
              <option value="Venue">Venue</option>
              <option value="Ticket">Ticket</option>
              <option value="Payment">Payment</option>
            </select>
          </div>
          <div class="form-field">
            <label class="form-label">From</label>
            <input class="form-input" type="date" [(ngModel)]="auditFrom" (change)="loadAuditLogs()">
          </div>
          <div class="form-field">
            <label class="form-label">To</label>
            <input class="form-input" type="date" [(ngModel)]="auditTo" (change)="loadAuditLogs()">
          </div>
          <button class="btn btn--ghost btn--sm" style="align-self:flex-end" (click)="clearAuditFilters()">Clear</button>
        </div>

        @if (auditLoading()) {
          <app-loading text="Loading audit logs…" />
        } @else {
          <div class="table-wrap">
            <table class="table">
              <thead><tr>
                <th>Timestamp</th><th>User</th><th>Action</th><th>Entity Type</th><th>Entity ID</th><th>IP Address</th><th>Details</th>
              </tr></thead>
              <tbody>
                @for (log of auditLogs(); track log.id) {
                  <tr>
                    <td style="white-space:nowrap">{{ log.timestamp | date:'MMM d, y HH:mm:ss' }}</td>
                    <td>{{ log.userName }}</td>
                    <td><span class="badge" [class]="'badge--' + actionColor(log.action)">{{ log.action }}</span></td>
                    <td>{{ log.entityType }}</td>
                    <td><span class="mono">{{ log.entityId || '—' }}</span></td>
                    <td><span class="mono">{{ log.ipAddress || '—' }}</span></td>
                    <td>
                      @if (log.newValues) {
                        <span class="mono" style="font-size:.75rem;color:var(--muted)">{{ log.newValues }}</span>
                      }
                    </td>
                  </tr>
                }
                @if (auditLogs().length === 0) {
                  <tr><td colspan="7" style="text-align:center;color:var(--muted);padding:2rem">No audit logs found.</td></tr>
                }
              </tbody>
            </table>
          </div>
          <app-pagination [currentPage]="auditPage()" [pageSize]="pageSize" [totalCount]="auditTotalCount()" (pageChange)="onAuditPage($event)" />
        }
      }

      @if (editPaymentTarget()) {
        <div class="modal-overlay" (click)="editPaymentTarget.set(null)">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3 class="modal__title">Update Payment #{{ editPaymentTarget()!.id }}</h3>
            <div class="form-field">
              <label class="form-label">Status</label>
              <select class="form-select" [(ngModel)]="payEditStatus">
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Failed">Failed</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>
            <div class="form-field">
              <label class="form-label">Transaction ID</label>
              <input class="form-input" [(ngModel)]="payEditTxnId">
            </div>
            <div class="form-field">
              <label class="form-label">Notes</label>
              <input class="form-input" [(ngModel)]="payEditNotes">
            </div>
            <div class="modal__actions">
              <button class="btn btn--ghost" (click)="editPaymentTarget.set(null)">Cancel</button>
              <button class="btn" [disabled]="savingPayment()" (click)="savePayment()">
                @if (savingPayment()) { <span class="btn-spinner"></span> } Save
              </button>
            </div>
          </div>
        </div>
      }

      <app-confirm-dialog [open]="confirmDeleteUser"    title="Delete User"     message="Delete this user account permanently?"  confirmLabel="Delete"        (confirm)="deleteUser()"    (cancel)="confirmDeleteUser = false" />
      <app-confirm-dialog [open]="confirmDeletePayment" title="Delete Payment"  message="Delete this payment record?"            confirmLabel="Delete"        (confirm)="doDeletePayment()" (cancel)="confirmDeletePayment = false" />
      <app-confirm-dialog [open]="confirmDeleteTicket"  title="Cancel Ticket"   message="Cancel this ticket?"                    confirmLabel="Cancel Ticket" (confirm)="cancelTicket()"  (cancel)="confirmDeleteTicket = false" />
    </div>
  `,
  styles: [`
    .tabs { display: flex; gap: .375rem; margin-bottom: 1.5rem; background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: .375rem; width: fit-content; flex-wrap: wrap; }
    .tab { padding: .5rem 1.25rem; border-radius: 10px; border: none; background: none; color: var(--muted); font-size: .875rem; font-weight: 600; cursor: pointer; transition: all .15s; }
    .tab.active { background: var(--accent); color: #fff; }
    .tab:hover:not(.active) { color: var(--text); background: var(--surface2); }
    .filter-bar { display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end; margin-bottom: 1.5rem; padding: 1rem; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; }
    .filter-bar .form-field { min-width: 150px; }
    .filter-row { display: flex; gap: .75rem; align-items: center; margin-bottom: 1rem; }
    .filter-select { padding: .5rem .75rem; background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; color: var(--text); font-size: .875rem; min-width: 160px; }
    .filter-select--half { width: 50%; max-width: 300px; }
    .search-bar { position: relative; display: flex; align-items: center; margin-bottom: 1rem; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: .5rem 1rem; gap: .5rem; }
    .search-icon { font-size: .875rem; flex-shrink: 0; }
    .search-input { flex: 1; border: none; background: none; font-size: .9375rem; color: var(--text); font-family: inherit; outline: none; }
    .search-input::placeholder { color: var(--muted); }
    .search-clear { background: none; border: none; cursor: pointer; color: var(--muted); font-size: .875rem; padding: 0 .25rem; }
    .search-clear:hover { color: var(--text); }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.3); display: flex; align-items: center; justify-content: center; z-index: 200; backdrop-filter: blur(4px); }
    .modal { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 2rem; width: min(440px, 90vw); display: flex; flex-direction: column; gap: 1rem; animation: popIn .2s ease; box-shadow: 0 8px 40px rgba(0,0,0,.12); }
    @keyframes popIn { from { transform: scale(.93); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .modal__title { font-size: 1.25rem; font-weight: 800; color: var(--text); }
    .modal__actions { display: flex; justify-content: flex-end; gap: .75rem; margin-top: .5rem; }
  `]
})
export class AdminComponent implements OnInit {
  private userApi     = inject(UserApiService);
  private paymentApi  = inject(PaymentApiService);
  private ticketApi   = inject(TicketApiService);
  private auditLogApi = inject(AuditLogApiService);
  private toast       = inject(ToastService);

  tab      = signal<AdminTab>('users');
  pageSize = 20;

  usersLoading    = signal(true);
  users           = signal<UserResponse[]>([]);
  usersPage       = signal(1);
  usersTotalCount = signal(0);
  userSearch      = '';
  private userSearchTimer: any;
  deleteUserTarget: UserResponse | null = null;
  confirmDeleteUser = false;

  onUserSearch() {
    clearTimeout(this.userSearchTimer);
    this.usersPage.set(1);
    this.userSearchTimer = setTimeout(() => this.loadUsers(), 350);
  }

  paymentsLoading    = signal(false);
  payments           = signal<PaymentResponse[]>([]);
  paymentsPage       = signal(1);
  paymentsTotalCount = signal(0);
  paymentStatusFilter = '';
  editPaymentTarget  = signal<PaymentResponse | null>(null);
  savingPayment      = signal(false);
  deletePaymentTarget: PaymentResponse | null = null;
  confirmDeletePayment = false;
  payEditStatus = 'Pending';
  payEditTxnId  = '';
  payEditNotes  = '';

  ticketsLoading    = signal(false);
  allTickets        = signal<TicketResponse[]>([]);
  ticketsPage       = signal(1);
  ticketsTotalCount = signal(0);
  ticketStatusFilter = '';
  deleteTicketTarget: TicketResponse | null = null;
  confirmDeleteTicket = false;

  auditLoading    = signal(false);
  auditLogs       = signal<AuditLogResponse[]>([]);
  auditPage       = signal(1);
  auditTotalCount = signal(0);
  auditAction     = '';
  auditEntityType = '';
  auditFrom       = '';
  auditTo         = '';

  ngOnInit() { this.loadUsers(); }

  switchTab(t: AdminTab) {
    this.tab.set(t);
    if (t === 'users'     && this.users().length      === 0) this.loadUsers();
    if (t === 'payments'  && this.payments().length   === 0) this.loadPayments();
    if (t === 'tickets'   && this.allTickets().length === 0) this.loadTickets();
    if (t === 'auditlogs' && this.auditLogs().length  === 0) this.loadAuditLogs();
  }

  loadUsers() {
    this.usersLoading.set(true);
    this.userApi.getAll(this.usersPage(), this.pageSize, this.userSearch || undefined).subscribe({
      next: r => { this.users.set(r.items); this.usersTotalCount.set(r.totalCount); this.usersLoading.set(false); },
      error: () => this.usersLoading.set(false)
    });
  }

  loadPayments() {
    this.paymentsLoading.set(true);
    this.paymentApi.getAll(this.paymentsPage(), this.pageSize, this.paymentStatusFilter || undefined).subscribe({
      next: r => { this.payments.set(r.items); this.paymentsTotalCount.set(r.totalCount); this.paymentsLoading.set(false); },
      error: () => this.paymentsLoading.set(false)
    });
  }

  loadTickets() {
    this.ticketsLoading.set(true);
    this.ticketApi.getAll(this.ticketsPage(), this.pageSize, this.ticketStatusFilter || undefined).subscribe({
      next: r => { this.allTickets.set(r.items); this.ticketsTotalCount.set(r.totalCount); this.ticketsLoading.set(false); },
      error: () => this.ticketsLoading.set(false)
    });
  }

  loadAuditLogs() {
    this.auditLoading.set(true);
    this.auditLogApi.getAll(
      this.auditPage(), this.pageSize,
      this.auditAction || undefined,
      this.auditEntityType || undefined,
      this.auditFrom || undefined,
      this.auditTo || undefined
    ).subscribe({
      next: r => { this.auditLogs.set(r.items); this.auditTotalCount.set(r.totalCount); this.auditLoading.set(false); },
      error: () => this.auditLoading.set(false)
    });
  }

  clearAuditFilters() {
    this.auditAction = '';
    this.auditEntityType = '';
    this.auditFrom = '';
    this.auditTo = '';
    this.auditPage.set(1);
    this.loadAuditLogs();
  }

  deleteUser() {
    if (!this.deleteUserTarget) return;
    this.userApi.delete(this.deleteUserTarget.id).subscribe({
      next: () => { this.toast.success('User deleted.'); this.confirmDeleteUser = false; this.loadUsers(); },
      error: () => { this.confirmDeleteUser = false; }
    });
  }

  openEditPayment(p: PaymentResponse) {
    this.editPaymentTarget.set(p);
    this.payEditStatus = p.status;
    this.payEditTxnId  = p.transactionId ?? '';
    this.payEditNotes  = p.notes ?? '';
  }

  savePayment() {
    const p = this.editPaymentTarget();
    if (!p) return;
    this.savingPayment.set(true);
    this.paymentApi.update(p.id, {
      status:        this.payEditStatus as any,
      transactionId: this.payEditTxnId  || undefined,
      notes:         this.payEditNotes  || undefined
    }).subscribe({
      next: () => {
        this.toast.success('Payment updated!');
        this.editPaymentTarget.set(null);
        this.savingPayment.set(false);
        this.loadPayments();
      },
      error: () => this.savingPayment.set(false)
    });
  }

  doDeletePayment() {
    if (!this.deletePaymentTarget) return;
    this.paymentApi.delete(this.deletePaymentTarget.id).subscribe({
      next: () => { this.toast.success('Payment deleted.'); this.confirmDeletePayment = false; this.loadPayments(); }
    });
  }

  cancelTicket() {
    if (!this.deleteTicketTarget) return;
    this.ticketApi.delete(this.deleteTicketTarget.id).subscribe({
      next: () => { this.toast.success('Ticket cancelled.'); this.confirmDeleteTicket = false; this.loadTickets(); }
    });
  }

  onUsersPage(p: number)    { this.usersPage.set(p);    this.loadUsers(); }
  onPaymentsPage(p: number) { this.paymentsPage.set(p); this.loadPayments(); }
  onTicketsPage(p: number)  { this.ticketsPage.set(p);  this.loadTickets(); }
  onAuditPage(p: number)    { this.auditPage.set(p);    this.loadAuditLogs(); }

  payColor(s: string): string {
    const m: Record<string, string> = { Pending: 'amber', Completed: 'green', Failed: 'red', Refunded: 'gray' };
    return m[s] ?? 'gray';
  }
  statusColor(s: string): string {
    const m: Record<string, string> = { Reserved: 'blue', Confirmed: 'green', Cancelled: 'red', Attended: 'purple' };
    return m[s] ?? 'gray';
  }
  actionColor(a: string): string {
    const m: Record<string, string> = { Create: 'green', Update: 'blue', Delete: 'red', Login: 'purple', Register: 'amber', Cancel: 'red', ChangePassword: 'gray' };
    return m[a] ?? 'gray';
  }
}
