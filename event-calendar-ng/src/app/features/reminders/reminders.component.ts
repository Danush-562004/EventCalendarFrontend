import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReminderApiService, EventApiService } from '../../core/services/api.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { ReminderResponse, EventResponse } from '../../core/models';

@Component({
  selector: 'app-reminders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LoadingComponent, ConfirmDialogComponent, PaginationComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Reminders</h1>
          <p class="page-sub">Your event notifications</p>
        </div>
        <button class="btn" (click)="openCreate()">+ New Reminder</button>
      </div>

      @if (loading()) {
        <app-loading text="Loading reminders…" />
      } @else {
        <div class="reminders-list">
          @for (rm of reminders(); track rm.id) {
            <div class="reminder-card" [class.sent]="rm.isSent">
              <div class="reminder-card__icon">{{ rm.isSent ? '✅' : '🔔' }}</div>
              <div class="reminder-card__body">
                <div class="reminder-card__title">{{ rm.title }}</div>
                @if (rm.message) { <p class="reminder-card__msg">{{ rm.message }}</p> }
                <div class="reminder-card__meta">
                  <span>📅 {{ rm.reminderDateTime | date:'MMM d, y · h:mm a' }}</span>
                  <span>🎭 {{ rm.eventTitle }}</span>
                  <span class="badge badge--blue">{{ rm.type }}</span>
                  <span class="badge" [class]="rm.isSent ? 'badge--gray' : 'badge--amber'">{{ rm.isSent ? 'Sent' : 'Pending' }}</span>
                </div>
              </div>
              <div class="reminder-card__actions">
                @if (!rm.isSent) {
                  <button class="btn btn--ghost btn--sm" (click)="openEdit(rm)">✏️</button>
                }
                <button class="btn btn--danger btn--sm" (click)="deleteTarget = rm; confirmDelete = true">🗑</button>
              </div>
            </div>
          } @empty {
            <div class="empty-full">
              <span class="empty-icon">🔔</span>
              <p>No reminders set</p>
              <p class="empty-sub">Add a reminder from an event page or create one here.</p>
            </div>
          }
        </div>

        <app-pagination [currentPage]="page()" [pageSize]="pageSize" [totalCount]="totalCount()" (pageChange)="onPage($event)" />
      }

      @if (showForm()) {
        <div class="modal-overlay" (click)="showForm.set(false)">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3 class="modal__title">{{ editTarget ? 'Edit' : 'New' }} Reminder</h3>
            <div class="form-field">
              <label class="form-label">Event *</label>
              <select class="form-select" [(ngModel)]="f.eventId" [disabled]="!!editTarget">
                <option value="">Select event…</option>
                @for (ev of events(); track ev.id) {
                  <option [value]="ev.id">{{ ev.title }}</option>
                }
              </select>
            </div>
            <div class="form-field">
              <label class="form-label">Title *</label>
              <input class="form-input" [(ngModel)]="f.title" placeholder="Don't forget!">
            </div>
            <div class="form-field">
              <label class="form-label">Message</label>
              <textarea class="form-input form-textarea" [(ngModel)]="f.message" rows="2" placeholder="Optional message…"></textarea>
            </div>
            <div class="form-field">
              <label class="form-label">Date & Time *</label>
              <input class="form-input" type="datetime-local" [(ngModel)]="f.reminderDateTime" [min]="minDateTime">
            </div>
            <div class="form-field">
              <label class="form-label">Notification Type</label>
              <select class="form-select" [(ngModel)]="f.type">
                <option value="Email">Email</option>
                <option value="Push">Push</option>
                <option value="Both">Both</option>
              </select>
            </div>
            <div class="modal__actions">
              <button class="btn btn--ghost" (click)="showForm.set(false)">Cancel</button>
              <button class="btn" [disabled]="saving()" (click)="save()">
                @if (saving()) { <span class="btn-spinner"></span> }
                {{ editTarget ? 'Update' : 'Create' }}
              </button>
            </div>
          </div>
        </div>
      }

      <app-confirm-dialog
        [open]="confirmDelete"
        title="Delete Reminder"
        message="Are you sure you want to remove this reminder?"
        confirmLabel="Delete"
        (confirm)="deleteReminder()"
        (cancel)="confirmDelete = false"
      />
    </div>
  `,
  styles: [`
    .reminders-list { display: flex; flex-direction: column; gap: .75rem; margin-bottom: 1.5rem; }
    .reminder-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
      padding: 1.25rem; display: flex; align-items: flex-start; gap: 1rem;
      transition: box-shadow .2s;
    }
    .reminder-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.12); }
    .reminder-card.sent { opacity: .65; }
    .reminder-card__icon { font-size: 1.5rem; flex-shrink: 0; margin-top: .125rem; }
    .reminder-card__body { flex: 1; display: flex; flex-direction: column; gap: .375rem; }
    .reminder-card__title { font-size: .9375rem; font-weight: 700; color: var(--text); }
    .reminder-card__msg { font-size: .8125rem; color: var(--muted); }
    .reminder-card__meta { display: flex; gap: .75rem; flex-wrap: wrap; font-size: .8125rem; color: var(--muted); align-items: center; }
    .reminder-card__actions { display: flex; gap: .375rem; flex-shrink: 0; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 200; backdrop-filter: blur(4px); }
    .modal { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 2rem; width: min(480px, 90vw); display: flex; flex-direction: column; gap: 1rem; animation: popIn .2s ease; }
    @keyframes popIn { from { transform: scale(.93); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .modal__title { font-size: 1.25rem; font-weight: 800; color: var(--text); }
    .modal__actions { display: flex; justify-content: flex-end; gap: .75rem; margin-top: .5rem; }
    .form-textarea { resize: vertical; }
    .empty-full { display: flex; flex-direction: column; align-items: center; gap: .75rem; padding: 4rem; color: var(--muted); text-align: center; }
    .empty-icon { font-size: 3rem; }
    .empty-sub { font-size: .8125rem; }
  `]
})
export class RemindersComponent implements OnInit {
  private api = inject(ReminderApiService);
  private eventApi = inject(EventApiService);
  private toast = inject(ToastService);

  loading = signal(true);
  saving = signal(false);
  showForm = signal(false);
  reminders = signal<ReminderResponse[]>([]);
  events = signal<EventResponse[]>([]);
  page = signal(1);
  pageSize = 20;
  totalCount = signal(0);
  editTarget: ReminderResponse | null = null;
  deleteTarget: ReminderResponse | null = null;
  confirmDelete = false;

  f: any = { eventId: '', title: '', message: '', reminderDateTime: '', type: 'Email' };

  get minDateTime(): string {
    return new Date().toISOString().slice(0, 16);
  }

  ngOnInit() {
    this.load();
    this.eventApi.getAll(1, 100).subscribe({ next: r => this.events.set(r.items) });
  }

  load() {
    this.loading.set(true);
    this.api.getMine(this.page(), this.pageSize).subscribe({
      next: r => { this.reminders.set(r.items); this.totalCount.set(r.totalCount); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openCreate() {
    this.editTarget = null;
    this.f = { eventId: '', title: '', message: '', reminderDateTime: '', type: 'Email' };
    this.showForm.set(true);
  }

  openEdit(rm: ReminderResponse) {
    this.editTarget = rm;
    this.f = { eventId: rm.eventId, title: rm.title, message: rm.message || '', reminderDateTime: rm.reminderDateTime.slice(0, 16), type: rm.type };
    this.showForm.set(true);
  }

  save() {
    if (!this.f.title || !this.f.reminderDateTime || (!this.editTarget && !this.f.eventId)) {
      this.toast.warning('Please fill all required fields.'); return;
    }
    if (new Date(this.f.reminderDateTime) <= new Date()) {
      this.toast.error('Reminder time must be in the future.'); return;
    }
    this.saving.set(true);
    const call = this.editTarget
      ? this.api.update(this.editTarget.id, { title: this.f.title, message: this.f.message || undefined, reminderDateTime: this.f.reminderDateTime, type: this.f.type })
      : this.api.create({ title: this.f.title, message: this.f.message || undefined, reminderDateTime: this.f.reminderDateTime, type: this.f.type, eventId: Number(this.f.eventId) });
    call.subscribe({
      next: () => { this.toast.success(this.editTarget ? 'Reminder updated!' : 'Reminder created!'); this.showForm.set(false); this.saving.set(false); this.load(); },
      error: () => { this.toast.error('Failed to save reminder.'); this.saving.set(false); }
    });
  }

  deleteReminder() {
    if (!this.deleteTarget) return;
    this.api.delete(this.deleteTarget.id).subscribe({
      next: () => { this.toast.success('Reminder deleted successfully.'); this.confirmDelete = false; this.load(); },
      error: () => this.toast.error('Failed to delete reminder.')
    });
  }

  onPage(p: number) { this.page.set(p); this.load(); }
}
