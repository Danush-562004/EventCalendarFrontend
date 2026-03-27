import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EventApiService, CategoryApiService, VenueApiService } from '../../../core/services/api.service';
import { AuthStore } from '../../../core/services/auth.store';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { CategoryResponse, VenueResponse } from '../../../core/models';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingComponent],
  template: `
    <div class="page">
      <a routerLink="/events" class="back-link">← Back to Events</a>
      <div class="page-header">
        <h1 class="page-title">{{ isEdit() ? 'Edit Event' : 'Create Event' }}</h1>
      </div>

      @if (loading()) {
        <app-loading text="Loading…" />
      } @else {
        <div class="form-card">
          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="form-section">
              <h3 class="form-section__title">Basic Info</h3>
              <div class="form-grid">
                <div class="form-field form-field--full">
                  <label class="form-label">Event Title *</label>
                  <input class="form-input" formControlName="title" placeholder="My Awesome Event">
                  @if (f['title'].invalid && f['title'].touched) {
                    <span class="form-error">Title is required (max 300 chars)</span>
                  }
                </div>
                <div class="form-field form-field--full">
                  <label class="form-label">Description</label>
                  <textarea class="form-input form-textarea" formControlName="description" rows="4" placeholder="Describe your event…"></textarea>
                </div>
                <div class="form-field">
                  <label class="form-label">Category *</label>
                  <select class="form-select" formControlName="categoryId">
                    <option value="">Select category…</option>
                    @for (cat of categories(); track cat.id) {
                      <option [value]="cat.id">{{ cat.name }}</option>
                    }
                  </select>
                  @if (f['categoryId'].invalid && f['categoryId'].touched) {
                    <span class="form-error">Category required</span>
                  }
                </div>
                <div class="form-field">
                  <label class="form-label">Venue</label>
                  <select class="form-select" formControlName="venueId" (change)="onVenueChange()">
                    <option value="">No venue</option>
                    @for (v of venues(); track v.id) {
                      <option [value]="v.id">{{ v.name }} – {{ v.city }} (cap: {{ v.capacity | number }})</option>
                    }
                  </select>
                </div>
                <div class="form-field">
                  <label class="form-label">Location (custom)</label>
                  <input class="form-input" formControlName="location" placeholder="e.g. Online / Room 5">
                </div>
                <div class="form-field">
                  <label class="form-label">
                    Max Attendees
                    @if (selectedVenueCapacity()) {
                      <span class="capacity-hint"> — venue cap: {{ selectedVenueCapacity() | number }}</span>
                    }
                  </label>
                  <input class="form-input" type="number" formControlName="maxAttendees" min="0"
                    [max]="selectedVenueCapacity() || 999999">
                  @if (selectedVenueCapacity() && (f['maxAttendees'].value ?? 0) > selectedVenueCapacity()!) {
                    <span class="form-error">Cannot exceed venue capacity of {{ selectedVenueCapacity() | number }}</span>
                  }
                </div>
                <div class="form-field">
                    <label class="form-label">Ticket Price <span class="optional">(0 = Free)</span></label>
                    <input class="form-input" type="number" formControlName="price" min="0" placeholder="0">
                     @if (f['price'].invalid && f['price'].touched) {
                        <span class="form-error">Price must be 0 or more</span>
                      }
                </div>
              </div>
            </div>

            <div class="form-section">
              <h3 class="form-section__title">Schedule</h3>
              <div class="form-grid">
                <div class="form-field">
                  <label class="form-label">Start Date & Time *</label>
                  <input class="form-input" type="datetime-local" formControlName="startDateTime" [min]="minDateTime">
                  @if (f['startDateTime'].invalid && f['startDateTime'].touched) {
                    <span class="form-error">Required</span>
                  }
                </div>
                <div class="form-field">
                  <label class="form-label">End Date & Time *</label>
                  <input class="form-input" type="datetime-local" formControlName="endDateTime" [min]="minDateTime">
                  @if (f['endDateTime'].invalid && f['endDateTime'].touched) {
                    <span class="form-error">Required</span>
                  }
                </div>
              </div>
            </div>

            @if (!auth.isAdmin()) {
            <div class="form-section">
              <h3 class="form-section__title">Reminder</h3>
              <div class="form-grid">
                <div class="form-field">
                  <label class="form-label toggle-label">
                    <input type="checkbox" formControlName="reminderEnabled" class="toggle-checkbox">
                    <span class="toggle-slider"></span>
                    Enable Reminder
                  </label>
                </div>
                @if (form.get('reminderEnabled')?.value) {
                  <div class="form-field">
                    <label class="form-label">Minutes Before</label>
                    <input class="form-input" type="number" formControlName="reminderMinutesBefore" min="1" placeholder="30">
                  </div>
                }
              </div>
            </div>
            }

            <div class="form-actions">
              <a routerLink="/events" class="btn btn--ghost">Cancel</a>
              <button type="submit" class="btn" [disabled]="saving()">
                @if (saving()) { <span class="btn-spinner"></span> }
                {{ isEdit() ? 'Save Changes' : 'Create Event' }}
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  `,
  styles: [`
    .form-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 2rem; }
    .form-section { margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid var(--border); }
    .form-section:last-of-type { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .form-section__title { font-size: 1rem; font-weight: 700; color: var(--accent); margin-bottom: 1.25rem; text-transform: uppercase; letter-spacing: .06em; font-size: .8125rem; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-field--full { grid-column: 1/-1; }
    @media(max-width:640px) { .form-grid { grid-template-columns: 1fr; } .form-field--full { grid-column: auto; } }
    .form-textarea { resize: vertical; min-height: 100px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; }
    .toggle-label { display: flex; align-items: center; gap: .75rem; cursor: pointer; }
    .toggle-checkbox { display: none; }
    .toggle-slider { position: relative; width: 44px; height: 24px; background: var(--border); border-radius: 12px; transition: background .2s; flex-shrink: 0; }
    .toggle-slider::after { content: ''; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; background: white; border-radius: 50%; transition: transform .2s; }
    .toggle-checkbox:checked + .toggle-slider { background: var(--accent); }
    .toggle-checkbox:checked + .toggle-slider::after { transform: translateX(20px); }
    .back-link { display: inline-flex; align-items: center; gap: .375rem; color: var(--muted); font-size: .875rem; text-decoration: none; margin-bottom: 1.5rem; }
    .back-link:hover { color: var(--text); }
    .capacity-hint { color: var(--accent); font-weight: 600; font-size: .75rem; }
  `]
})
export class EventFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventApi = inject(EventApiService);
  private categoryApi = inject(CategoryApiService);
  private venueApi = inject(VenueApiService);
  private toast = inject(ToastService);
  auth = inject(AuthStore);

  loading = signal(false);
  saving = signal(false);
  isEdit = signal(false);
  categories = signal<CategoryResponse[]>([]);
  venues = signal<VenueResponse[]>([]);
  selectedVenueCapacity = signal<number | null>(null);
  private eventId?: number;

  // Minimum datetime = now (prevents selecting past dates)
  readonly minDateTime = new Date().toISOString().slice(0, 16);

  form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(300)]],
    description: [''],
    startDateTime: ['', Validators.required],
    endDateTime: ['', Validators.required],
    location: [''],
    reminderEnabled: [false],
    reminderMinutesBefore: [null as number | null],
    maxAttendees: [0],
    categoryId: ['', Validators.required],
    venueId: [null as number | null],
    price: [0, [Validators.required, Validators.min(0)]]
  });

  get f() { return this.form.controls; }

  onVenueChange() {
    const venueId = this.form.value.venueId;
    if (!venueId) {
      this.selectedVenueCapacity.set(null);
      return;
    }
    const venue = this.venues().find(v => v.id === Number(venueId));
    this.selectedVenueCapacity.set(venue?.capacity ?? null);
    // Auto-clamp maxAttendees if it exceeds the new venue capacity
    const cap = venue?.capacity ?? 0;
    const current = this.form.value.maxAttendees ?? 0;
    if (cap > 0 && current > cap) {
      this.form.patchValue({ maxAttendees: cap });
    }
  }

  ngOnInit() {
    this.categoryApi.getAll(1, 100).subscribe({ next: r => this.categories.set(r.items) });
    this.venueApi.getAll(1, 100).subscribe({
      next: r => {
        this.venues.set(r.items);
        // If editing, set venue capacity once venues are loaded
        const venueId = this.form.value.venueId;
        if (venueId) {
          const venue = r.items.find(v => v.id === Number(venueId));
          this.selectedVenueCapacity.set(venue?.capacity ?? null);
        }
      }
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.eventId = Number(id);
      this.loading.set(true);
      this.eventApi.getById(this.eventId).subscribe({
        next: ev => {
          this.form.patchValue({
            title: ev.title,
            description: ev.description || '',
            startDateTime: ev.startDateTime.slice(0, 16),
            endDateTime: ev.endDateTime.slice(0, 16),
            location: ev.location || '',
            reminderEnabled: ev.reminderEnabled,
            reminderMinutesBefore: ev.reminderMinutesBefore ?? null,
            maxAttendees: ev.maxAttendees,
            categoryId: ev.category?.id as any,
            venueId: ev.venue?.id ?? null,
            price: ev.price ?? 0
          });
          // Set venue capacity from the loaded event
          if (ev.venue) {
            this.selectedVenueCapacity.set(ev.venue.capacity);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    }
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    // Validate venue capacity
    const cap = this.selectedVenueCapacity();
    const maxAtt = this.form.value.maxAttendees ?? 0;
    if (cap && maxAtt > 0 && maxAtt > cap) {
      this.toast.error(`Max attendees (${maxAtt}) cannot exceed venue capacity (${cap}).`);
      return;
    }

    this.saving.set(true);
    const v = this.form.value;
    const payload: any = {
      title: v.title,
      description: v.description || undefined,
      startDateTime: v.startDateTime,
      endDateTime: v.endDateTime,
      location: v.location || undefined,
      reminderEnabled: v.reminderEnabled,
      reminderMinutesBefore: v.reminderEnabled ? v.reminderMinutesBefore : undefined,
      maxAttendees: v.maxAttendees ?? 0,
      categoryId: Number(v.categoryId),
      venueId: v.venueId ? Number(v.venueId) : undefined,
      price: Number(v.price) ?? 0
    };

    const call = this.isEdit()
      ? this.eventApi.update(this.eventId!, payload)
      : this.eventApi.create(payload);

    call.subscribe({
      next: ev => {
        this.toast.success(this.isEdit() ? 'Event updated successfully!' : 'Event created successfully!');
        this.router.navigate(['/events', ev.id]);
      },
      error: (err) => {
        const msg = err?.error?.message || (this.isEdit() ? 'Failed to update event.' : 'Failed to create event.');
        this.toast.error(msg);
        this.saving.set(false);
      },
      complete: () => this.saving.set(false)
    });
  }
}
