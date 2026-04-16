import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
} from '@angular/core';
import { combineLatest } from 'rxjs';
import { OrderService } from '../../services/order.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  showSortMenu = false;

  readonly vm$ = combineLatest({
    grandBox: this.orderService.grandBox$,
    grandPatti: this.orderService.grandPatti$,
    grandPkt: this.orderService.grandPkt$,
    grandAmt: this.orderService.grandAmt$,
    isCartMode: this.orderService.isCartMode$,
    segments: this.orderService.segments$,
    activeSegment: this.orderService.activeSegment$,
    isDarkMode: this.themeService.isDarkMode$,
  });

  constructor(
    public orderService: OrderService,
    public themeService: ThemeService,
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.sort-container')) {
      this.showSortMenu = false;
    }
  }

  trackBySegment(_index: number, segment: string): string {
    return segment;
  }
}
