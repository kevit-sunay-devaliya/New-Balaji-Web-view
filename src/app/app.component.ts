import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Product, PRODUCTS } from './products.data';

export interface ProductGroup {
  flavorEn: string;
  flavorHi: string;
  flavorGu: string;
  segment: string;
  imageURL: string;
  zipperImageURL?: string;
  products: Product[];
  groupTotal: number;
  groupQty: number;
  visible: boolean;
}

export interface OrderPreviewRow {
  flavorEn: string;
  productName: string;
  mrp: string;
  unitPrice: number;
  weight: string;
  boxBunchQty: number;
  pattiQty: number;
  packetQty: number;
  amount: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  isDarkMode = false;
  isCartMode = false;
  showPreviewMode = false;
  isSubmitting = false;
  searchTerm = '';

  grandQty = 0;
  grandAmt = 0;

  allProducts: Product[] = [];
  productGroups: ProductGroup[] = [];
  previewRows: OrderPreviewRow[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.allProducts = PRODUCTS.map((p) => ({
      ...p,
      orderBoxBunch: undefined,
      orderPatti: undefined,
      orderPacket: undefined,
    }));
    this.buildGroups();
  }

  buildGroups(): void {
    const groupMap = new Map<string, ProductGroup>();
    for (const p of this.allProducts) {
      if (!groupMap.has(p.falvourEn)) {
        groupMap.set(p.falvourEn, {
          flavorEn: p.falvourEn,
          flavorHi: p.falvourHi,
          flavorGu: p.falvourGu,
          segment: p.Segment,
          imageURL: p.regularImageURL,
          zipperImageURL: p.zipperImageURL,
          products: [],
          groupTotal: 0,
          groupQty: 0,
          visible: true,
        });
      }
      groupMap.get(p.falvourEn)!.products.push(p);
    }
    this.productGroups = Array.from(groupMap.values());
  }

  onQtyChange(): void {
    this.grandQty = 0;
    this.grandAmt = 0;

    for (const group of this.productGroups) {
      console.log(
        '🚀 ~ AppComponent ~ onQtyChange ~ productGroups:',
        this.productGroups,
      );
      group.groupTotal = 0;
      group.groupQty = 0;
      for (const p of group.products) {
        console.log('🚀 ~ AppComponent ~ onQtyChange ~ p:', p);
        const bb = p.orderBoxBunch || 0;
        const pt = p.orderPatti || 0;
        const pkt = p.orderPacket || 0;
        const totalUnits = bb * p.boxBunch + pt * (p.patti || 0) + pkt;
        const amt = totalUnits > 0 ? totalUnits * p.unitPrice : 0;
        group.groupTotal += amt;
        group.groupQty += bb + pt + pkt;
        this.grandQty += bb + pt + pkt;
        this.grandAmt += amt;
      }
    }
  }

  onSearch(): void {
    const term = this.searchTerm.toLowerCase();
    for (const group of this.productGroups) {
      group.visible =
        group.flavorEn.toLowerCase().includes(term) ||
        group.products.some((p) => p.productName.toLowerCase().includes(term));
    }
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
  }

  toggleCart(): void {
    this.isCartMode = !this.isCartMode;
    for (const group of this.productGroups) {
      if (this.isCartMode) {
        group.visible = group.products.some(
          (p) =>
            (p.orderBoxBunch || 0) > 0 ||
            (p.orderPatti || 0) > 0 ||
            (p.orderPacket || 0) > 0,
        );
      } else {
        group.visible = true;
        this.onSearch();
      }
    }
  }

  showPreview(): void {
    this.previewRows = [];
    for (const group of this.productGroups) {
      for (const p of group.products) {
        const bb = p.orderBoxBunch || 0;
        const pt = p.orderPatti || 0;
        const pkt = p.orderPacket || 0;
        if (bb > 0 || pt > 0 || pkt > 0) {
          const totalUnits = bb * p.boxBunch + pt * (p.patti || 0) + pkt;
          this.previewRows.push({
            flavorEn: p.falvourEn,
            productName: p.productName,
            mrp: p.MRP,
            unitPrice: p.unitPrice,
            weight: p.weight,
            boxBunchQty: bb,
            pattiQty: pt,
            packetQty: pkt,
            amount: totalUnits * p.unitPrice,
          });
        }
      }
    }
    this.showPreviewMode = true;
  }

  backToList(): void {
    this.showPreviewMode = false;
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

  productTrackBy(index: number, product: Product): string {
    return product.productId;
  }

  groupTrackBy(index: number, group: ProductGroup): string {
    return group.flavorEn;
  }

  onSubmit(): void {
    this.showPreviewMode = false;
    window.location.href = 'https://wa.me/+919313234679';

    // --- API call (for future use) ---
    // if (this.isSubmitting) return;
    // this.isSubmitting = true;

    // const headers = new HttpHeaders({
    //   'Content-Type': 'application/json',
    //   Authorization: 'Y!*c7cGdteUdPSCV8HnV5IDSHGmFvM%U@xd2ikJJAHB5p@M3y**m',
    // });

    // const items = this.previewRows.map((row) => ({
    //   item_name: row.productName,
    //   loose_qty: row.pattiQty ?? 0,
    //   box_qty: row.boxBunchQty ?? 0,
    //   amount_inr: row.amount,
    // }));

    // const body = {
    //   items,
    //   total_amount_inr: this.previewGrandAmt,

    //   retailerName: 'Sunay Devaliya',
    //   distributorName: 'Dhruv Kundaliya',
    //   orderNumber: '8612',
    //   orderDate: new Date().toLocaleDateString(),
    //   contactNumber: '+919313234679',
    // };

    // this.http
    //   .post<any>(
    //     'https://qn15mp51-3400.inc1.devtunnels.ms/custom/dabur-ai/pdf/acknwledgement',
    //     body,
    //     { headers },
    //   )
    //   .subscribe({
    //     next: () => {
    //       this.isSubmitting = false;
    //       window.location.href = 'https://wa.me/+919313234679';
    //     },
    //     error: (err) => {
    //       console.error(err);
    //       this.isSubmitting = false;
    //     },
    //   });
  }

  focusedProduct: Product | null = null;

  onInputFocus(product: Product): void {
    this.focusedProduct = product;
  }

  onInputBlur(): void {
    this.focusedProduct = null;
  }

  getGroupImage(group: ProductGroup): string {
    if (group.zipperImageURL && this.focusedProduct) {
      const isInGroup = group.products.includes(this.focusedProduct);
      if (isInGroup) {
        return parseFloat(this.focusedProduct.weight) > 200
          ? group.zipperImageURL
          : group.imageURL;
      }
    }
    return group.imageURL;
  }
}
