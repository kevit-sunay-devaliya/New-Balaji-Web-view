import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { ProductGroup } from '../../models/product-group.model';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
})
export class ProductListComponent {
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
