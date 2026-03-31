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
            <div class="cat-card cat-card--clickable" (click)="browseCategory(cat)">
              <div class="cat-card__banner" [style.background]="getCatBg(cat.name, cat.colorCode)">
                <span class="cat-card__icon">{{ getCatIcon(cat.name) }}</span>
              </div>
              <div class="cat-card__body">
                <div class="cat-card__top">
                  <h3 class="cat-card__name">{{ cat.name }}</h3>
                  <span class="badge" [class]="cat.isActive ? 'badge--green' : 'badge--red'">{{ cat.isActive ? 'Active' : 'Inactive' }}</span>
                </div>
                @if (cat.description) { <p class="cat-card__desc">{{ cat.description }}</p> }
                <div class="cat-card__color-strip" [style.background]="cat.colorCode"></div>
                <span class="cat-card__browse">Browse events →</span>
              </div>
              @if (auth.isAdmin()) {
                <div class="cat-card__actions">
                  <button class="btn btn--ghost btn--xs" (click)="openEdit(cat); $event.stopPropagation()">✏️</button>
                  <button class="btn btn--danger btn--xs" (click)="deleteTarget = cat; confirmDelete = true; $event.stopPropagation()">🗑</button>
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
    .cat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; transition: transform .2s, box-shadow .2s; }
    .cat-card:hover { transform: translateY(-3px); box-shadow: 0 10px 32px rgba(0,0,0,.12); }
    .cat-card__banner { height: 100px; display: flex; align-items: center; justify-content: center; }
    .cat-card__icon { font-size: 2.75rem; filter: drop-shadow(0 2px 6px rgba(0,0,0,.2)); }
    .cat-card__body { flex: 1; padding: 1rem; display: flex; flex-direction: column; gap: .5rem; }
    .cat-card__top { display: flex; align-items: center; justify-content: space-between; gap: .5rem; }
    .cat-card__name { font-size: .9375rem; font-weight: 700; color: var(--text); }
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
    .cat-card--clickable { cursor: pointer; }
    .cat-card__browse { font-size: .8125rem; font-weight: 600; color: var(--accent); margin-top: .25rem; }
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
    this.router.navigate(['/events'], { queryParams: { categoryId: cat.id } });
  }

  getCatIcon(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('music') || n.includes('concert')) return '🎵';
    if (n.includes('sport') || n.includes('game'))    return '⚽';
    if (n.includes('tech')  || n.includes('code') || n.includes('dev')) return '💻';
    if (n.includes('art')   || n.includes('paint') || n.includes('gallery')) return '🎨';
    if (n.includes('food')  || n.includes('cook')  || n.includes('culinary')) return '🍽️';
    if (n.includes('business') || n.includes('conference') || n.includes('summit')) return '💼';
    if (n.includes('health') || n.includes('wellness') || n.includes('yoga')) return '🧘';
    if (n.includes('education') || n.includes('workshop') || n.includes('seminar')) return '📚';
    if (n.includes('film')  || n.includes('movie') || n.includes('cinema')) return '🎬';
    if (n.includes('travel') || n.includes('tour')) return '✈️';
    if (n.includes('fashion') || n.includes('style')) return '👗';
    if (n.includes('charity') || n.includes('fundrais')) return '❤️';
    return '🎭';
  }

  getCatBg(name: string, color: string): string {
    const n = name.toLowerCase();
    if (n.includes('music') || n.includes('concert')) return 'linear-gradient(135deg,#1a1a2e,#16213e)';
    if (n.includes('sport') || n.includes('game'))    return 'linear-gradient(135deg,#134e5e,#71b280)';
    if (n.includes('tech')  || n.includes('code') || n.includes('dev')) return 'linear-gradient(135deg,#0f0c29,#302b63)';
    if (n.includes('art')   || n.includes('paint') || n.includes('gallery')) return 'linear-gradient(135deg,#f093fb,#f5576c)';
    if (n.includes('food')  || n.includes('cook')  || n.includes('culinary')) return 'linear-gradient(135deg,#f7971e,#ffd200)';
    if (n.includes('business') || n.includes('conference') || n.includes('summit')) return 'linear-gradient(135deg,#1c3c5a,#2d6a9f)';
    if (n.includes('health') || n.includes('wellness') || n.includes('yoga')) return 'linear-gradient(135deg,#11998e,#38ef7d)';
    if (n.includes('education') || n.includes('workshop') || n.includes('seminar')) return 'linear-gradient(135deg,#4776e6,#8e54e9)';
    if (n.includes('film')  || n.includes('movie') || n.includes('cinema')) return 'linear-gradient(135deg,#232526,#414345)';
    if (n.includes('travel') || n.includes('tour')) return 'linear-gradient(135deg,#2980b9,#6dd5fa)';
    return `linear-gradient(135deg,${color}cc,${color}44)`;
  }
}
