import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AppUserService } from '../services/app-user.service';
import { AppRoleService } from '../services/app-role.service';
import { AppRole } from '../models/app-role.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSnackBarModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {

  users: any[] = [];
  roles: AppRole[] = [];
  isLoading = true;

  showAddForm = false;
  newFullName = '';
  newUsername = '';
  newPassword = '';
  newRoleId: number | null = null;
  showNewPassword = false;

  editingUserId: number | null = null;
  editFullName = '';
  editPassword = '';
  editRoleId: number | null = null;
  showEditPassword = false;

  constructor(
    private userService: AppUserService,
    private roleService: AppRoleService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRoles();
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getAll().subscribe({
      next: (data) => { this.users = data; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.isLoading = false; }
    });
  }

  loadRoles(): void {
    this.roleService.getAll().subscribe({
      next: (data) => { this.roles = data; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  getRoleName(user: any): string {
    return user.appRole?.roleName || '—';
  }

  addUser(): void {
    if (!this.newFullName.trim() || !this.newUsername.trim() || !this.newPassword.trim()) return;
    const payload: any = {
      fullName: this.newFullName.trim(),
      username: this.newUsername.trim(),
      password: this.newPassword
    };
    if (this.newRoleId) payload.roleId = this.newRoleId;

    this.userService.create(payload).subscribe({
      next: (u) => {
        this.users.push(u);
        this.newFullName = ''; this.newUsername = '';
        this.newPassword = ''; this.newRoleId = null;
        this.showAddForm = false;
        this.snackBar.open('User added', 'Close', { duration: 2000 });
        this.cdr.detectChanges();
      },
      error: (err) => {
        const msg = err?.error?.error || 'Failed to add user';
        this.snackBar.open(msg, 'Close', { duration: 3000 });
      }
    });
  }

  startEdit(user: any): void {
    this.editingUserId = user.userId;
    this.editFullName = user.fullName;
    this.editPassword = '';
    this.editRoleId = user.appRole?.roleId || null;
    this.showEditPassword = false;
  }

  saveEdit(user: any): void {
    if (!this.editFullName.trim()) return;
    const payload: any = { fullName: this.editFullName.trim() };
    if (this.editPassword.trim()) payload.password = this.editPassword;
    if (this.editRoleId) payload.roleId = this.editRoleId;

    this.userService.update(user.userId, payload).subscribe({
      next: (updated) => {
        const idx = this.users.findIndex(u => u.userId === user.userId);
        if (idx !== -1) this.users[idx] = updated;
        this.editingUserId = null;
        this.snackBar.open('User updated', 'Close', { duration: 2000 });
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open('Failed to update user', 'Close', { duration: 3000 })
    });
  }

  cancelEdit(): void { this.editingUserId = null; }

  deleteUser(user: any): void {
    if (!confirm(`Delete user "${user.fullName}"?`)) return;
    this.userService.delete(user.userId).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.userId !== user.userId);
        this.snackBar.open('User deleted', 'Close', { duration: 2000 });
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open('Failed to delete user', 'Close', { duration: 3000 })
    });
  }
}