import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { OrderPreviewRow } from '../../models/product-group.model';

@Component({
  selector: 'app-order-preview',
  templateUrl: './order-preview.component.html',
  styleUrls: ['./order-preview.component.css'],
})
export class OrderPreviewComponent implements OnInit {
  previewRows: OrderPreviewRow[] = [];
  isSubmitting = false;

  constructor(
    public orderService: OrderService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.previewRows = this.orderService.buildPreviewRows();
    if (this.previewRows.length === 0) {
      this.router.navigate(['/order']);
    }
  }

  backToList(): void {
    this.router.navigate(['/order']);
  }

  onSubmit(): void {
    this.orderService.clearOrder();
    this.router.navigate(['/order']).then(() => {
      window.location.href = 'https://wa.me/+919313234679';
    });
  }

  get previewGrandAmt(): number {
    return this.previewRows.reduce((sum, r) => sum + r.amount, 0);
  }

  get previewGrandQty(): number {
    return this.previewRows.reduce(
      (sum, r) => sum + r.boxBunchQty + r.pattiQty + r.packetQty,
      0,
    );
  }

  get previewGrandGst(): number {
    return this.previewRows.reduce((sum, r) => sum + r.gstAmount, 0);
  }

  get previewGrandGstTotal(): number {
    return this.previewRows.reduce((sum, r) => sum + r.amount + r.gstAmount, 0);
  }

  get subTotal(): number {
    return this.previewGrandAmt + this.previewGrandGst;
  }

  get grandTotalRounded(): number {
    return Math.round(this.subTotal);
  }
}
