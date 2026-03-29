import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CategoryApiService } from '../../core/services/api.service';
import { AuthStore } from '../../core/services/auth.store';
import { ToastService } from '../../shared/components/toast/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { CategoryResponse } from '../../core/models';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingComponent, ConfirmDialogComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Categories</h1>
          <p class="page-sub">Event categories and tags</p>
        </div>
        @if (auth.isAdmin()) {
          <button class="btn" (click)="openCreate()">+ Add Category</button>
        }
      </div>

      @if (loading()) {
        <app-loading text="Loading categories…" />
      } @else {
        <div class="cat-grid">
          @for (cat of categories(); track cat.id) {
            <div class="cat-card" (click)="browseCategory(cat)" role="button" tabindex="0"
              (keydown.enter)="browseCategory(cat)">
              <div class="cat-card__banner">
                <img [src]="getCatImg(cat.id, cat.name)" [alt]="cat.name" class="cat-card__photo" loading="lazy">
                <div class="cat-card__overlay"></div>
                <span class="cat-card__label">{{ cat.name }}</span>
              </div>
              <div class="cat-card__body">
                <div class="cat-card__top">
                  <span class="badge" [class]="cat.isActive ? 'badge--green' : 'badge--red'">{{ cat.isActive ? 'Active' : 'Inactive' }}</span>
                  <span class="cat-card__browse">Browse events →</span>
                </div>
                @if (cat.description) { <p class="cat-card__desc">{{ cat.description }}</p> }
                <div class="cat-card__color-strip" [style.background]="cat.colorCode"></div>
              </div>
              @if (auth.isAdmin()) {
                <div class="cat-card__actions" (click)="$event.stopPropagation()">
                  <button class="btn btn--ghost btn--xs" (click)="openEdit(cat)">✏️</button>
                  <button class="btn btn--danger btn--xs" (click)="deleteTarget = cat; confirmDelete = true">🗑</button>
                </div>
              }
            </div>
          } @empty {
            <div class="empty-full">
              <span class="empty-icon">🏷️</span>
              <p>No categories yet</p>
            </div>
          }
        </div>
      }

      <!-- Create/Edit Modal -->
      @if (showForm()) {
        <div class="modal-overlay" (click)="showForm.set(false)">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3 class="modal__title">{{ editTarget ? 'Edit' : 'Create' }} Category</h3>
            <div class="form-field">
              <label class="form-label">Name *</label>
              <input class="form-input" [(ngModel)]="formName" placeholder="e.g. Music">
            </div>
            <div class="form-field">
              <label class="form-label">Description</label>
              <input class="form-input" [(ngModel)]="formDesc" placeholder="Short description…">
            </div>
            <div class="form-field">
              <label class="form-label">Color Code</label>
              <div class="color-row">
                <input class="form-input color-input" [(ngModel)]="formColor" placeholder="#3498db">
                <input type="color" [(ngModel)]="formColor" class="color-picker">
                <div class="color-preview" [style.background]="formColor"></div>
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
        title="Delete Category"
        message="Deactivate this category? Events using it will remain."
        confirmLabel="Deactivate"
        (confirm)="deleteCategory()"
        (cancel)="confirmDelete = false"
      />
    </div>
  `,
  styles: [`
    .cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.25rem; }
    .cat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; transition: transform .2s, box-shadow .2s; cursor: pointer; }
    .cat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 36px rgba(0,0,0,.14); }
    .cat-card__banner { height: 140px; position: relative; overflow: hidden; }
    .cat-card__photo { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .4s; }
    .cat-card:hover .cat-card__photo { transform: scale(1.08); }
    .cat-card__overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,.1) 0%, rgba(0,0,0,.55) 100%); }
    .cat-card__label { position: absolute; bottom: .75rem; left: 1rem; font-size: 1rem; font-weight: 800; color: #fff; text-shadow: 0 1px 4px rgba(0,0,0,.5); letter-spacing: -.01em; }
    .cat-card__body { flex: 1; padding: .875rem 1rem; display: flex; flex-direction: column; gap: .5rem; }
    .cat-card__top { display: flex; align-items: center; justify-content: space-between; gap: .5rem; }
    .cat-card__browse { font-size: .75rem; color: var(--accent); font-weight: 600; }
    .cat-card__desc { font-size: .8125rem; color: var(--muted); line-height: 1.5; }
    .cat-card__color-strip { height: 4px; border-radius: 2px; margin-top: auto; }
    .cat-card__actions { display: flex; gap: .375rem; justify-content: flex-end; padding: .625rem 1rem; border-top: 1px solid var(--border); }
    .color-row { display: flex; gap: .5rem; align-items: center; }
    .color-input { flex: 1; }
    .color-picker { width: 40px; height: 36px; padding: 2px; border: 1px solid var(--border); border-radius: 8px; cursor: pointer; background: var(--surface2); }
    .color-preview { width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--border); flex-shrink: 0; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 200; backdrop-filter: blur(4px); }
    .modal { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 2rem; width: min(440px, 90vw); display: flex; flex-direction: column; gap: 1rem; animation: popIn .2s ease; }
    @keyframes popIn { from { transform: scale(.93); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .modal__title { font-size: 1.25rem; font-weight: 800; color: var(--text); }
    .modal__actions { display: flex; justify-content: flex-end; gap: .75rem; margin-top: .5rem; }
    .empty-full { grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem; color: var(--muted); }
    .empty-icon { font-size: 3rem; }
  `]
})
export class CategoriesComponent implements OnInit {
  auth = inject(AuthStore);
  private api = inject(CategoryApiService);
  private toast = inject(ToastService);
  private router = inject(Router);

  loading = signal(true);
  saving = signal(false);
  showForm = signal(false);
  categories = signal<CategoryResponse[]>([]);
  editTarget: CategoryResponse | null = null;
  deleteTarget: CategoryResponse | null = null;
  confirmDelete = false;

  formName = '';
  formDesc = '';
  formColor = '#3498db';

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getAll(1, 100).subscribe({
      next: r => { this.categories.set(r.items); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openCreate() {
    this.editTarget = null;
    this.formName = ''; this.formDesc = ''; this.formColor = '#3498db';
    this.showForm.set(true);
  }

  openEdit(cat: CategoryResponse) {
    this.editTarget = cat;
    this.formName = cat.name; this.formDesc = cat.description || ''; this.formColor = cat.colorCode;
    this.showForm.set(true);
  }

  save() {
    if (!this.formName.trim()) { this.toast.warning('Name is required'); return; }
    this.saving.set(true);
    const payload = { name: this.formName, description: this.formDesc || undefined, colorCode: this.formColor };
    const call = this.editTarget
      ? this.api.update(this.editTarget.id, payload)
      : this.api.create(payload);
    call.subscribe({
      next: () => {
        this.toast.success(this.editTarget ? 'Category updated!' : 'Category created!');
        this.showForm.set(false);
        this.saving.set(false);
        this.load();
      },
      error: () => this.saving.set(false)
    });
  }

  deleteCategory() {
    if (!this.deleteTarget) return;
    this.api.delete(this.deleteTarget.id).subscribe({
      next: () => { this.toast.success('Category deactivated.'); this.confirmDelete = false; this.load(); }
    });
  }

  browseCategory(cat: CategoryResponse) {
    // Navigate to events page with category pre-selected
    this.router.navigate(['/events'], { queryParams: { categoryId: cat.id, categoryName: cat.name } });
  }

  // Verified Unsplash nature/scenery photos — colorful and vibrant
  private readonly CAT_PHOTOS = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', // mountain sunrise
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80', // forest light
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80', // green hills
    'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=600&q=80', // autumn forest
    'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=600&q=80', // waterfall
    'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=600&q=80', // lake reflection
    'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=600&q=80', // tropical beach
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80', // ocean sunset
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80', // snowy peaks
    'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=80', // pine forest
    'https://images.unsplash.com/photo-1490682143684-14369e18dce8?w=600&q=80', // lavender field
    'https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=600&q=80', // cherry blossom
  ];

  getCatImg(id: number, name: string): string {
    return this.CAT_PHOTOS[id % this.CAT_PHOTOS.length];
  }
}
