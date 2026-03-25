import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthApiService } from '../../../core/services/api.service';
import { AuthStore } from '../../../core/services/auth.store';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo">◆</div>
          <h1 class="auth-title">Welcome back</h1>
          <p class="auth-sub">Sign in to EventCal</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form">
          <div class="form-field">
            <label class="form-label">Username or Email</label>
            <input class="form-input" formControlName="usernameOrEmail"
                   placeholder="john or john@example.com" autocomplete="username">
            @if (form.get('usernameOrEmail')?.invalid && form.get('usernameOrEmail')?.touched) {
              <span class="form-error">Required</span>
            }
          </div>

          <div class="form-field">
            <label class="form-label">Password</label>
            <div class="input-row">
              <input class="form-input" formControlName="password"
                     [type]="showPw() ? 'text' : 'password'"
                     placeholder="••••••••" autocomplete="current-password">
              <button type="button" class="pw-toggle" (click)="showPw.set(!showPw())">
                {{ showPw() ? '🙈' : '👁' }}
              </button>
            </div>
            @if (form.get('password')?.invalid && form.get('password')?.touched) {
              <span class="form-error">Required</span>
            }
          </div>

          <button type="submit" class="btn btn--full" [disabled]="loading()">
            @if (loading()) { <span class="btn-spinner"></span> }
            Sign In
          </button>
        </form>

        <p class="auth-switch">Don't have an account? <a routerLink="/auth/register">Register</a></p>
      </div>
    </div>
  `
})
export class LoginComponent {
  private fb        = inject(FormBuilder);
  private api       = inject(AuthApiService);
  private authStore = inject(AuthStore);
  private router    = inject(Router);
  private toast     = inject(ToastService);

  loading = signal(false);
  showPw  = signal(false);

  form = this.fb.group({
    usernameOrEmail: ['', Validators.required],
    password:        ['', Validators.required]
  });

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.api.login({
      usernameOrEmail: this.form.value.usernameOrEmail!,
      password:        this.form.value.password!
    }).subscribe({
      next: auth => {
        this.authStore.setAuth(auth);
        this.toast.success(`Welcome back, ${auth.user.fullName || auth.user.username}!`);
        // Admins go to admin panel, users go to dashboard
        const dest = auth.user.role === 'Admin' ? '/admin' : '/dashboard';
        this.router.navigate([dest]);
      },
      error: (err) => {
        const msg = err?.error?.message || 'Login failed. Please try again.';
        this.toast.error(msg);
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }
}
