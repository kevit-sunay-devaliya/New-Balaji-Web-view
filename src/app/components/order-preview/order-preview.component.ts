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

  previewGrandAmt = 0;
  previewGrandQty = 0;
  previewGrandGst = 0;
  previewGrandGstTotal = 0;
  subTotal = 0;
  grandTotalRounded = 0;

  constructor(
    public orderService: OrderService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.previewRows = this.orderService.buildPreviewRows();
    if (this.previewRows.length === 0) {
      this.router.navigate(['/order']);
      return;
    }
    this.previewGrandAmt = this.previewRows.reduce(
      (sum, r) => sum + r.amount,
      0,
    );
    this.previewGrandQty = this.previewRows.reduce(
      (sum, r) => sum + r.boxBunchQty + r.pattiQty + r.packetQty,
      0,
    );
    this.previewGrandGst = this.previewRows.reduce(
      (sum, r) => sum + r.gstAmount,
      0,
    );
    this.previewGrandGstTotal = this.previewRows.reduce(
      (sum, r) => sum + r.amount + r.gstAmount,
      0,
    );
    this.subTotal = this.previewGrandAmt + this.previewGrandGst;
    this.grandTotalRounded = Math.round(this.subTotal);
  }

  backToList(): void {
    this.router.navigate(['/order']);
  }

  onSubmit(): void {
    this.isSubmitting = true;
    this.orderService.submitOrder().subscribe({
      next: () => {
        this.orderService.clearOrder();
        this.router.navigate(['/order']).then(() => {
          window.location.href = 'https://wa.me/+919313234679';
        });
      },
      error: (err) => {
        console.error('Order submission failed', err);
        this.isSubmitting = false;
        alert('Failed to submit order. Please try again.');
      },
    });
  }
}
