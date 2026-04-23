import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  ViewChild,
} from '@angular/core';
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
  @ViewChild('videoEl') videoRef?: ElementRef<HTMLVideoElement>;

  protected cardFocused = false;
  protected playingFromMid = false;

  constructor(
    public orderService: OrderService,
    private cdr: ChangeDetectorRef,
  ) {}

  productTrackBy(_index: number, product: Product): string {
    return product.productId;
  }

  get focusedGroupProduct(): Product | null {
    const fp = this.orderService.focusedProduct;
    return fp && this.group.products.includes(fp) ? fp : null;
  }

  get groupHasNewItem(): boolean {
    return this.group.products.some((p) => p.newItem);
  }

  onInputFocus(product: Product): void {
    this.orderService.onInputFocus(product);
    this.cdr.markForCheck();
    const video = this.videoRef?.nativeElement;
    if (!this.cardFocused) {
      this.cardFocused = true;
      if (video) {
        this.playingFromMid = false;
        video.currentTime = 0;
        video.play();
      }
    }
  }

  onInputBlur(): void {
    this.orderService.onInputBlur();
    setTimeout(() => {
      if (
        !this.orderService.focusedProduct ||
        !this.group.products.includes(this.orderService.focusedProduct)
      ) {
        this.cardFocused = false;
        this.cdr.markForCheck();
        const video = this.videoRef?.nativeElement;
        if (video) {
          this.playingFromMid = true;
          video.currentTime = video.duration / 2;
          video.play();
        }
      }
    }, 0);
  }

  onVideoEnded(): void {
    const video = this.videoRef?.nativeElement;
    if (video && this.playingFromMid) {
      this.playingFromMid = false;
      video.pause();
      video.currentTime = 0;
    }
  }
}
