import { Routes } from '@angular/router';
import { authGuard, adminGuard, guestGuard, userGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Default landing — venues page (public)
  { path: '', redirectTo: 'venues', pathMatch: 'full' },

  // Auth (guest only)
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
        canActivate: [guestGuard]
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
        canActivate: [guestGuard]
      }
    ]
  },

  // Public — no login required
  {
    path: 'venues',
    loadComponent: () => import('./features/venues/venues.component').then(m => m.VenuesComponent)
  },
  {
    path: 'events',
    loadComponent: () => import('./features/events/event-list/event-list.component').then(m => m.EventListComponent)
  },
  {
    path: 'events/:id',
    loadComponent: () => import('./features/events/event-detail/event-detail.component').then(m => m.EventDetailComponent)
  },

  // Dashboard — requires login
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },

  // Admin only
  {
    path: 'events/new',
    loadComponent: () => import('./features/events/event-form/event-form.component').then(m => m.EventFormComponent),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'events/:id/edit',
    loadComponent: () => import('./features/events/event-form/event-form.component').then(m => m.EventFormComponent),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent),
    canActivate: [authGuard, adminGuard]
  },

  // User only
  {
    path: 'tickets',
    loadComponent: () => import('./features/tickets/tickets.component').then(m => m.TicketsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'reminders',
    loadComponent: () => import('./features/reminders/reminders.component').then(m => m.RemindersComponent),
    canActivate: [authGuard, userGuard]
  },

  // Auth required
  {
    path: 'categories',
    loadComponent: () => import('./features/categories/categories.component').then(m => m.CategoriesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/users/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },

  { path: '**', loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent) }
];
