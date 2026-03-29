import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
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
      <div class="top-row">
        <div class="filter-bar">
          @if (selectedVenueName) {
            <div class="venue-chip">
              🏛️ {{ selectedVenueName }}
              <button class="venue-chip__clear" (click)="selectedVenueId = ''; selectedVenueName = ''; page.set(1); loadEvents()">✕</button>
            </div>
          }
          <div class="search-wrap">
            <span class="search-icon">🔍</span>
            <input class="search-input" [(ngModel)]="keyword" placeholder="Search events…" (input)="onSearch()">
          </div>
          <select class="filter-cat" [(ngModel)]="selectedCategory" (change)="onSearch()">
            <option value="">All Categories</option>
            @for (cat of categories(); track cat.id) {
              <option [value]="cat.id">{{ cat.name }}</option>
            }
          </select>
          <input class="price-input" type="number" [(ngModel)]="minPrice" (input)="onSearch()" placeholder="Min ₹" min="0">
          <input class="price-input" type="number" [(ngModel)]="maxPrice" (input)="onSearch()" placeholder="Max ₹" min="0">
          <button class="btn btn--ghost btn--sm" (click)="clearFilters()">Clear</button>
        </div>
        <div class="cal-panel">
          <div class="cal-header">
            <button class="cal-nav" (click)="prevMonth()">&#8249;</button>
            <span class="cal-month">{{ calMonthLabel() }}</span>
            <button class="cal-nav" (click)="nextMonth()">&#8250;</button>
          </div>
          <div class="cal-grid">
            <div class="cal-dow">Su</div><div class="cal-dow">Mo</div><div class="cal-dow">Tu</div>
            <div class="cal-dow">We</div><div class="cal-dow">Th</div><div class="cal-dow">Fr</div>
            <div class="cal-dow">Sa</div>
            @for (cell of calCells(); track cell.key) {
              <div class="cal-cell"
                [class.cal-cell--empty]="!cell.day"
                [class.cal-cell--past]="cell.isPast"
                [class.cal-cell--has-event]="cell.hasEvent && !cell.isPast"
                [class.cal-cell--selected]="cell.day !== null && cell.day === selectedCalDay()"
                [class.cal-cell--today]="cell.isToday"
                (click)="cell.day && !cell.isPast ? selectCalDay(cell.day) : null">
                <span class="cal-num">{{ cell.day ?? '' }}</span>
                @if (cell.hasEvent && !cell.isPast) { <span class="cal-dot"></span> }
              </div>
            }
          </div>
          @if (selectedCalDay()) {
            <div class="cal-selected-label">
              &#128197; {{ calSelectedLabel() }}
              <button class="cal-clear" (click)="clearCalDay()">&#x2715;</button>
            </div>
          }
        </div>
      </div>
      <div class="events-wrap" [class.events-wrap--loading]="loading()">
        @if (!auth.isLoggedIn()) {
          <div class="guest-banner">
            <span class="guest-banner__icon">🎟️</span>
            <span class="guest-banner__text">Want to book tickets? Sign in to get started.</span>
            <a routerLink="/auth/login" class="btn btn--sm">Sign in to Book Tickets</a>
          </div>
        }
        <div class="events-grid">
          @for (ev of events(); track ev.id) {
            <a [routerLink]="['/events', ev.id]" class="event-card">
              <div class="event-card__img">
                <img [src]="getEventImg(ev.id, ev.category?.name)" [alt]="ev.title" class="event-card__photo" loading="lazy">
                <div class="event-card__img-overlay"></div>
              </div>
              <div class="event-card__top" [style.border-top-color]="ev.category?.colorCode">
                <span class="event-card__cat" [style.background]="ev.category?.colorCode + '22'" [style.color]="ev.category?.colorCode">{{ ev.category?.name }}</span>
                <span [class]="isExpired(ev) ? 'badge badge--red' : (ev.isActive ? 'badge badge--green' : 'badge badge--red')">
                  {{ isExpired(ev) ? 'Expired' : (ev.isActive ? 'Active' : 'Inactive') }}
                </span>
              </div>
              <div class="event-card__body">
                <h3 class="event-card__title">{{ ev.title }}</h3>
                @if (ev.description) {
                  <p class="event-card__desc">{{ ev.description | slice:0:90 }}{{ ev.description.length > 90 ? '…' : '' }}</p>
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
                  @if (ev.maxAttendees > 0) { 🎟 {{ ev.availableSeats }} left }
                  @else { 🎫 {{ ev.ticketCount }} booked }
                </span>
              </div>
            </a>
          } @empty {
            <div class="empty-full">
              @if (selectedCalDay()) {
                <!-- Calendar empty state cartoon -->
                <div class="empty-cartoon">
                  <div class="empty-ghost">
                    <div class="eg-body">
                      <div class="eg-eye eg-eye--l"></div>
                      <div class="eg-eye eg-eye--r"></div>
                      <div class="eg-mouth"></div>
                    </div>
                    <div class="eg-tail"></div>
                    <div class="eg-shadow"></div>
                  </div>
                </div>
                <p class="empty-title">Oops! No events on this date</p>
                <p class="empty-sub">Try selecting a different day or clear the date filter.</p>
                <button class="btn btn--ghost btn--sm" (click)="clearCalDay()">Clear Date Filter</button>
              } @else {
                <span class="empty-icon">📭</span>
                <p>{{ loading() ? 'Loading…' : 'No events found' }}</p>
                @if (!loading() && auth.isAdmin()) {
                  <a routerLink="/events/new" class="btn btn--sm">Create First Event</a>
                }
              }
            </div>
          }
        </div>
      </div>
      <app-pagination [currentPage]="page()" [pageSize]="pageSize" [totalCount]="totalCount()" (pageChange)="onPageChange($event)" />
    </div>
  `,
  styles: [`
    .top-row { display: flex; gap: 1.25rem; align-items: flex-start; margin-bottom: 1rem; flex-wrap: wrap; }
    .filter-bar { flex: 1; min-width: 0; display: flex; gap: .75rem; flex-wrap: wrap; align-items: center; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 1rem; }
    .search-wrap { position: relative; flex: 1; min-width: 160px; }
    .search-icon { position: absolute; left: .75rem; top: 50%; transform: translateY(-50%); font-size: .875rem; pointer-events: none; }
    .search-input { width: 100%; padding: .5rem .75rem .5rem 2.25rem; background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; color: var(--text); font-size: .875rem; font-family: inherit; }
    .filter-cat { padding: .5rem .75rem; background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; color: var(--text); font-size: .875rem; font-family: inherit; min-width: 130px; }
    .price-input { padding: .5rem .75rem; background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; color: var(--text); font-size: .875rem; width: 80px; font-family: inherit; }
    .cal-panel { width: 252px; flex-shrink: 0; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 1rem; }
    .cal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: .625rem; }
    .cal-month { font-size: .9rem; font-weight: 700; color: var(--text); }
    .cal-nav { background: none; border: none; cursor: pointer; font-size: 1.125rem; color: var(--muted); width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: background .12s; }
    .cal-nav:hover { background: var(--surface2); color: var(--text); }
    .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; }
    .cal-dow { text-align: center; font-size: .625rem; font-weight: 700; color: var(--muted); padding: .25rem 0; letter-spacing: .04em; }
    .cal-cell { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 30px; border-radius: 6px; cursor: pointer; transition: background .1s; user-select: none; }
    .cal-cell:hover:not(.cal-cell--empty) { background: var(--surface2); }
    .cal-cell--empty { cursor: default; pointer-events: none; }
    .cal-cell--past { cursor: default; pointer-events: none; }
    .cal-cell--past .cal-num { color: var(--muted); opacity: .4; }
    .cal-num { font-size: .8rem; line-height: 1; color: var(--text); }
    .cal-cell--today .cal-num { font-weight: 800; color: var(--accent); }
    .cal-cell--has-event .cal-num { font-weight: 600; }
    .cal-cell--selected { background: var(--accent) !important; border-radius: 6px; }
    .cal-cell--selected .cal-num { color: #fff !important; font-weight: 700; }
    .cal-dot { width: 4px; height: 4px; background: var(--accent); border-radius: 50%; margin-top: 1px; }
    .cal-cell--selected .cal-dot { background: rgba(255,255,255,.65); }
    .cal-selected-label { margin-top: .625rem; font-size: .8rem; color: var(--accent); font-weight: 600; display: flex; align-items: center; justify-content: space-between; padding: .3rem .5rem; background: rgba(0,113,227,.08); border-radius: 8px; }
    .cal-clear { background: none; border: none; cursor: pointer; color: var(--muted); font-size: .75rem; line-height: 1; padding: 2px 4px; border-radius: 4px; }
    .cal-clear:hover { color: var(--danger); background: rgba(255,59,48,.08); }
    .events-wrap { transition: opacity .2s; }
    .events-wrap--loading { opacity: .45; pointer-events: none; }
    .events-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem; }
    .event-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; border-top: 3px solid transparent; overflow: hidden; text-decoration: none; color: inherit; display: flex; flex-direction: column; transition: transform .2s, box-shadow .2s; }
    .event-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,.1); }
    .event-card__img { height: 160px; position: relative; overflow: hidden; }
    .event-card__photo { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .4s; }
    .event-card:hover .event-card__photo { transform: scale(1.06); }
    .event-card__img-icon { position: absolute; bottom: .5rem; right: .75rem; font-size: 1.5rem; z-index: 2; filter: drop-shadow(0 1px 4px rgba(0,0,0,.5)); }
    .event-card__img-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 40%, rgba(0,0,0,.45)); z-index: 1; }
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
    .empty-full { grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; gap: .75rem; padding: 3rem; color: var(--muted); text-align: center; }
    .empty-icon { font-size: 3rem; }
    .empty-title { font-size: 1.125rem; font-weight: 700; color: var(--text); }
    .empty-sub { font-size: .875rem; color: var(--muted); }
    /* Ghost cartoon */
    .empty-cartoon { margin-bottom: .5rem; }
    .empty-ghost { position: relative; width: 72px; height: 90px; margin: 0 auto; animation: ghostFloat 3s ease-in-out infinite; }
    @keyframes ghostFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    .eg-body { width: 72px; height: 72px; background: var(--accent); border-radius: 36px 36px 0 0; position: relative; display: flex; align-items: center; justify-content: center; gap: 10px; }
    .eg-eye { width: 10px; height: 12px; background: #fff; border-radius: 50%; position: relative; top: -4px; }
    .eg-eye::after { content:''; position: absolute; width: 4px; height: 5px; background: #1d1d1f; border-radius: 50%; top: 4px; left: 3px; }
    .eg-mouth { position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%); width: 18px; height: 7px; border: 2px solid #fff; border-top: none; border-radius: 0 0 9px 9px; }
    .eg-tail { height: 18px; background: var(--accent); clip-path: polygon(0 0,20% 0,20% 100%,40% 55%,60% 100%,80% 55%,100% 100%,100% 0); }
    .eg-shadow { width: 52px; height: 8px; background: rgba(0,113,227,.15); border-radius: 50%; margin: 3px auto 0; animation: ghostShadow 3s ease-in-out infinite; }
    @keyframes ghostShadow { 0%,100% { transform: scaleX(1); opacity:.4; } 50% { transform: scaleX(.7); opacity:.2; } }
    @media(max-width: 700px) { .top-row { flex-direction: column; } .cal-panel { width: 100%; } }
    .venue-chip { display: flex; align-items: center; gap: .375rem; background: rgba(0,113,227,.1); color: var(--accent); font-size: .8125rem; font-weight: 600; padding: .375rem .75rem; border-radius: 20px; white-space: nowrap; }
    .venue-chip__clear { background: none; border: none; cursor: pointer; color: var(--accent); font-size: .75rem; padding: 0 .125rem; line-height: 1; }
    .venue-chip__clear:hover { color: var(--danger); }
    .guest-banner { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; background: rgba(0,113,227,.06); border: 1px solid rgba(0,113,227,.15); border-radius: 14px; padding: .875rem 1.25rem; margin-bottom: 1rem; }
    .guest-banner__icon { font-size: 1.5rem; flex-shrink: 0; }
    .guest-banner__text { flex: 1; font-size: .9375rem; color: var(--text); font-weight: 500; }
    .guest-banner .btn { flex-shrink: 0; }
  `]
})
export class EventListComponent implements OnInit {
  auth = inject(AuthStore);
  private eventApi    = inject(EventApiService);
  private categoryApi = inject(CategoryApiService);
  private route       = inject(ActivatedRoute);

  loading          = signal(false);
  events           = signal<EventResponse[]>([]);
  allEvents        = signal<EventResponse[]>([]);
  categories       = signal<CategoryResponse[]>([]);
  totalCount       = signal(0);
  page             = signal(1);
  pageSize         = 20;

  keyword          = '';
  selectedCategory: any = '';
  selectedVenueId: any = '';
  selectedVenueName = '';
  minPrice: number | '' = '';
  maxPrice: number | '' = '';
  private searchTimer: any;

  private readonly todayDate = new Date();
  calYear        = signal(this.todayDate.getFullYear());
  calMonth       = signal(this.todayDate.getMonth());
  selectedCalDay = signal<number | null>(null);

  calMonthLabel = computed(() =>
    new Date(this.calYear(), this.calMonth(), 1)
      .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  );

  calSelectedLabel = computed(() => {
    const d = this.selectedCalDay();
    if (!d) return '';
    return new Date(this.calYear(), this.calMonth(), d)
      .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  });

  calCells = computed(() => {
    const year  = this.calYear();
    const month = this.calMonth();
    const firstDow    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const eventDays   = new Set<number>();
    for (const ev of this.allEvents()) {
      const d = new Date(ev.startDateTime);
      if (d.getFullYear() === year && d.getMonth() === month) eventDays.add(d.getDate());
    }

    // Today's date components for past-day comparison
    const todayY = this.todayDate.getFullYear();
    const todayM = this.todayDate.getMonth();
    const todayD = this.todayDate.getDate();

    const cells: { key: string; day: number | null; hasEvent: boolean; isToday: boolean; isPast: boolean }[] = [];
    for (let i = 0; i < firstDow; i++) cells.push({ key: `e${i}`, day: null, hasEvent: false, isToday: false, isPast: false });
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = d === todayD && month === todayM && year === todayY;
      // A day is past if it's before today (not today itself)
      const isPast = year < todayY
        || (year === todayY && month < todayM)
        || (year === todayY && month === todayM && d < todayD);
      cells.push({ key: `d${d}`, day: d, hasEvent: eventDays.has(d), isToday, isPast });
    }
    return cells;
  });

  prevMonth() {
    const hadFilter = this.selectedCalDay() !== null;
    if (this.calMonth() === 0) { this.calMonth.set(11); this.calYear.update(y => y - 1); }
    else { this.calMonth.update(v => v - 1); }
    this.selectedCalDay.set(null);
    // Only reload if a date was selected — clears the date filter
    if (hadFilter) { this.page.set(1); this.loadEvents(); }
  }

  nextMonth() {
    const hadFilter = this.selectedCalDay() !== null;
    if (this.calMonth() === 11) { this.calMonth.set(0); this.calYear.update(y => y + 1); }
    else { this.calMonth.update(v => v + 1); }
    this.selectedCalDay.set(null);
    // Only reload if a date was selected — clears the date filter
    if (hadFilter) { this.page.set(1); this.loadEvents(); }
  }

  selectCalDay(day: number) {
    // Block past days
    const year  = this.calYear();
    const month = this.calMonth();
    const clicked = new Date(year, month, day);
    const today   = new Date(this.todayDate.getFullYear(), this.todayDate.getMonth(), this.todayDate.getDate());
    if (clicked < today) return; // past date — do nothing

    this.selectedCalDay.set(this.selectedCalDay() === day ? null : day);
    this.page.set(1);
    this.loadEvents();
  }

  clearCalDay() {
    this.selectedCalDay.set(null);
    this.page.set(1);
    this.loadEvents();
  }

  ngOnInit() {
    this.categoryApi.getAll(1, 100).subscribe({ next: r => this.categories.set(r.items) });
    this.eventApi.getAll(1, 1000).subscribe({ next: r => this.allEvents.set(r.items) });

    // Pre-select filters from query params (category or venue navigation)
    const qp = this.route.snapshot.queryParams;
    if (qp['categoryId'])  this.selectedCategory = qp['categoryId'];
    if (qp['venueId'])     { this.selectedVenueId = qp['venueId']; this.selectedVenueName = qp['venueName'] || ''; }
    this.loadEvents();
  }

  loadEvents() {
    this.loading.set(true);
    const day = this.selectedCalDay();
    const filter: any = { page: this.page(), pageSize: this.pageSize };
    if (this.keyword)          filter.keyword    = this.keyword;
    if (this.selectedCategory) filter.categoryId = this.selectedCategory;
    if (this.selectedVenueId)  filter.venueId    = this.selectedVenueId;
    if (this.minPrice !== '')  filter.minPrice   = this.minPrice;
    if (this.maxPrice !== '')  filter.maxPrice   = this.maxPrice;
    if (day !== null) {
      const pad = (n: number) => String(n).padStart(2, '0');
      const y = this.calYear(), m = this.calMonth() + 1;
      const dateStr     = `${y}-${pad(m)}-${pad(day)}`;
      const nextDay     = new Date(this.calYear(), this.calMonth(), day + 1);
      const nextDateStr = `${nextDay.getFullYear()}-${pad(nextDay.getMonth() + 1)}-${pad(nextDay.getDate())}`;
      filter.startDate = dateStr;
      filter.endDate   = nextDateStr;
    }
    const hasFilter = this.keyword || this.selectedCategory || this.selectedVenueId || this.minPrice !== '' || this.maxPrice !== '' || day !== null;
    const call = hasFilter ? this.eventApi.search(filter) : this.eventApi.getAll(this.page(), this.pageSize);
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
    this.keyword = ''; this.selectedCategory = ''; this.selectedVenueId = ''; this.selectedVenueName = '';
    this.minPrice = ''; this.maxPrice = '';
    this.selectedCalDay.set(null); this.page.set(1); this.loadEvents();
  }

  onPageChange(p: number) { this.page.set(p); this.loadEvents(); }

  isExpired(ev: EventResponse): boolean { return new Date(ev.endDateTime) <= new Date(); }

  // Verified Unsplash photo URLs — party, festival, concert images
  private readonly EVENT_PHOTOS = [
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80', // concert crowd
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80', // festival
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80', // concert stage lights
    'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&q=80', // party crowd
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=80', // concert lights
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&q=80', // festival crowd
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80', // event stage
    'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80', // concert
    'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&q=80', // music festival
    'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=600&q=80', // party
    'https://images.unsplash.com/photo-1563841930606-67e2bce48b78?w=600&q=80', // festival lights
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80', // dj party
  ];

  getEventImg(id: number, categoryName?: string): string {
    return this.EVENT_PHOTOS[id % this.EVENT_PHOTOS.length];
  }

  getCategoryIcon(name?: string): string {
    if (!name) return '🎭';
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
}
