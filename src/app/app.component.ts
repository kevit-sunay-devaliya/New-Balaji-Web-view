import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { combineLatest } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { ThemeService } from './services/theme.service';
import { ToastService } from './services/toast.service';
import { OrderService } from './services/order.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  readonly vm$ = combineLatest({
    isDarkMode: this.themeService.isDarkMode$,
    toastVisible: this.toastService.visible$,
    toastMessage: this.toastService.message$,
  });

  constructor(
    public themeService: ThemeService,
    public toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        take(1),
      )
      .subscribe(() => {
        const params = this.route.snapshot.queryParams;
        if (params['contactNumber']) {
          this.orderService.setContactNumber(params['contactNumber']);
        }
        if (params['name']) {
          this.orderService.setName(params['name']);
        }
      });
  }
}
