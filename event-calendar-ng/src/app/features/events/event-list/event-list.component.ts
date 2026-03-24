import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventApiService, CategoryApiService } from '../../../core/services/api.service';
import { AuthStore } from '../../../core/services/auth.store';
import { EventResponse, CategoryResponse } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LoadingComponent, PaginationComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Events</h1>
          <p class="page-sub">Discover and manage events</p>
        </div>
        @if (auth.isAdmin()) {
          <a routerLink="/events/new" class="btn">+ Create Event</a>
        }
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <div class="search-wrap">
          <span class="search-icon">🔍</span>
          <input class="search-input" [(ngModel)]="keyword" placeholder="Search events…" (input)="onSearch()">
        </div>
        <select class="form-select" [(ngModel)]="selectedCategory" (change)="onSearch()">
          <option value="">All Categories</option>
          @for (cat of categories(); track cat.id) {
            <option [value]="cat.id">{{ cat.name }}</option>
          }
        </select>
        <input class="form-input form-input--date" type="date" [(ngModel)]="startDate" (change)="onSearch()" placeholder="From">
        <input class="form-input form-input--date" type="date" [(ngModel)]="endDate" (change)="onSearch()" placeholder="To">
        <button class="btn btn--ghost btn--sm" (click)="clearFilters()">Clear</button>
      </div>

      @if (loading()) {
        <app-loading text="Loading events…" />
      } @else {
        <div class="events-grid">
          @for (ev of events(); track ev.id) {
            <a [routerLink]="['/events', ev.id]" class="event-card">
              <div class="event-card__img" [style.background]="'linear-gradient(135deg, ' + (ev.category?.colorCode || '#6366f1') + '33, ' + (ev.category?.colorCode || '#6366f1') + '11)'">
                <span class="event-card__img-icon">{{ getCategoryIcon(ev.category?.name) }}</span>
              </div>
              <div class="event-card__top" [style.border-top-color]="ev.category?.colorCode">
                <span class="event-card__cat" [style.background]="ev.category?.colorCode + '22'" [style.color]="ev.category?.colorCode">
                  {{ ev.category?.name }}
                </span>
                <span class="event-card__status" [class]="ev.isActive ? 'badge badge--green' : 'badge badge--red'">
                  {{ ev.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>
              <div class="event-card__body">
                <h3 class="event-card__title">{{ ev.title }}</h3>
                @if (ev.description) {
                  <p class="event-card__desc">{{ ev.description | slice:0:100 }}{{ ev.description.length > 100 ? '…' : '' }}</p>
                }
                <div class="event-card__meta">
                  <span>📅 {{ ev.startDateTime | date:'MMM d, y' }}</span>
                  <span>🕐 {{ ev.startDateTime | date:'h:mm a' }}</span>
                </div>
                @if (ev.venue) {
                  <div class="event-card__venue">📍 {{ ev.venue.name }}, {{ ev.venue.city }}</div>
                }
              </div>
              <div class="event-card__footer">
                <span class="event-card__price">{{ ev.price > 0 ? '₹' + (ev.price | number) : 'Free' }}</span>
                <span class="event-card__seats">
                  @if (ev.maxAttendees > 0) {
                    🎟 {{ ev.availableSeats }} left
                  } @else {
                    🎫 {{ ev.ticketCount }} booked
                  }
                </span>
              </div>
            </a>
          } @empty {
            <div class="empty-full">
              <span class="empty-icon">📭</span>
              <p>No events found</p>
              @if (auth.isAdmin()) {
                <a routerLink="/events/new" class="btn btn--sm">Create First Event</a>
              }
            </div>
          }
        </div>

        <app-pagination
          [currentPage]="page()"
          [pageSize]="pageSize"
          [totalCount]="totalCount()"
          (pageChange)="onPageChange($event)"
        />
      }
    </div>
  `,
  styles: [`
    .filter-bar {
      display: flex; gap: .75rem; flex-wrap: wrap; align-items: center; margin-bottom: 1.5rem;
      background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 1rem;
    }
    .search-wrap { position: relative; flex: 1; min-width: 200px; }
    .search-icon { position: absolute; left: .75rem; top: 50%; transform: translateY(-50%); font-size: .875rem; }
    .search-input { width: 100%; padding: .5rem .75rem .5rem 2.25rem; background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; color: var(--text); font-size: .875rem; }
    .form-input--date { padding: .5rem .75rem; background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; color: var(--text); font-size: .875rem; }
    .events-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem; }
    .event-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
      border-top: 3px solid transparent; overflow: hidden; text-decoration: none; color: inherit;
      display: flex; flex-direction: column; transition: transform .2s, box-shadow .2s;
    }
    .event-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,.25); }
    .event-card__img { height: 120px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
    .event-card__img-icon { font-size: 3rem; opacity: .7; }
    .event-card__top { display: flex; align-items: center; justify-content: space-between; padding: .875rem 1rem .5rem; }
    .event-card__cat { font-size: .75rem; font-weight: 600; padding: .25rem .625rem; border-radius: 6px; }
    .event-card__body { flex: 1; padding: .5rem 1rem .875rem; }
    .event-card__title { font-size: 1rem; font-weight: 700; color: var(--text); margin-bottom: .375rem; line-height: 1.3; }
    .event-card__desc { font-size: .8125rem; color: var(--muted); margin-bottom: .75rem; line-height: 1.5; }
    .event-card__meta { display: flex; gap: 1rem; font-size: .8125rem; color: var(--muted); margin-bottom: .375rem; flex-wrap: wrap; }
    .event-card__venue { font-size: .8125rem; color: var(--muted); }
    .event-card__footer { display: flex; align-items: center; justify-content: space-between; padding: .75rem 1rem; border-top: 1px solid var(--border); }
    .event-card__price { font-size: .875rem; font-weight: 700; color: var(--accent); }
    .event-card__seats { font-size: .8125rem; font-weight: 600; color: var(--muted); }
    .empty-full { grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem; color: var(--muted); text-align: center; }
    .empty-icon { font-size: 3rem; }
  `]
})
export class EventListComponent implements OnInit {
  auth = inject(AuthStore);
  private eventApi = inject(EventApiService);
  private categoryApi = inject(CategoryApiService);

  loading = signal(true);
  events = signal<EventResponse[]>([]);
  categories = signal<CategoryResponse[]>([]);
  totalCount = signal(0);
  page = signal(1);
  pageSize = 20;

  keyword = '';
  selectedCategory: any = '';
  startDate = '';
  endDate = '';
  private searchTimer: any;

  ngOnInit() {
    this.categoryApi.getAll(1, 100).subscribe({ next: r => this.categories.set(r.items) });
    this.loadEvents();
  }

  loadEvents() {
    this.loading.set(true);
    const filter: any = { page: this.page(), pageSize: this.pageSize };
    if (this.keyword) filter.keyword = this.keyword;
    if (this.selectedCategory) filter.categoryId = this.selectedCategory;
    if (this.startDate) filter.startDate = this.startDate;
    if (this.endDate) filter.endDate = this.endDate;

    const call = (this.keyword || this.selectedCategory || this.startDate || this.endDate)
      ? this.eventApi.search(filter)
      : this.eventApi.getAll(this.page(), this.pageSize);

    call.subscribe({
      next: r => { this.events.set(r.items); this.totalCount.set(r.totalCount); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.page.set(1);
    this.searchTimer = setTimeout(() => this.loadEvents(), 400);
  }

  clearFilters() {
    this.keyword = '';
    this.selectedCategory = '';
    this.startDate = '';
    this.endDate = '';
    this.page.set(1);
    this.loadEvents();
  }

  onPageChange(p: number) {
    this.page.set(p);
    this.loadEvents();
  }

  getCategoryIcon(name?: string): string {
    if (!name) return '🎭';
    const n = name.toLowerCase();
    if (n.includes('music') || n.includes('concert')) return '🎵';
    if (n.includes('sport') || n.includes('game')) return '⚽';
    if (n.includes('tech') || n.includes('code') || n.includes('dev')) return '💻';
    if (n.includes('art') || n.includes('paint') || n.includes('gallery')) return '🎨';
    if (n.includes('food') || n.includes('cook') || n.includes('culinary')) return '🍽️';
    if (n.includes('business') || n.includes('conference') || n.includes('summit')) return '💼';
    if (n.includes('health') || n.includes('wellness') || n.includes('yoga')) return '🧘';
    if (n.includes('education') || n.includes('workshop') || n.includes('seminar')) return '📚';
    if (n.includes('film') || n.includes('movie') || n.includes('cinema')) return '🎬';
    if (n.includes('travel') || n.includes('tour')) return '✈️';
    if (n.includes('fashion') || n.includes('style')) return '👗';
    if (n.includes('charity') || n.includes('fundrais')) return '❤️';
    return '🎭';
  }
}
