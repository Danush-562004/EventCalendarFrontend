# EventCal – Angular 19 Frontend

A full-featured Event Calendar application frontend built with Angular 19 (standalone components, signals, lazy-loaded routes, HTTP interceptors, and auth guards), wired to the EventCalendarAPI .NET backend.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Angular CLI 19: `npm install -g @angular/cli`
- EventCalendarAPI running at `https://localhost:7001`

### Install & Run
```bash
cd event-calendar-ng
npm install
ng serve
# App runs at http://localhost:4200
```

---

## 🏗 Project Structure

```
src/app/
├── core/
│   ├── guards/          # authGuard, adminGuard, guestGuard
│   ├── interceptors/    # authInterceptor (JWT + error handling)
│   ├── models/          # TypeScript interfaces matching backend DTOs
│   └── services/
│       ├── api.service.ts    # All 8 API service classes
│       └── auth.store.ts     # Signal-based auth state store
│
├── shared/
│   └── components/
│       ├── navbar/          # Sticky navbar with auth state
│       ├── toast/           # Toast notifications (signal-based)
│       ├── loading/         # Loading spinner
│       ├── pagination/      # Reusable pagination (signals)
│       └── confirm-dialog/  # Reusable confirm modal
│
└── features/
    ├── auth/
    │   ├── login/           # Login page (reactive forms)
    │   └── register/        # Register page (reactive forms)
    ├── dashboard/           # Stats + recent events/tickets/reminders
    ├── events/
    │   ├── event-list/      # Searchable, filterable event grid
    │   ├── event-detail/    # Full event view + book ticket + reminder
    │   └── event-form/      # Create / edit event (Admin only create)
    ├── tickets/             # My tickets + payment processing modal
    ├── categories/          # Category CRUD with color picker
    ├── venues/              # Venue CRUD with full address form
    ├── reminders/           # My reminders CRUD
    ├── users/
    │   └── profile/         # Edit profile + change password
    └── admin/               # Admin panel: Users, Payments, Tickets tabs
```

---

## ✨ Angular Features Used

| Feature | Where |
|---|---|
| **Signals** (`signal`, `computed`, `input`, `output`) | Auth store, all components for loading/data state, pagination |
| **Standalone Components** | Every single component — no NgModules |
| **Lazy-Loaded Routes** | `loadComponent()` in `app.routes.ts` for all feature pages |
| **Route Guards** | `authGuard`, `adminGuard`, `guestGuard` (functional guards) |
| **HTTP Interceptor** | `authInterceptor` — injects Bearer token + global error handling |
| **Reactive Forms** | Login, Register, Event Form (with validators) |
| **Template-Driven Forms** | Category, Venue, Reminder, Profile, Ticket booking |
| **`@for` / `@if` / `@empty`** | New Angular 17+ control flow syntax throughout |
| **`input()` / `output()`** | Pagination, ConfirmDialog, Loading components |
| **View Transitions** | `withViewTransitions()` in router config |
| **`provideHttpClient(withInterceptors([...]))`** | Functional interceptor registration |

---

## 🔑 Authentication

- JWT Bearer token stored in `localStorage`
- `AuthStore` is a signal-based service holding `user`, `token`, `isLoggedIn`, `isAdmin`, `currentUserId` computed signals
- `authInterceptor` auto-attaches the token and handles 401 (redirect to login), 403, 404, 500

### Roles
- **User** — browse events, book tickets, manage own tickets/reminders/profile
- **Admin** — everything above + create events, manage categories/venues, full admin panel (users, all payments, all tickets)

---

## 🌐 API Coverage

All backend endpoints are wired:

| Service | Endpoints |
|---|---|
| Auth | POST `/auth/login`, POST `/auth/register` |
| Users | GET all, GET by id, PUT update, DELETE, PUT change-password |
| Events | GET all, GET search, GET by id, GET my-events, POST, PUT, DELETE |
| Categories | GET all, GET by id, POST, PUT, DELETE |
| Venues | GET all, GET by id, POST, PUT, DELETE |
| Tickets | GET all (admin), GET by id, GET my-tickets, GET by-event, POST, PUT, DELETE |
| Payments | GET all (admin), GET by id, GET by-ticket, POST, PUT, DELETE |
| Reminders | GET my, GET by id, GET by-event, POST, PUT, DELETE |

---

## 🎨 Design System

- **Dark theme** by default with CSS variables
- **Fonts**: Syne (headings) + DM Sans (body) + JetBrains Mono (code)
- **Color**: Deep space dark background with violet accent (`#a78bfa`)
- **Components**: Cards, badges, tables, modals, toasts — all CSS-in-component or in `styles.css`

---

## ⚙️ Backend URL Configuration

The API base URL is in `src/app/core/services/api.service.ts`:

```typescript
const BASE = 'https://localhost:7001/api';
```

Change this to your backend's URL if different.

Make sure the backend CORS is set to allow `http://localhost:4200` (it already is in the provided backend config).

---

## 📦 Build for Production

```bash
ng build --configuration production
```

Output goes to `dist/event-calendar-ng/`.
