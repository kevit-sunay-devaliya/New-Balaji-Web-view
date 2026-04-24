import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { OrderService } from '../../services/order.service';
import { OrderPreviewRow } from '../../models/product-group.model';

const API_BASE_URL = 'https://qn15mp51-3700.inc1.devtunnels.ms/custom/balaji';
// const API_TOKEN = 'Y!*c7cGdteUdPSCV8HnV5IDSHGmFvM%U@xd2ikJJAHB5p@M3y**m';
const API_TOKEN = '12312';
const ORDER_API_URL = `${API_BASE_URL}/pdf/acknwledgement`;
const WHATSAPP_REDIRECT_URL = 'https://wa.me/+919313234679';
const ORDER_DEFAULTS = {
  retailerName: 'Sunay Devaliya',
  distributorName: 'Balaji Wafers',
  orderNumber: String(Math.floor(1000 + Math.random() * 9000)),
};

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
    private http: HttpClient,
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
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: API_TOKEN,
    });

    const body = {
      items: this.previewRows.map((row) => ({
        item_name: row.productName,
        box_qty: row.boxBunchQty,
        patti_qty: row.pattiQty,
        pkt_qty: row.packetQty,
        amount_inr: row.amount,
      })),
      total_amount_inr: this.previewRows.reduce((sum, r) => sum + r.amount, 0),
      retailerName: ORDER_DEFAULTS.retailerName,
      distributorName: ORDER_DEFAULTS.distributorName,
      orderNumber: ORDER_DEFAULTS.orderNumber,
      orderDate: new Date().toLocaleDateString(),
      contactNumber: this.orderService.getContactNumber(),
      name: this.orderService.getName(),
    };

    this.http
      .post<any>(
        'https://qn15mp51-3700.inc1.devtunnels.ms/custom/balaji/pdf/acknowledgement',
        body,
        { headers },
      )
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.orderService.clearOrder();
          window.location.href = WHATSAPP_REDIRECT_URL;
        },
        error: (err) => {
          console.error('Order submission failed', err);
          this.isSubmitting = false;
        },
      });
  }
}
