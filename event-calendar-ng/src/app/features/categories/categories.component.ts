import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
            <div class="cat-card">
              <div class="cat-card__color" [style.background]="cat.colorCode"></div>
              <div class="cat-card__body">
                <h3 class="cat-card__name">{{ cat.name }}</h3>
                @if (cat.description) { <p class="cat-card__desc">{{ cat.description }}</p> }
                <div class="cat-card__meta">
                  <span class="badge" [class]="cat.isActive ? 'badge--green' : 'badge--red'">{{ cat.isActive ? 'Active' : 'Inactive' }}</span>
                  <span class="cat-card__date">{{ cat.createdAt | date:'MMM y' }}</span>
                </div>
              </div>
              @if (auth.isAdmin()) {
                <div class="cat-card__actions">
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
    .cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
    .cat-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
      padding: 1.25rem 1.25rem 1rem; display: flex; flex-direction: column; gap: .75rem;
      position: relative; transition: transform .2s, box-shadow .2s;
    }
    .cat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,.18); }
    .cat-card__color { width: 100%; height: 6px; border-radius: 4px; }
    .cat-card__body { flex: 1; }
    .cat-card__name { font-size: 1rem; font-weight: 700; color: var(--text); margin-bottom: .25rem; }
    .cat-card__desc { font-size: .8125rem; color: var(--muted); margin-bottom: .5rem; }
    .cat-card__meta { display: flex; align-items: center; justify-content: space-between; }
    .cat-card__date { font-size: .75rem; color: var(--muted); }
    .cat-card__actions { display: flex; gap: .375rem; justify-content: flex-end; }
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
}
