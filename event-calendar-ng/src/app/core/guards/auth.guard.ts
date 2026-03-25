import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../services/auth.store';
import { ToastService } from '../../shared/components/toast/toast.service';

export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthStore);
  const router = inject(Router);
  const toast  = inject(ToastService);
  if (auth.isLoggedIn()) return true;
  toast.warning('Please sign in to access this page.');
  router.navigate(['/auth/login']);
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AuthStore);
  const router = inject(Router);
  const toast  = inject(ToastService);
  if (auth.isAdmin()) return true;
  toast.error('Admin access required.');
  // Redirect logged-in non-admins to dashboard, guests to login
  router.navigate([auth.isLoggedIn() ? '/dashboard' : '/auth/login']);
  return false;
};

export const userGuard: CanActivateFn = () => {
  const auth   = inject(AuthStore);
  const router = inject(Router);
  const toast  = inject(ToastService);
  if (!auth.isAdmin()) return true;
  toast.warning('This section is for users only.');
  router.navigate(['/admin']);
  return false;
};

export const guestGuard: CanActivateFn = () => {
  const auth   = inject(AuthStore);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return true;
  // Already logged in — send to appropriate home
  router.navigate([auth.isAdmin() ? '/admin' : '/dashboard']);
  return false;
};
