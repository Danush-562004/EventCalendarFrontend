import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
        <!-- Search bar -->
        <div class="venue-search-bar">
          <div class="vsb-wrap">
            <span class="vsb-icon">🔍</span>
            <input class="vsb-input" [(ngModel)]="searchQuery" (input)="applySearch()" placeholder="Search by name or location…">
            @if (searchQuery) {
              <button class="vsb-clear" (click)="searchQuery = ''; applySearch()">✕</button>
            }
          </div>
        </div>

        <div class="venues-grid">
          @for (v of filteredVenues(); track v.id) {
            <div class="venue-card" (click)="browseVenue(v)">
              <div class="venue-card__img">
                <img [src]="getVenueImg(v.id, v.name)" [alt]="v.name" class="venue-card__photo" loading="lazy">
                <div class="venue-card__img-overlay"></div>
              </div>
              <div class="venue-card__content">
                <div class="venue-card__header">
                  <h3 class="venue-card__name">{{ v.name }}</h3>
                  <span class="badge" [class]="v.isActive ? 'badge--green' : 'badge--red'">{{ v.isActive ? 'Active' : 'Inactive' }}</span>
                </div>
                <div class="venue-card__addr">📍 {{ v.city }}, {{ v.state }}, {{ v.country }}</div>
                @if (v.description) { <p class="venue-card__desc">{{ v.description }}</p> }
                <div class="venue-card__details">
                  <div class="detail-item"><span class="detail-label">Capacity</span><span class="detail-val">{{ v.capacity | number }}</span></div>
                  @if (v.contactEmail) { <div class="detail-item"><span class="detail-label">Email</span><span class="detail-val">{{ v.contactEmail }}</span></div> }
                  @if (v.contactPhone) { <div class="detail-item"><span class="detail-label">Phone</span><span class="detail-val">{{ v.contactPhone }}</span></div> }
                </div>
                <span class="venue-card__browse">View events →</span>
                @if (auth.isAdmin()) {
                  <div class="venue-card__actions">
                    <button class="btn btn--ghost btn--sm" (click)="openEdit(v); $event.stopPropagation()">✏️ Edit</button>
                    <button class="btn btn--danger btn--sm" (click)="deleteTarget = v; confirmDelete = true; $event.stopPropagation()">🗑 Delete</button>
                  </div>
                }
              </div>
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
    .venues-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem; }
    .venue-search-bar { margin-bottom: 1.25rem; }
    .vsb-wrap { display: flex; align-items: center; gap: .5rem; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: .5rem 1rem; }
    .vsb-icon { font-size: .875rem; flex-shrink: 0; }
    .vsb-input { flex: 1; border: none; background: none; font-size: .9375rem; color: var(--text); font-family: inherit; outline: none; }
    .vsb-input::placeholder { color: var(--muted); }
    .vsb-clear { background: none; border: none; cursor: pointer; color: var(--muted); font-size: .875rem; padding: 0 .25rem; }
    .vsb-clear:hover { color: var(--text); }
    .venue-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; transition: transform .2s, box-shadow .2s; cursor: pointer; }
    .venue-card:hover { transform: translateY(-3px); box-shadow: 0 10px 32px rgba(0,0,0,.12); }
    .venue-card__img { height: 160px; position: relative; overflow: hidden; }
    .venue-card__photo { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .4s; }
    .venue-card:hover .venue-card__photo { transform: scale(1.06); }
    .venue-card__img-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 60%, rgba(0,0,0,.3)); z-index: 1; }
    .venue-card__content { flex: 1; padding: 1.25rem; display: flex; flex-direction: column; gap: .625rem; }
    .venue-card__header { display: flex; align-items: flex-start; justify-content: space-between; gap: .5rem; }
    .venue-card__name { font-size: 1.0625rem; font-weight: 700; color: var(--text); }
    .venue-card__addr { font-size: .8125rem; color: var(--muted); }
    .venue-card__desc { font-size: .8125rem; color: var(--muted); line-height: 1.5; }
    .venue-card__details { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }
    .detail-item { display: flex; flex-direction: column; gap: .125rem; }
    .detail-label { font-size: .6875rem; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); }
    .detail-val { font-size: .8125rem; font-weight: 600; color: var(--text); }
    .venue-card__actions { display: flex; gap: .5rem; padding-top: .625rem; border-top: 1px solid var(--border); margin-top: auto; }
    .venue-card__browse { font-size: .8125rem; font-weight: 600; color: var(--accent); margin-top: .25rem; display: block; }
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
  private router = inject(Router);

  loading = signal(true);
  saving = signal(false);
  showForm = signal(false);
  venues = signal<VenueResponse[]>([]);
  page = signal(1);
  pageSize = 12;
  totalCount = signal(0);
  searchQuery = '';
  editTarget: VenueResponse | null = null;
  deleteTarget: VenueResponse | null = null;
  confirmDelete = false;

  filteredVenues(): VenueResponse[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.venues();
    return this.venues().filter(v =>
      v.name.toLowerCase().includes(q) ||
      v.city.toLowerCase().includes(q) ||
      v.state.toLowerCase().includes(q) ||
      v.country.toLowerCase().includes(q) ||
      v.address.toLowerCase().includes(q)
    );
  }

  applySearch() { /* triggers change detection via binding */ }

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

  browseVenue(v: VenueResponse) {
    this.router.navigate(['/events'], { queryParams: { venueId: v.id } });
  }

  getVenueIcon(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('stadium') || n.includes('arena') || n.includes('sport')) return '🏟️';
    if (n.includes('hall') || n.includes('auditorium') || n.includes('theater')) return '🎭';
    if (n.includes('hotel') || n.includes('resort') || n.includes('inn')) return '🏨';
    if (n.includes('park') || n.includes('garden') || n.includes('outdoor')) return '🌳';
    if (n.includes('club') || n.includes('lounge') || n.includes('bar')) return '🎶';
    if (n.includes('museum') || n.includes('gallery') || n.includes('art')) return '🏛️';
    if (n.includes('conference') || n.includes('center') || n.includes('convention')) return '🏢';
    if (n.includes('school') || n.includes('college') || n.includes('university')) return '🎓';
    if (n.includes('temple') || n.includes('church') || n.includes('mosque')) return '⛪';
    return '🏛️';
  }

  // Verified Unsplash photo URLs — famous monuments and landmarks
  private readonly VENUE_PHOTOS = [
    'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&q=80', // Taj Mahal
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80', // Eiffel Tower
    'https://images.unsplash.com/photo-1555993539-1732b0258235?w=600&q=80', // Colosseum
    'https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=600&q=80', // Big Ben
    'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=600&q=80', // Great Wall
    'https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&q=80', // Burj Khalifa
    'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=600&q=80', // Statue of Liberty
    'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=600&q=80', // Sydney Opera House
    'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=80', // India Gate
    'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&q=80', // Lotus Temple
    'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&q=80', // Mall interior
    'https://images.unsplash.com/photo-1519567770579-c2fc5836898d?w=600&q=80', // Stadium
  ];

  getVenueImg(id: number, name: string): string {
    return this.VENUE_PHOTOS[id % this.VENUE_PHOTOS.length];
  }
}
