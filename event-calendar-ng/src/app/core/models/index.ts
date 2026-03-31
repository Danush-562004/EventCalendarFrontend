// ─── Auth ─────────────────────────────────────────────────────
export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

// Matches backend AuthResponseDto exactly:
// { token: string, expiry: DateTime, user: UserResponseDto }
export interface AuthResponse {
  token: string;
  expiry: string;
  user: UserResponse;
}

// ─── User ──────────────────────────────────────────────────────
export interface UserResponse {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber?: string;
  profilePicture?: string;
  role: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  createdAt: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profilePicture?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ─── Category ─────────────────────────────────────────────────
export interface CategoryResponse {
  id: number;
  name: string;
  description?: string;
  colorCode: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  colorCode: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  colorCode?: string;
}

// ─── Venue ────────────────────────────────────────────────────
export interface VenueResponse {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode?: string;
  capacity: number;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateVenueRequest {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode?: string;
  capacity: number;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface UpdateVenueRequest {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  capacity?: number;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
}

// ─── Event ────────────────────────────────────────────────────
export interface EventResponse {
  id: number;
  title: string;
  description?: string;
  price: number;
  availableSeats: number;
  startDateTime: string;
  endDateTime: string;
  location?: string;
  reminderEnabled: boolean;
  reminderMinutesBefore?: number;
  maxAttendees: number;
  ticketCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  userId: number;
  organizerName: string;
  category: CategoryResponse;
  venue?: VenueResponse;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  price: number;
  startDateTime: string;
  endDateTime: string;
  location?: string;
  reminderEnabled: boolean;
  reminderMinutesBefore?: number;
  maxAttendees: number;
  categoryId: number;
  venueId?: number;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  startDateTime?: string;
  endDateTime?: string;
  location?: string;
  reminderEnabled?: boolean;
  reminderMinutesBefore?: number;
  maxAttendees?: number;
  categoryId?: number;
  venueId?: number;
}

export interface EventFilterRequest {
  keyword?: string;
  categoryId?: number;
  venueId?: number;
  startDate?: string;
  endDate?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
}

// ─── Ticket ───────────────────────────────────────────────────
export interface TicketResponse {
  id: number;
  ticketNumber: string;
  type: string;
  status: string;
  price: number;
  quantity: number;
  seatNumber?: string;
  checkedIn: boolean;
  checkInTime?: string;
  createdAt: string;
  paymentDeadline: string;
  eventId: number;
  eventTitle: string;
  eventEndDateTime: string;
  userId: number;
  userFullName: string;
  userEmail: string;
  payments: PaymentResponse[];
}

export interface CreateTicketRequest {
  eventId: number;
  type: TicketType;
  quantity: number;
  seatNumber?: string;
}

export interface UpdateTicketRequest {
  status?: TicketStatus;
  checkedIn?: boolean;
  seatNumber?: string;
}

export type TicketType   = 'Free' | 'Paid' | 'VIP';
export type TicketStatus = 'Reserved' | 'Confirmed' | 'Cancelled' | 'Attended';

// ─── Payment ──────────────────────────────────────────────────
export interface PaymentResponse {
  id: number;
  amount: number;
  currency: string;
  status: string;
  method: string;
  transactionId?: string;
  notes?: string;
  paymentDate: string;
  createdAt: string;
  ticketId: number;
}

export interface CreatePaymentRequest {
  ticketId: number;
  amount: number;
  currency: string;
  method: PaymentMethod;
  transactionId?: string;
  notes?: string;
}

export interface UpdatePaymentRequest {
  status?: PaymentStatus;
  transactionId?: string;
  paymentGatewayReference?: string;
  notes?: string;
}

export type PaymentMethod = 'CreditCard' | 'DebitCard' | 'PayPal' | 'BankTransfer' | 'Cash';
export type PaymentStatus = 'Pending' | 'Completed' | 'Failed' | 'Refunded';

// ─── Reminder ─────────────────────────────────────────────────
export interface ReminderResponse {
  id: number;
  title: string;
  message?: string;
  reminderDateTime: string;
  type: string;
  isSent: boolean;
  sentAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  eventId: number;
  eventTitle: string;
  userId: number;
}

export interface CreateReminderRequest {
  title: string;
  message?: string;
  reminderDateTime: string;
  type: ReminderType;
  eventId: number;
}

export interface UpdateReminderRequest {
  title?: string;
  message?: string;
  reminderDateTime?: string;
  type?: ReminderType;
}

export type ReminderType = 'Email' | 'Push' | 'Both';

// ─── Shared ───────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// ─── AuditLog ─────────────────────────────────────────────────
export interface AuditLogResponse {
  id: number;
  userId?: number;
  userName: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: string;
  newValues?: string;
  ipAddress?: string;
  timestamp: string;
}
