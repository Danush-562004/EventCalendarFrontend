import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from '../services/auth.store';
import { Router } from '@angular/router';
import { ToastService } from '../../shared/components/toast/toast.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const router    = inject(Router);
  const toast     = inject(ToastService);

  const token = authStore.token();
  const cloned = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(cloned).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        authStore.clearAuth();
        router.navigate(['/auth/login']);
        toast.error('Session expired. Please log in again.');
      } else if (err.status === 403) {
        toast.error('You do not have permission to perform this action.');
      } else if (err.status === 404) {
        toast.error('Resource not found.');
      } else if (err.status >= 500) {
        toast.error('Server error. Please try again later.');
      } else {
        const msg = (err.error as { message?: string })?.message;
        if (msg) toast.error(msg);
      }
      return throwError(() => err);
    })
  );
};
