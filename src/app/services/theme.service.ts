import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const THEME_KEY = 'balaji_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _isDarkMode = new BehaviorSubject<boolean>(false);
  readonly isDarkMode$ = this._isDarkMode.asObservable();
  get isDarkMode(): boolean { return this._isDarkMode.value; }

  constructor() {
    try {
      this._isDarkMode.next(localStorage.getItem(THEME_KEY) === 'dark');
    } catch (e) {
      console.warn('localStorage unavailable, theme defaulting to light mode.', e);
    }
  }

  toggle(): void {
    this._isDarkMode.next(!this._isDarkMode.value);
    try {
      localStorage.setItem(THEME_KEY, this._isDarkMode.value ? 'dark' : 'light');
    } catch (e) {
      console.warn('Failed to persist theme preference to localStorage.', e);
    }
  }
}
