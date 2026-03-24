import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserApiService } from '../../core/services/api.service';
import { AuthStore } from '../../core/services/auth.store';
import { ToastService } from '../../shared/components/toast/toast.service';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { UserResponse } from '../../core/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Profile</h1>
        <p class="page-sub">Manage your account settings</p>
      </div>

      @if (loading()) {
        <app-loading text="Loading profile…" />
      } @else if (user()) {
        <div class="profile-grid">
          <!-- Profile Info -->
          <div class="profile-card">
            <div class="profile-avatar">{{ initials() }}</div>
            <div class="profile-info">
              <h2 class="profile-name">{{ user()!.firstName }} {{ user()!.lastName }}</h2>
              <p class="profile-role">{{ user()!.role }}</p>
              @if (user()!.email) { <p class="profile-email">{{ user()!.email }}</p> }
              @if (user()!.phoneNumber) { <p class="profile-phone">📞 {{ user()!.phoneNumber }}</p> }
              <p class="profile-joined">Member since {{ user()!.createdAt | date:'MMMM y' }}</p>
            </div>
          </div>

          <!-- Edit Profile -->
          <div class="form-card">
            <h3 class="form-card__title">Edit Profile</h3>
            <div class="form-grid">
              <div class="form-field">
                <label class="form-label">First Name</label>
                <input class="form-input" [(ngModel)]="f.firstName">
              </div>
              <div class="form-field">
                <label class="form-label">Last Name</label>
                <input class="form-input" [(ngModel)]="f.lastName">
              </div>
              <div class="form-field form-field--full">
                <label class="form-label">Phone Number</label>
                <input class="form-input" [(ngModel)]="f.phoneNumber" placeholder="+91…">
              </div>
            </div>
            <div class="notification-prefs">
              <label class="toggle-row">
                <span class="toggle-label-text">📧 Email Notifications</span>
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="f.emailNotifications">
                  <span class="toggle-track"><span class="toggle-thumb"></span></span>
                </label>
              </label>
              <label class="toggle-row">
                <span class="toggle-label-text">🔔 Push Notifications</span>
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="f.pushNotifications">
                  <span class="toggle-track"><span class="toggle-thumb"></span></span>
                </label>
              </label>
            </div>
            <button class="btn" [disabled]="savingProfile()" (click)="saveProfile()">
              @if (savingProfile()) { <span class="btn-spinner"></span> }
              Save Changes
            </button>
          </div>

          <!-- Change Password -->
          <div class="form-card">
            <h3 class="form-card__title">Change Password</h3>
            <div class="form-field">
              <label class="form-label">Current Password</label>
              <input class="form-input" type="password" [(ngModel)]="pw.current">
            </div>
            <div class="form-field">
              <label class="form-label">New Password</label>
              <input class="form-input" type="password" [(ngModel)]="pw.newPw" placeholder="Min 6 characters">
            </div>
            <div class="form-field">
              <label class="form-label">Confirm New Password</label>
              <input class="form-input" type="password" [(ngModel)]="pw.confirm">
            </div>
            <button class="btn btn--ghost" [disabled]="savingPw()" (click)="changePassword()">
              @if (savingPw()) { <span class="btn-spinner"></span> }
              🔑 Update Password
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .profile-grid { display: grid; grid-template-columns: 300px 1fr; gap: 1.5rem; align-items: start; }
    @media(max-width:768px) { .profile-grid { grid-template-columns: 1fr; } }
    .profile-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 2rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; text-align: center; grid-row: span 2; }
    .profile-avatar { width: 80px; height: 80px; border-radius: 50%; background: var(--accent); color: #000; font-weight: 900; font-size: 1.75rem; display: flex; align-items: center; justify-content: center; }
    .profile-name { font-size: 1.25rem; font-weight: 800; color: var(--text); }
    .profile-role { font-size: .8125rem; color: var(--accent); font-weight: 600; background: rgba(var(--accent-rgb),.12); padding: .25rem .75rem; border-radius: 20px; }
    .profile-email, .profile-phone { font-size: .875rem; color: var(--muted); }
    .profile-joined { font-size: .75rem; color: var(--muted); margin-top: .5rem; }
    .form-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 1.75rem; display: flex; flex-direction: column; gap: 1rem; }
    .form-card__title { font-size: 1rem; font-weight: 700; color: var(--text); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .875rem; }
    .form-field--full { grid-column: 1/-1; }
    @media(max-width:500px) { .form-grid { grid-template-columns: 1fr; } .form-field--full { grid-column: auto; } }
    .notification-prefs { display: flex; flex-direction: column; gap: .625rem; padding: .875rem; background: var(--surface2); border-radius: 12px; }
    .toggle-row { display: flex; align-items: center; justify-content: space-between; cursor: pointer; }
    .toggle-label-text { font-size: .875rem; color: var(--text); }
    .toggle input { display: none; }
    .toggle-track { position: relative; width: 44px; height: 24px; background: var(--border); border-radius: 12px; transition: background .2s; display: block; }
    .toggle-thumb { position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; background: white; border-radius: 50%; transition: transform .2s; display: block; }
    input:checked + .toggle-track { background: var(--accent); }
    input:checked + .toggle-track .toggle-thumb { transform: translateX(20px); }
  `]
})
export class ProfileComponent implements OnInit {
  auth = inject(AuthStore);
  private userApi = inject(UserApiService);
  private toast = inject(ToastService);

  loading = signal(true);
  savingProfile = signal(false);
  savingPw = signal(false);
  user = signal<UserResponse | null>(null);

  f = { firstName: '', lastName: '', phoneNumber: '', emailNotifications: true, pushNotifications: true };
  pw = { current: '', newPw: '', confirm: '' };

  ngOnInit() {
    const id = this.auth.currentUserId();
    if (!id) return;
    this.userApi.getById(id).subscribe({
      next: u => {
        this.user.set(u);
        this.f = { firstName: u.firstName, lastName: u.lastName, phoneNumber: u.phoneNumber || '', emailNotifications: u.emailNotifications, pushNotifications: u.pushNotifications };
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  initials() {
    const u = this.user();
    return u ? (u.firstName[0] + (u.lastName[0] || '')).toUpperCase() : '?';
  }

  saveProfile() {
    this.savingProfile.set(true);
    const id = this.auth.currentUserId()!;
    this.userApi.update(id, {
      firstName: this.f.firstName,
      lastName: this.f.lastName,
      phoneNumber: this.f.phoneNumber || undefined,
      emailNotifications: this.f.emailNotifications,
      pushNotifications: this.f.pushNotifications
    }).subscribe({
      next: u => {
        this.user.set(u);
        this.toast.success('Profile updated successfully!');
        this.savingProfile.set(false);
      },
      error: () => {
        this.toast.error('Failed to update profile.');
        this.savingProfile.set(false);
      }
    });
  }

  changePassword() {
    if (!this.pw.current || !this.pw.newPw) { this.toast.warning('Fill in all password fields.'); return; }
    if (this.pw.newPw !== this.pw.confirm) { this.toast.error('Passwords do not match.'); return; }
    if (this.pw.newPw.length < 6) { this.toast.error('Password must be at least 6 characters.'); return; }
    this.savingPw.set(true);
    const id = this.auth.currentUserId()!;
    this.userApi.changePassword(id, { currentPassword: this.pw.current, newPassword: this.pw.newPw }).subscribe({
      next: () => {
        this.toast.success('Password changed successfully!');
        this.pw = { current: '', newPw: '', confirm: '' };
        this.savingPw.set(false);
      },
      error: () => {
        this.toast.error('Failed to change password. Check your current password.');
        this.savingPw.set(false);
      }
    });
  }
}
