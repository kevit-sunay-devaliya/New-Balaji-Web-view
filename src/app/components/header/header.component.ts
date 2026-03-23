import { Component } from '@angular/core';
import { combineLatest } from 'rxjs';
import { OrderService } from '../../services/order.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
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

  trackBySegment(_index: number, segment: string): string {
    return segment;
  }
}
