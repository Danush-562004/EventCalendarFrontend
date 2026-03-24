import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthApiService } from '../../../core/services/api.service';
import { AuthStore } from '../../../core/services/auth.store';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card auth-card--wide">
        <div class="auth-header">
          <div class="auth-logo">◆</div>
          <h1 class="auth-title">Create account</h1>
          <p class="auth-sub">Join EventCal today</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form">
          <div class="form-row">
            <div class="form-field">
              <label class="form-label">First Name</label>
              <input class="form-input" formControlName="firstName" placeholder="John">
              @if (f['firstName'].invalid && f['firstName'].touched) {
                <span class="form-error">Required</span>
              }
            </div>
            <div class="form-field">
              <label class="form-label">Last Name</label>
              <input class="form-input" formControlName="lastName" placeholder="Doe">
              @if (f['lastName'].invalid && f['lastName'].touched) {
                <span class="form-error">Required</span>
              }
            </div>
          </div>

          <div class="form-field">
            <label class="form-label">Username</label>
            <input class="form-input" formControlName="username" placeholder="johndoe" autocomplete="username">
            @if (f['username'].invalid && f['username'].touched) {
              <span class="form-error">Required, min 3 characters</span>
            }
          </div>

          <div class="form-field">
            <label class="form-label">Email</label>
            <input class="form-input" formControlName="email" type="email"
                   placeholder="john@example.com" autocomplete="email">
            @if (f['email'].invalid && f['email'].touched) {
              <span class="form-error">Valid email required</span>
            }
          </div>

          <div class="form-field">
            <label class="form-label">Phone <span class="optional">(optional)</span></label>
            <input class="form-input" formControlName="phoneNumber" placeholder="+91 555 000 0000">
          </div>

          <div class="form-field">
            <label class="form-label">Password</label>
            <div class="input-row">
              <input class="form-input" formControlName="password"
                     [type]="showPw() ? 'text' : 'password'"
                     placeholder="Min 6 characters" autocomplete="new-password">
              <button type="button" class="pw-toggle" (click)="showPw.set(!showPw())">
                {{ showPw() ? '🙈' : '👁' }}
              </button>
            </div>
            @if (f['password'].invalid && f['password'].touched) {
              <span class="form-error">Min 6 characters</span>
            }
          </div>

          <button type="submit" class="btn btn--full" [disabled]="loading()">
            @if (loading()) { <span class="btn-spinner"></span> }
            Create Account
          </button>
        </form>

        <p class="auth-switch">Already have an account? <a routerLink="/auth/login">Sign in</a></p>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private fb        = inject(FormBuilder);
  private api       = inject(AuthApiService);
  private authStore = inject(AuthStore);
  private router    = inject(Router);
  private toast     = inject(ToastService);

  loading = signal(false);
  showPw  = signal(false);

  form = this.fb.group({
    firstName:   ['', Validators.required],
    lastName:    ['', Validators.required],
    username:    ['', [Validators.required, Validators.minLength(3)]],
    email:       ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    password:    ['', [Validators.required, Validators.minLength(6)]]
  });

  get f() { return this.form.controls; }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const v = this.form.value;
    this.api.register({
      firstName:   v.firstName!,
      lastName:    v.lastName!,
      username:    v.username!,
      email:       v.email!,
      password:    v.password!,
      phoneNumber: v.phoneNumber || undefined
    }).subscribe({
      next: auth => {
        this.authStore.setAuth(auth);
        this.toast.success('Account created successfully!');
        this.router.navigate(['/dashboard']);
      },
      error:    () => this.loading.set(false),
      complete: () => this.loading.set(false)
    });
  }
}
