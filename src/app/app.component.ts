import { Component } from '@angular/core';
import { combineLatest } from 'rxjs';
import { ThemeService } from './services/theme.service';
import { ToastService } from './services/toast.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  readonly vm$ = combineLatest({
    isDarkMode: this.themeService.isDarkMode$,
    toastVisible: this.toastService.visible$,
    toastMessage: this.toastService.message$,
  });

  constructor(
    public themeService: ThemeService,
    public toastService: ToastService,
  ) {}
}
