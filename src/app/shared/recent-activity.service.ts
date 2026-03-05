import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface RecentItem {
  type: 'customer' | 'quote';
  label: string;       // display name or quote ref
  subLabel?: string;   // email or customer name
  route: string[];     // router navigate target
  icon: string;        // material icon name
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class RecentActivityService {
  private readonly MAX_ITEMS = 8;
  private readonly STORAGE_KEY = 'quoteapp_recent';

  private itemsSubject = new BehaviorSubject<RecentItem[]>(this.load());
  items$ = this.itemsSubject.asObservable();

  private load(): RecentItem[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as RecentItem[];
      return parsed.map(i => ({ ...i, timestamp: new Date(i.timestamp) }));
    } catch {
      return [];
    }
  }

  private save(items: RecentItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }

  push(item: Omit<RecentItem, 'timestamp'>): void {
    const current = this.itemsSubject.value;

    // Remove duplicate (same route)
    const filtered = current.filter(
      i => i.route.join('/') !== item.route.join('/')
    );

    const next = [{ ...item, timestamp: new Date() }, ...filtered].slice(0, this.MAX_ITEMS);
    this.itemsSubject.next(next);
    this.save(next);
  }

  clear(): void {
    this.itemsSubject.next([]);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  get snapshot(): RecentItem[] {
    return this.itemsSubject.value;
  }
}