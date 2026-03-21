import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AppRoleService } from '../services/app-role.service';
import { AppRole } from '../models/app-role.model';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSnackBarModule],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss']
})
export class RolesComponent implements OnInit {

  roles: AppRole[] = [];
  isLoading = true;

  showAddForm = false;
  newRoleName = '';
  newRoleDesc = '';

  editingRoleId: string | null = null;    // string
  editingRoleName = '';
  editingRoleDesc = '';

  constructor(
    private appRoleService: AppRoleService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.loadRoles(); }

  loadRoles(): void {
    this.isLoading = true;
    this.appRoleService.getAll().subscribe({
      next: (data) => { this.roles = data; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.isLoading = false; }
    });
  }

  addRole(): void {
    const name = this.newRoleName.trim();
    if (!name) return;
    this.appRoleService.create({ roleName: name, description: this.newRoleDesc.trim() }).subscribe({
      next: (r) => {
        this.roles.push(r);
        this.newRoleName = ''; this.newRoleDesc = ''; this.showAddForm = false;
        this.snackBar.open('Role added', 'Close', { duration: 2000 });
        this.cdr.detectChanges();
      },
      error: (err) => this.snackBar.open(err?.error?.error || 'Failed to add role', 'Close', { duration: 3000 })
    });
  }

  startEdit(role: AppRole): void {
    this.editingRoleId = role.roleId!;    // string
    this.editingRoleName = role.roleName;
    this.editingRoleDesc = role.description || '';
  }

  saveEdit(role: AppRole): void {
    if (!this.editingRoleName.trim()) return;
    this.appRoleService.update(role.roleId!, {
      roleName: this.editingRoleName.trim(),
      description: this.editingRoleDesc.trim()
    }).subscribe({
      next: (updated) => {
        const idx = this.roles.findIndex(r => r.roleId === role.roleId);
        if (idx !== -1) this.roles[idx] = updated;
        this.editingRoleId = null;
        this.snackBar.open('Role updated', 'Close', { duration: 2000 });
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open('Failed to update role', 'Close', { duration: 3000 })
    });
  }

  cancelEdit(): void { this.editingRoleId = null; }

  deleteRole(role: AppRole): void {
    if (!confirm(`Delete role "${role.roleName}"?`)) return;
    this.appRoleService.delete(role.roleId!).subscribe({
      next: () => {
        this.roles = this.roles.filter(r => r.roleId !== role.roleId);
        this.snackBar.open('Role deleted', 'Close', { duration: 2000 });
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open('Failed to delete role', 'Close', { duration: 3000 })
    });
  }
}