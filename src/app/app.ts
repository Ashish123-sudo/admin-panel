import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatDialogModule } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmLogoutDialog } from './shared/confirm-logout.dialog';
import { AuthService } from './auth.service';
import { CustomerService } from './customer/services/customer.service';
import { QuoteService } from './quote/services/quote.service';
import { Customer } from './customer/models/customer.model';
import { QuoteHeader } from './quote/models/quote.model';
import { RecentActivityService, RecentItem } from './shared/recent-activity.service';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrls: ['../styles.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatDialogModule
  ]
})
export class App {

  userMenuOpen = true;
  quoteMenuOpen = false;
  isLoginPage = false;
  sidebarOpen = true;
  isMobile = window.innerWidth <= 768;
  isCustomersActive = false;
  isQuotesActive = false;
  searchTerm = '';
  searchScope: 'all' | 'customers' | 'quotes' = 'all';
  showDropdown = false;
  scopeDropdownOpen = false;
  filteredCustomers: Customer[] = [];
  filteredQuotes: QuoteHeader[] = [];

  // Settings mode
  settingsMode = false;
  isTermsActive = false;

  // Recent activity
  showRecentDropdown = false;
  recentItems: RecentItem[] = [];

  // Profile panel
  showProfilePanel = false;
  userName = '';
  userEmail = '';
  userId = '';
  userInitials = '';

  private allCustomers: Customer[] = [];
  private allQuotes: QuoteHeader[] = [];

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private auth: AuthService,
    private customerService: CustomerService,
    private quoteService: QuoteService,
    private recentService: RecentActivityService
  ) {
    this.updateRouteState(this.router.url);

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateRouteState(event.urlAfterRedirects);
        this.clearSearch();
        this.showRecentDropdown = false;
        this.trackNavigation(event.urlAfterRedirects);
      });

    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 768;
      if (!this.isMobile) this.sidebarOpen = true;
    });

    document.addEventListener('click', (e) => {
      const bar = document.querySelector('.search-bar');
      if (bar && !bar.contains(e.target as Node)) {
        this.showDropdown = false;
        this.scopeDropdownOpen = false;
      }

      const recentBtn = document.querySelector('.recent-wrapper');
      if (recentBtn && !recentBtn.contains(e.target as Node)) {
        this.showRecentDropdown = false;
      }

      const profilePanel = document.querySelector('.profile-panel');
      const profileBtn = document.querySelector('.profile-btn');
      if (
        profilePanel && !profilePanel.contains(e.target as Node) &&
        profileBtn && !profileBtn.contains(e.target as Node)
      ) {
        this.showProfilePanel = false;
      }
    });

    this.recentService.items$.subscribe(items => {
      this.recentItems = items;
    });

    this.loadUserProfile();
  }

  private loadUserProfile(): void {
    this.userName = this.auth.getUserName();
    this.userEmail = this.auth.getUserEmail();
    this.userId = this.auth.getUserId();
    this.userInitials = this.auth.getUserInitials();
  }

  // ── Settings toggle ─────────────────────────────────────────────────────────

  toggleSettings(): void {
    this.settingsMode = !this.settingsMode;
    if (this.settingsMode) {
      this.router.navigate(['/settings/terms']);
    } else {
      this.router.navigate(['/quotes']);
    }
  }
  settingsMenuOpen = false;

  toggleSettingsMenu(): void {
    this.settingsMenuOpen = !this.settingsMenuOpen;
  }
  // ── Scope dropdown ──────────────────────────────────────────────────────────

  toggleScopeDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.scopeDropdownOpen = !this.scopeDropdownOpen;
    if (this.scopeDropdownOpen) {
      this.showDropdown = false;
      this.showRecentDropdown = false;
      this.showProfilePanel = false;
    }
  }

  setSearchScope(scope: 'all' | 'customers' | 'quotes'): void {
    this.searchScope = scope;
    this.scopeDropdownOpen = false;
    if (this.searchTerm) this.runFilter(this.searchTerm.toLowerCase().trim());
  }

  // ── Profile panel ───────────────────────────────────────────────────────────

  toggleProfilePanel(event: Event): void {
    event.stopPropagation();
    this.showProfilePanel = !this.showProfilePanel;
    if (this.showProfilePanel) {
      this.loadUserProfile();
      this.showRecentDropdown = false;
      this.showDropdown = false;
      this.scopeDropdownOpen = false;
    }
  }

  closeProfilePanel(): void {
    this.showProfilePanel = false;
  }

  // ── Recent activity ─────────────────────────────────────────────────────────

  private trackNavigation(url: string): void {
    if (url === '/customers') {
      this.recentService.push({ type: 'customer', label: 'Customer List', subLabel: 'All active customers', route: ['/customers'], icon: 'people' });
    }
    if (url === '/quotes') {
      this.recentService.push({ type: 'quote', label: 'Quote List', subLabel: 'All quotes', route: ['/quotes'], icon: 'description' });
    }
    if (url === '/customers/add') {
      this.recentService.push({ type: 'customer', label: 'New Customer', subLabel: 'Create customer', route: ['/customers/add'], icon: 'person_add' });
    }
    if (url === '/quotes/add') {
      this.recentService.push({ type: 'quote', label: 'New Quote', subLabel: 'Create quote', route: ['/quotes/add'], icon: 'note_add' });
    }
    const editMatch = url.match(/^\/quotes\/edit\/(\d+)$/);
    if (editMatch) {
      const id = editMatch[1];
      this.recentService.push({ type: 'quote', label: `Edit Quote`, subLabel: `Quote ID: ${id}`, route: ['/quotes/edit', id], icon: 'edit_note' });
    }
  }

  goToCustomer(customer: Customer): void {
    this.clearSearch();
    this.recentService.push({ type: 'customer', label: customer.name, subLabel: customer.emailId, route: ['/customers'], icon: 'person' });
    this.router.navigate(['/customers']);
  }

  goToQuote(quote: QuoteHeader): void {
    this.clearSearch();
    this.recentService.push({ type: 'quote', label: quote.quoteRef ?? 'Quote', subLabel: `Customer ID: ${quote.customerId}`, route: ['/quotes'], icon: 'description' });
    this.router.navigate(['/quotes']);
  }

  goToRecent(item: RecentItem): void {
    this.showRecentDropdown = false;
    this.router.navigate(item.route);
  }

  toggleRecentDropdown(event: Event): void {
    event.stopPropagation();
    this.showRecentDropdown = !this.showRecentDropdown;
    if (this.showRecentDropdown) {
      this.showDropdown = false;
      this.showProfilePanel = false;
      this.scopeDropdownOpen = false;
    }
  }

  clearRecent(event: Event): void {
    event.stopPropagation();
    this.recentService.clear();
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  // ── Search ──────────────────────────────────────────────────────────────────

  private loadSearchData(): void {
    this.customerService.getCustomers().subscribe({
      next: data => { this.allCustomers = data || []; },
      error: err => console.error('Failed to load customers:', err)
    });
    this.quoteService.getAllQuotes().subscribe({
      next: data => { this.allQuotes = data || []; },
      error: err => console.error('Failed to load quotes:', err)
    });
  }

  private updateRouteState(url: string) {
    this.isLoginPage = url.startsWith('/login');
    this.isCustomersActive = url.startsWith('/customers');
    this.isQuotesActive = url.startsWith('/quotes');
    this.isTermsActive = url.startsWith('/settings/terms');
    this.settingsMode = url.startsWith('/settings');
    this.userMenuOpen = this.isCustomersActive || this.isQuotesActive;

    if (!this.isLoginPage && this.allCustomers.length === 0) {
      this.loadSearchData();
    }
  }

  onSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.searchTerm = (event.target as HTMLInputElement).value;
    if (!term) { this.filteredCustomers = []; this.filteredQuotes = []; return; }
    this.runFilter(term);
    this.showDropdown = true;
    this.showRecentDropdown = false;
    this.scopeDropdownOpen = false;
  }

  private runFilter(term: string): void {
    this.filteredCustomers = this.searchScope === 'quotes' ? [] :
      this.allCustomers.filter(c =>
        c.name?.toLowerCase().includes(term) ||
        c.emailId?.toLowerCase().includes(term) ||
        c.city?.toLowerCase().includes(term) ||
        c.contactNumber?.toLowerCase().includes(term)
      ).slice(0, 5);

    this.filteredQuotes = this.searchScope === 'customers' ? [] :
      this.allQuotes.filter(q =>
        q.quoteRef?.toLowerCase().includes(term) ||
        String(q.customerId).includes(term)
      ).slice(0, 5);
  }

  onSearchFocus(): void {
    if (this.searchTerm.length > 0) this.showDropdown = true;
    this.scopeDropdownOpen = false;
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredCustomers = [];
    this.filteredQuotes = [];
    this.showDropdown = false;
  }

  // ── Sidebar / nav ───────────────────────────────────────────────────────────

  toggleUserMenu() { this.userMenuOpen = !this.userMenuOpen; }
  toggleQuoteMenu() { this.quoteMenuOpen = !this.quoteMenuOpen; }
  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }
  closeSidebar() { this.sidebarOpen = false; }

  logout() {
    this.showProfilePanel = false;
    const dialogRef = this.dialog.open(ConfirmLogoutDialog);
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.auth.logout();
    });
  }
}