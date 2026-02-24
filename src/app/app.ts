import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatDialogModule } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmLogoutDialog } from './shared/confirm-logout.dialog';
import { AuthService } from './auth.service';


@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrls: ['../styles.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatMenuModule,
    MatDialogModule

  ]
})
export class App {

  userMenuOpen = true;
  quoteMenuOpen = false;
  isLoginPage = false;

  constructor(private router: Router,
              private dialog: MatDialog,
              private auth: AuthService) {

    this.updateRouteState(this.router.url);

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateRouteState(event.urlAfterRedirects);
      });
  }

  private updateRouteState(url: string) {
    this.userMenuOpen = url.startsWith('/customers');
    this.quoteMenuOpen = url.startsWith('/quotes');
    this.isLoginPage = url.startsWith('/login');
  }

  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
  }

  toggleQuoteMenu() {
    this.quoteMenuOpen = !this.quoteMenuOpen;
  }

  logout() {
    const dialogRef = this.dialog.open(ConfirmLogoutDialog);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.auth.logout();   // ✅ REAL logout
      }
    });
  }
}
