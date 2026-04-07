import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  ApiResponse, PagedResponse,
  AuthResponse, LoginRequest, RegisterRequest,
  UserResponse, UpdateUserRequest, ChangePasswordRequest,
  CategoryResponse, CreateCategoryRequest, UpdateCategoryRequest,
  VenueResponse, CreateVenueRequest, UpdateVenueRequest,
  EventResponse, CreateEventRequest, UpdateEventRequest, EventFilterRequest,
  TicketResponse, CreateTicketRequest, UpdateTicketRequest,
  PaymentResponse, CreatePaymentRequest, UpdatePaymentRequest,
  ReminderResponse, CreateReminderRequest, UpdateReminderRequest,
  AuditLogResponse, NotificationResponse
} from '../models';

// Uses Angular dev proxy (proxy.conf.json) → forwards to https://localhost:5001
// If deploying, change this to the full backend URL e.g. 'https://yourdomain.com/api'
const BASE = '/api';

function unwrap<T>(obs: Observable<ApiResponse<T>>): Observable<T> {
  return obs.pipe(map(r => r.data));
}

// ─── Auth ──────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private http = inject(HttpClient);

  login(body: LoginRequest): Observable<AuthResponse> {
    return unwrap(this.http.post<ApiResponse<AuthResponse>>(`${BASE}/auth/login`, body));
  }

  register(body: RegisterRequest): Observable<AuthResponse> {
    return unwrap(this.http.post<ApiResponse<AuthResponse>>(`${BASE}/auth/register`, body));
  }
}

// ─── Users ─────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class UserApiService {
  private http = inject(HttpClient);

  getAll(page = 1, pageSize = 20, search?: string): Observable<PagedResponse<UserResponse>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (search) params = params.set('search', search);
    return unwrap(this.http.get<ApiResponse<PagedResponse<UserResponse>>>(`${BASE}/users`, { params }));
  }

  getById(id: number): Observable<UserResponse> {
    return unwrap(this.http.get<ApiResponse<UserResponse>>(`${BASE}/users/${id}`));
  }

  update(id: number, body: UpdateUserRequest): Observable<UserResponse> {
    return unwrap(this.http.put<ApiResponse<UserResponse>>(`${BASE}/users/${id}`, body));
  }

  delete(id: number): Observable<object> {
    return unwrap(this.http.delete<ApiResponse<object>>(`${BASE}/users/${id}`));
  }

  changePassword(id: number, body: ChangePasswordRequest): Observable<object> {
    return unwrap(this.http.put<ApiResponse<object>>(`${BASE}/users/me/change-password`, body));
  }
}

// ─── Categories ────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class CategoryApiService {
  private http = inject(HttpClient);

  getAll(page = 1, pageSize = 100): Observable<PagedResponse<CategoryResponse>> {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);
    return unwrap(this.http.get<ApiResponse<PagedResponse<CategoryResponse>>>(`${BASE}/categories`, { params }));
  }

  getById(id: number): Observable<CategoryResponse> {
    return unwrap(this.http.get<ApiResponse<CategoryResponse>>(`${BASE}/categories/${id}`));
  }

  create(body: CreateCategoryRequest): Observable<CategoryResponse> {
    return unwrap(this.http.post<ApiResponse<CategoryResponse>>(`${BASE}/categories`, body));
  }

  update(id: number, body: UpdateCategoryRequest): Observable<CategoryResponse> {
    return unwrap(this.http.put<ApiResponse<CategoryResponse>>(`${BASE}/categories/${id}`, body));
  }

  delete(id: number): Observable<object> {
    return unwrap(this.http.delete<ApiResponse<object>>(`${BASE}/categories/${id}`));
  }
}

// ─── Venues ────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class VenueApiService {
  private http = inject(HttpClient);

  getAll(page = 1, pageSize = 50, city?: string, country?: string): Observable<PagedResponse<VenueResponse>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (city)    params = params.set('city', city);
    if (country) params = params.set('country', country);
    return unwrap(this.http.get<ApiResponse<PagedResponse<VenueResponse>>>(`${BASE}/venues`, { params }));
  }

  getById(id: number): Observable<VenueResponse> {
    return unwrap(this.http.get<ApiResponse<VenueResponse>>(`${BASE}/venues/${id}`));
  }

  create(body: CreateVenueRequest): Observable<VenueResponse> {
    return unwrap(this.http.post<ApiResponse<VenueResponse>>(`${BASE}/venues`, body));
  }

  update(id: number, body: UpdateVenueRequest): Observable<VenueResponse> {
    return unwrap(this.http.put<ApiResponse<VenueResponse>>(`${BASE}/venues/${id}`, body));
  }

  delete(id: number): Observable<object> {
    return unwrap(this.http.delete<ApiResponse<object>>(`${BASE}/venues/${id}`));
  }
}

// ─── Events ────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class EventApiService {
  private http = inject(HttpClient);

  getAll(page = 1, pageSize = 20): Observable<PagedResponse<EventResponse>> {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);
    return unwrap(this.http.get<ApiResponse<PagedResponse<EventResponse>>>(`${BASE}/events`, { params }));
  }

  search(filter: EventFilterRequest): Observable<PagedResponse<EventResponse>> {
    let params = new HttpParams()
      .set('page',     filter.page     ?? 1)
      .set('pageSize', filter.pageSize ?? 20);
    if (filter.keyword)    params = params.set('keyword',    filter.keyword);
    if (filter.categoryId) params = params.set('categoryId', filter.categoryId);
    if (filter.venueId)    params = params.set('venueId',    filter.venueId);
    if (filter.startDate)  params = params.set('startDate',  filter.startDate);
    if (filter.endDate)    params = params.set('endDate',    filter.endDate);
    if (filter.minPrice != null) params = params.set('minPrice', filter.minPrice);
    if (filter.maxPrice != null) params = params.set('maxPrice', filter.maxPrice);
    return unwrap(this.http.get<ApiResponse<PagedResponse<EventResponse>>>(`${BASE}/events/search`, { params }));
  }

  getById(id: number): Observable<EventResponse> {
    return unwrap(this.http.get<ApiResponse<EventResponse>>(`${BASE}/events/${id}`));
  }

  getMyEvents(): Observable<EventResponse[]> {
    return unwrap(this.http.get<ApiResponse<EventResponse[]>>(`${BASE}/events/my-events`));
  }

  create(body: CreateEventRequest): Observable<EventResponse> {
    return unwrap(this.http.post<ApiResponse<EventResponse>>(`${BASE}/events`, body));
  }

  update(id: number, body: UpdateEventRequest): Observable<EventResponse> {
    return unwrap(this.http.put<ApiResponse<EventResponse>>(`${BASE}/events/${id}`, body));
  }

  delete(id: number): Observable<object> {
    return unwrap(this.http.delete<ApiResponse<object>>(`${BASE}/events/${id}`));
  }
}

// ─── Tickets ───────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class TicketApiService {
  private http = inject(HttpClient);

  getAll(page = 1, pageSize = 20, status?: string): Observable<PagedResponse<TicketResponse>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (status) params = params.set('status', status);
    return unwrap(this.http.get<ApiResponse<PagedResponse<TicketResponse>>>(`${BASE}/tickets`, { params }));
  }

  getById(id: number): Observable<TicketResponse> {
    return unwrap(this.http.get<ApiResponse<TicketResponse>>(`${BASE}/tickets/${id}`));
  }

  getMyTickets(): Observable<TicketResponse[]> {
    return unwrap(this.http.get<ApiResponse<TicketResponse[]>>(`${BASE}/tickets/my-tickets`));
  }

  getByEvent(eventId: number): Observable<TicketResponse[]> {
    return unwrap(this.http.get<ApiResponse<TicketResponse[]>>(`${BASE}/tickets/by-event/${eventId}`));
  }

  create(body: CreateTicketRequest): Observable<TicketResponse> {
    return unwrap(this.http.post<ApiResponse<TicketResponse>>(`${BASE}/tickets`, body));
  }

  update(id: number, body: UpdateTicketRequest): Observable<TicketResponse> {
    return unwrap(this.http.put<ApiResponse<TicketResponse>>(`${BASE}/tickets/${id}`, body));
  }

  delete(id: number): Observable<object> {
    return unwrap(this.http.delete<ApiResponse<object>>(`${BASE}/tickets/${id}`));
  }
}

// ─── Payments ──────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class PaymentApiService {
  private http = inject(HttpClient);

  getAll(page = 1, pageSize = 20, status?: string): Observable<PagedResponse<PaymentResponse>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (status) params = params.set('status', status);
    return unwrap(this.http.get<ApiResponse<PagedResponse<PaymentResponse>>>(`${BASE}/payments`, { params }));
  }

  getById(id: number): Observable<PaymentResponse> {
    return unwrap(this.http.get<ApiResponse<PaymentResponse>>(`${BASE}/payments/${id}`));
  }

  getByTicket(ticketId: number): Observable<PaymentResponse[]> {
    return unwrap(this.http.get<ApiResponse<PaymentResponse[]>>(`${BASE}/payments/by-ticket/${ticketId}`));
  }

  create(body: CreatePaymentRequest): Observable<PaymentResponse> {
    return unwrap(this.http.post<ApiResponse<PaymentResponse>>(`${BASE}/payments`, body));
  }

  update(id: number, body: UpdatePaymentRequest): Observable<PaymentResponse> {
    return unwrap(this.http.put<ApiResponse<PaymentResponse>>(`${BASE}/payments/${id}`, body));
  }

  delete(id: number): Observable<object> {
    return unwrap(this.http.delete<ApiResponse<object>>(`${BASE}/payments/${id}`));
  }
}

// ─── Reminders ─────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ReminderApiService {
  private http = inject(HttpClient);

  getMine(page = 1, pageSize = 20): Observable<PagedResponse<ReminderResponse>> {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);
    return unwrap(this.http.get<ApiResponse<PagedResponse<ReminderResponse>>>(`${BASE}/reminders`, { params }));
  }

  getById(id: number): Observable<ReminderResponse> {
    return unwrap(this.http.get<ApiResponse<ReminderResponse>>(`${BASE}/reminders/${id}`));
  }

  getByEvent(eventId: number): Observable<ReminderResponse[]> {
    return unwrap(this.http.get<ApiResponse<ReminderResponse[]>>(`${BASE}/reminders/by-event/${eventId}`));
  }

  create(body: CreateReminderRequest): Observable<ReminderResponse> {
    return unwrap(this.http.post<ApiResponse<ReminderResponse>>(`${BASE}/reminders`, body));
  }

  update(id: number, body: UpdateReminderRequest): Observable<ReminderResponse> {
    return unwrap(this.http.put<ApiResponse<ReminderResponse>>(`${BASE}/reminders/${id}`, body));
  }

  delete(id: number): Observable<object> {
    return unwrap(this.http.delete<ApiResponse<object>>(`${BASE}/reminders/${id}`));
  }
}

// ─── Audit Logs ────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AuditLogApiService {
  private http = inject(HttpClient);

  getAll(page = 1, pageSize = 20, action?: string, entityType?: string, from?: string, to?: string): Observable<PagedResponse<AuditLogResponse>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (action)     params = params.set('action', action);
    if (entityType) params = params.set('entityType', entityType);
    if (from)       params = params.set('from', from);
    if (to)         params = params.set('to', to);
    return unwrap(this.http.get<ApiResponse<PagedResponse<AuditLogResponse>>>(`${BASE}/auditlogs`, { params }));
  }
}

// ─── Notifications ─────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class NotificationApiService {
  private http = inject(HttpClient);

  getMine(): Observable<NotificationResponse[]> {
    return unwrap(this.http.get<ApiResponse<NotificationResponse[]>>(`${BASE}/notifications`));
  }

  getUnreadCount(): Observable<number> {
    return unwrap(this.http.get<ApiResponse<number>>(`${BASE}/notifications/unread-count`));
  }

  markAllRead(): Observable<object> {
    return unwrap(this.http.post<ApiResponse<object>>(`${BASE}/notifications/mark-all-read`, {}));
  }
}
