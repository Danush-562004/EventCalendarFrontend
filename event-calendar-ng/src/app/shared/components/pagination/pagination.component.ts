import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (totalPages() > 1) {
      <div class="pagination">
        <button class="page-btn" [disabled]="currentPage() === 1" (click)="changePage(currentPage() - 1)">‹</button>
        @for (p of visiblePages(); track p) {
          @if (p === -1) {
            <span class="page-ellipsis">…</span>
          } @else {
            <button class="page-btn" [class.active]="p === currentPage()" (click)="changePage(p)">{{ p }}</button>
          }
        }
        <button class="page-btn" [disabled]="currentPage() === totalPages()" (click)="changePage(currentPage() + 1)">›</button>
        <span class="page-info">{{ (currentPage()-1)*pageSize() + 1 }}–{{ min(currentPage()*pageSize(), totalCount()) }} of {{ totalCount() }}</span>
      </div>
    }
  `,
  styles: [`
    .pagination { display: flex; align-items: center; gap: .375rem; flex-wrap: wrap; }
    .page-btn {
      min-width: 2rem; height: 2rem; padding: 0 .5rem;
      border-radius: 8px; border: 1px solid var(--border);
      background: var(--surface2); color: var(--text);
      cursor: pointer; font-size: .8125rem; font-weight: 500;
      transition: all .15s;
    }
    .page-btn:hover:not(:disabled) { background: var(--accent); color: #000; border-color: var(--accent); }
    .page-btn.active { background: var(--accent); color: #000; border-color: var(--accent); }
    .page-btn:disabled { opacity: .35; cursor: not-allowed; }
    .page-ellipsis { padding: 0 .25rem; color: var(--muted); }
    .page-info { margin-left: .5rem; font-size: .75rem; color: var(--muted); }
  `]
})
export class PaginationComponent {
  currentPage = input.required<number>();
  pageSize = input.required<number>();
  totalCount = input.required<number>();
  pageChange = output<number>();

  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()));

  visiblePages = computed(() => {
    const total = this.totalPages();
    const cur = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [1];
    if (cur > 3) pages.push(-1);
    for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) pages.push(p);
    if (cur < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  });

  changePage(p: number) {
    if (p >= 1 && p <= this.totalPages()) this.pageChange.emit(p);
  }

  min(a: number, b: number) { return Math.min(a, b); }
}
