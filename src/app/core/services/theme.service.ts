import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'uribe-metrics-theme';

  readonly theme = signal<ThemeMode>(this.readInitialTheme());

  toggleTheme(): void {
    this.theme.update((current) => (current === 'light' ? 'dark' : 'light'));
    this.persistTheme();
  }

  syncThemeWithDocument(): void {
    document.documentElement.setAttribute('data-theme', this.theme());
  }

  private readInitialTheme(): ThemeMode {
    const savedTheme = localStorage.getItem(this.storageKey);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private persistTheme(): void {
    localStorage.setItem(this.storageKey, this.theme());
  }
}
