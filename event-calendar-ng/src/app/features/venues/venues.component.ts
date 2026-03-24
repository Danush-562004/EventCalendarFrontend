import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VenueApiService } from '../../core/services/api.service';
import { AuthStore } from '../../core/services/auth.store';
import { ToastService } from '../../shared/components/toast/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { VenueResponse } from '../../core/models';

@Component({
  selector: 'app-venues',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingComponent, ConfirmDialogComponent, PaginationComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Venues</h1>
          <p class="page-sub">Event venues and locations</p>
        </div>
        @if (auth.isAdmin()) {
          <button class="btn" (click)="openCreate()">+ Add Venue</button>
        }
      </div>

      @if (loading()) {
        <app-loading text="Loading venues…" />
      } @else {
        <div class="venues-grid">
          @for (v of venues(); track v.id) {
            <div class="venue-card">
              <div class="venue-card__header">
                <h3 class="venue-card__name">{{ v.name }}</h3>
                <span class="badge" [class]="v.isActive ? 'badge--green' : 'badge--red'">{{ v.isActive ? 'Active' : 'Inactive' }}</span>
              </div>
              <div class="venue-card__addr">📍 {{ v.address }}, {{ v.city }}, {{ v.state }}, {{ v.country }}</div>
              @if (v.description) { <p class="venue-card__desc">{{ v.description }}</p> }
              <div class="venue-card__details">
                <div class="detail-item"><span class="detail-label">Capacity</span><span class="detail-val">{{ v.capacity | number }}</span></div>
                @if (v.contactEmail) { <div class="detail-item"><span class="detail-label">Email</span><span class="detail-val">{{ v.contactEmail }}</span></div> }
                @if (v.contactPhone) { <div class="detail-item"><span class="detail-label">Phone</span><span class="detail-val">{{ v.contactPhone }}</span></div> }
                @if (v.zipCode) { <div class="detail-item"><span class="detail-label">ZIP</span><span class="detail-val">{{ v.zipCode }}</span></div> }
              </div>
              @if (auth.isAdmin()) {
                <div class="venue-card__actions">
                  <button class="btn btn--ghost btn--sm" (click)="openEdit(v)">✏️ Edit</button>
                  <button class="btn btn--danger btn--sm" (click)="deleteTarget = v; confirmDelete = true">🗑 Delete</button>
                </div>
              }
            </div>
          } @empty {
            <div class="empty-full">
              <span class="empty-icon">🏛️</span>
              <p>No venues yet</p>
            </div>
          }
        </div>

        <app-pagination [currentPage]="page()" [pageSize]="pageSize" [totalCount]="totalCount()" (pageChange)="onPage($event)" />
      }

      @if (showForm()) {
        <div class="modal-overlay" (click)="showForm.set(false)">
          <div class="modal modal--wide" (click)="$event.stopPropagation()">
            <h3 class="modal__title">{{ editTarget ? 'Edit' : 'Add' }} Venue</h3>
            <div class="form-grid-2">
              <div class="form-field form-field--full">
                <label class="form-label">Name *</label>
                <input class="form-input" [(ngModel)]="f.name" placeholder="Grand Hall">
              </div>
              <div class="form-field form-field--full">
                <label class="form-label">Address *</label>
                <input class="form-input" [(ngModel)]="f.address" placeholder="123 Main St">
              </div>
              <div class="form-field">
                <label class="form-label">City *</label>
                <input class="form-input" [(ngModel)]="f.city" placeholder="Mumbai">
              </div>
              <div class="form-field">
                <label class="form-label">State *</label>
                <input class="form-input" [(ngModel)]="f.state" placeholder="Maharashtra">
              </div>
              <div class="form-field">
                <label class="form-label">Country *</label>
                <input class="form-input" [(ngModel)]="f.country" placeholder="India">
              </div>
              <div class="form-field">
                <label class="form-label">ZIP Code</label>
                <input class="form-input" [(ngModel)]="f.zipCode" placeholder="400001">
              </div>
              <div class="form-field">
                <label class="form-label">Capacity *</label>
                <input class="form-input" type="number" [(ngModel)]="f.capacity" min="1">
              </div>
              <div class="form-field">
                <label class="form-label">Contact Email</label>
                <input class="form-input" type="email" [(ngModel)]="f.contactEmail" placeholder="venue@example.com">
              </div>
              <div class="form-field">
                <label class="form-label">Contact Phone</label>
                <input class="form-input" [(ngModel)]="f.contactPhone" placeholder="+91 …">
              </div>
              <div class="form-field form-field--full">
                <label class="form-label">Description</label>
                <textarea class="form-input form-textarea" [(ngModel)]="f.description" rows="2" placeholder="About this venue…"></textarea>
              </div>
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
        title="Deactivate Venue"
        message="This will deactivate the venue. Continue?"
        confirmLabel="Deactivate"
        (confirm)="deleteVenue()"
        (cancel)="confirmDelete = false"
      />
    </div>
  `,
  styles: [`
    .venues-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem; }
    .venue-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem; display: flex; flex-direction: column; gap: .75rem; transition: transform .2s, box-shadow .2s; }
    .venue-card:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,.18); }
    .venue-card__header { display: flex; align-items: flex-start; justify-content: space-between; gap: .5rem; }
    .venue-card__name { font-size: 1.0625rem; font-weight: 700; color: var(--text); }
    .venue-card__addr { font-size: .8125rem; color: var(--muted); }
    .venue-card__desc { font-size: .8125rem; color: var(--muted); line-height: 1.5; }
    .venue-card__details { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }
    .detail-item { display: flex; flex-direction: column; gap: .125rem; }
    .detail-label { font-size: .6875rem; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); }
    .detail-val { font-size: .8125rem; font-weight: 600; color: var(--text); }
    .venue-card__actions { display: flex; gap: .5rem; padding-top: .25rem; border-top: 1px solid var(--border); }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 200; backdrop-filter: blur(4px); }
    .modal { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 2rem; width: min(440px, 90vw); display: flex; flex-direction: column; gap: 1rem; animation: popIn .2s ease; }
    .modal--wide { width: min(700px, 90vw); }
    @keyframes popIn { from { transform: scale(.93); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .modal__title { font-size: 1.25rem; font-weight: 800; color: var(--text); }
    .modal__actions { display: flex; justify-content: flex-end; gap: .75rem; margin-top: .5rem; }
    .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: .875rem; }
    .form-field--full { grid-column: 1/-1; }
    .form-textarea { resize: vertical; }
    .empty-full { grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem; color: var(--muted); }
    .empty-icon { font-size: 3rem; }
  `]
})
export class VenuesComponent implements OnInit {
  auth = inject(AuthStore);
  private api = inject(VenueApiService);
  private toast = inject(ToastService);

  loading = signal(true);
  saving = signal(false);
  showForm = signal(false);
  venues = signal<VenueResponse[]>([]);
  page = signal(1);
  pageSize = 12;
  totalCount = signal(0);
  editTarget: VenueResponse | null = null;
  deleteTarget: VenueResponse | null = null;
  confirmDelete = false;

  f = { name: '', address: '', city: '', state: '', country: '', zipCode: '', capacity: 100, description: '', contactEmail: '', contactPhone: '' };

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getAll(this.page(), this.pageSize).subscribe({
      next: r => { this.venues.set(r.items); this.totalCount.set(r.totalCount); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openCreate() {
    this.editTarget = null;
    this.f = { name: '', address: '', city: '', state: '', country: '', zipCode: '', capacity: 100, description: '', contactEmail: '', contactPhone: '' };
    this.showForm.set(true);
  }

  openEdit(v: VenueResponse) {
    this.editTarget = v;
    this.f = { name: v.name, address: v.address, city: v.city, state: v.state, country: v.country, zipCode: v.zipCode || '', capacity: v.capacity, description: v.description || '', contactEmail: v.contactEmail || '', contactPhone: v.contactPhone || '' };
    this.showForm.set(true);
  }

  save() {
    if (!this.f.name || !this.f.address || !this.f.city || !this.f.state || !this.f.country) {
      this.toast.warning('Name, address, city, state and country are required.'); return;
    }
    this.saving.set(true);
    const payload: any = { ...this.f, capacity: Number(this.f.capacity) };
    if (!payload.zipCode) delete payload.zipCode;
    if (!payload.description) delete payload.description;
    if (!payload.contactEmail) delete payload.contactEmail;
    if (!payload.contactPhone) delete payload.contactPhone;
    const call = this.editTarget ? this.api.update(this.editTarget.id, payload) : this.api.create(payload);
    call.subscribe({
      next: () => { this.toast.success('Venue saved!'); this.showForm.set(false); this.saving.set(false); this.load(); },
      error: () => this.saving.set(false)
    });
  }

  deleteVenue() {
    if (!this.deleteTarget) return;
    this.api.delete(this.deleteTarget.id).subscribe({
      next: () => { this.toast.success('Venue deactivated.'); this.confirmDelete = false; this.load(); }
    });
  }

  onPage(p: number) { this.page.set(p); this.load(); }
}
