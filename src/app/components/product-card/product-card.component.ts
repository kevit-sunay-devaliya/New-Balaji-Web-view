import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Product } from '../../products.data';
import { ProductGroup } from '../../models/product-group.model';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  @Input() group!: ProductGroup;

  constructor(public orderService: OrderService) {}

  productTrackBy(_index: number, product: Product): string {
    return product.productId;
  }
}
