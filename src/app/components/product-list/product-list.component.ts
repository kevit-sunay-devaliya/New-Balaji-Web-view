import { ChangeDetectionStrategy, Component } from '@angular/core';
import { combineLatest } from 'rxjs';
import { Router } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { ProductGroup } from '../../models/product-group.model';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListComponent {
  readonly vm$ = combineLatest({
    productGroups: this.orderService.productGroups$,
    grandQty: this.orderService.grandQty$,
    loading: this.orderService.loading$,
    error: this.orderService.error$,
  });

  constructor(
    public orderService: OrderService,
    private router: Router,
  ) {}

  showPreview(): void {
    this.router.navigate(['/preview']);
  }

  groupTrackBy(_index: number, group: ProductGroup): string {
    return group.flavorEn;
  }
}
