import { Routes } from '@angular/router';
import { authGuard, adminGuard, guestGuard, userGuard } from './core/guards/auth.guard';

import { LoginComponent }       from './features/auth/login/login.component';
import { RegisterComponent }    from './features/auth/register/register.component';
import { VenuesComponent }      from './features/venues/venues.component';
import { EventListComponent }   from './features/events/event-list/event-list.component';
import { EventFormComponent }   from './features/events/event-form/event-form.component';
import { EventDetailComponent } from './features/events/event-detail/event-detail.component';
import { DashboardComponent }   from './features/dashboard/dashboard.component';
import { AdminComponent }       from './features/admin/admin.component';
import { TicketsComponent }     from './features/tickets/tickets.component';
import { RemindersComponent }   from './features/reminders/reminders.component';
import { CategoriesComponent }  from './features/categories/categories.component';
import { ProfileComponent }     from './features/users/profile.component';
import { NotFoundComponent }    from './features/not-found/not-found.component';

export const routes: Routes = [
  { path: '', redirectTo: 'venues', pathMatch: 'full' },

  // Auth (guest only)
  { path: 'auth/login',    component: LoginComponent,    canActivate: [guestGuard] },
  { path: 'auth/register', component: RegisterComponent, canActivate: [guestGuard] },

  // Public
  { path: 'venues', component: VenuesComponent },
  { path: 'events', component: EventListComponent },

  // events/new MUST be before events/:id
  { path: 'events/new',      component: EventFormComponent,   canActivate: [authGuard, adminGuard] },
  { path: 'events/:id',      component: EventDetailComponent },
  { path: 'events/:id/edit', component: EventFormComponent,   canActivate: [authGuard, adminGuard] },

  // Requires login
  { path: 'dashboard',  component: DashboardComponent,  canActivate: [authGuard] },
  { path: 'admin',      component: AdminComponent,       canActivate: [authGuard, adminGuard] },
  { path: 'tickets',    component: TicketsComponent,     canActivate: [authGuard] },
  { path: 'reminders',  component: RemindersComponent,   canActivate: [authGuard, userGuard] },
  { path: 'categories', component: CategoriesComponent },
  { path: 'profile',    component: ProfileComponent,     canActivate: [authGuard] },

  { path: '**', component: NotFoundComponent }
];
