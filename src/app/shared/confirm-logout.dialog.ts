import { Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'confirm-logout-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
<div class="modern-dialog">

  <div class="dialog-header">
    <mat-icon class="dialog-icon">logout</mat-icon>
    <h2>Confirm Logout</h2>
  </div>

  <div class="dialog-body">
    Are you sure you want to logout?
  </div>

  <div class="dialog-actions">
    <button mat-button mat-dialog-close class="dialog-cancel-btn">
      Cancel
    </button>

    <button mat-raised-button [mat-dialog-close]="true" class="dialog-logout-btn">
      Logout
    </button>
  </div>

</div>
`
})
export class ConfirmLogoutDialog {
    
}
