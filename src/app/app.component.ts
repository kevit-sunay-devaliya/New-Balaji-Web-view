import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Product, PRODUCTS } from './products.data';

export interface ProductGroup {
  flavorEn: string;
  flavorHi: string;
  flavorGu: string;
  segment: string;
  segments: string[];
  imageURL: string;
  zipperImageURL?: string;
  products: Product[];
  groupTotal: number;
  groupQty: number;
  groupBox: number;
  groupPatti: number;
  groupPkt: number;
  hasBox: boolean;
  hasPatti: boolean;
  hasPkt: boolean;
  boxBunchLabel: number;
  pattiLabel: number;
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
  boxBunch: number;
  pattiSize: number;
  amount: number;
  gstPercentage: number;
  gstAmount: number;
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
  activeSegment = 'ALL';
  segments: string[] = [];

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
          segments: [p.Segment],
          imageURL: p.regularImageURL,
          zipperImageURL: p.zipperImageURL,
          products: [],
          groupTotal: 0,
          groupQty: 0,
          groupBox: 0,
          groupPatti: 0,
          groupPkt: 0,
          hasBox: false,
          hasPatti: false,
          hasPkt: false,
          boxBunchLabel: 0,
          pattiLabel: 0,
          visible: true,
        });
      }
      groupMap.get(p.falvourEn)!.products.push(p);
      const grp = groupMap.get(p.falvourEn)!;
      if (!grp.segments.includes(p.Segment)) {
        grp.segments.push(p.Segment);
      }
    }
    this.productGroups = Array.from(groupMap.values());
    this.segments = [
      'ALL',
      'NEW',
      ...Array.from(new Set(this.allProducts.map((p) => p.Segment))),
    ];
    for (const group of this.productGroups) {
      group.hasBox = group.products.some((p) => p.boxBunch > 0);
      group.hasPatti = group.products.some((p) => p.patti > 0);
      group.hasPkt = group.products.some((p) => p.packet > 0);
      group.boxBunchLabel =
        group.products.find((p) => p.boxBunch > 0)?.boxBunch ?? 0;
      group.pattiLabel = group.products.find((p) => p.patti > 0)?.patti ?? 0;
    }
  }

  onQtyChange(): void {
    this.grandQty = 0;
    this.grandAmt = 0;

    for (const group of this.productGroups) {
      group.groupTotal = 0;
      group.groupQty = 0;
      group.groupBox = 0;
      group.groupPatti = 0;
      group.groupPkt = 0;
      for (const p of group.products) {
        const bb = p.orderBoxBunch || 0;
        const pt = p.orderPatti || 0;
        const pkt = p.orderPacket || 0;
        const totalUnits = bb * p.boxBunch + pt * (p.patti || 0) + pkt;
        const amt = totalUnits > 0 ? totalUnits * p.unitPrice : 0;
        group.groupTotal += amt;
        group.groupQty += bb + pt + pkt;
        group.groupBox += bb;
        group.groupPatti += pt;
        group.groupPkt += pkt;
        this.grandQty += bb + pt + pkt;
        this.grandAmt += amt;
      }
    }
  }

  onSearch(): void {
    const term = this.searchTerm.toLowerCase();
    for (const group of this.productGroups) {
      const matchesTerm =
        group.flavorEn.toLowerCase().includes(term) ||
        group.products.some((p) => p.productName.toLowerCase().includes(term));
      const matchesSegment =
        this.activeSegment === 'ALL' ||
        (this.activeSegment === 'NEW'
          ? group.products.some((p) => p.newItem)
          : group.segments.includes(this.activeSegment));
      group.visible = matchesTerm && matchesSegment;
    }
  }

  setSegment(segment: string): void {
    this.activeSegment = segment;
    this.onSearch();
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
          const baseAmt = totalUnits * p.unitPrice;
          this.previewRows.push({
            flavorEn: p.falvourEn,
            productName: p.productName,
            mrp: p.MRP,
            unitPrice: p.unitPrice,
            weight: p.weight,
            boxBunchQty: bb,
            pattiQty: pt,
            packetQty: pkt,
            boxBunch: p.boxBunch || 0,
            pattiSize: p.patti || 0,
            amount: baseAmt,
            gstPercentage: p.gstPercentage,
            gstAmount: (baseAmt * p.gstPercentage) / 100,
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

  get previewGrandGst(): number {
    return this.previewRows.reduce((sum, r) => sum + r.gstAmount, 0);
  }

  get previewGrandGstTotal(): number {
    return this.previewRows.reduce((sum, r) => sum + r.amount + r.gstAmount, 0);
  }

  get taxableValue(): number {
    return this.previewGrandAmt;
  }

  get cgst(): number {
    return this.previewGrandGst / 2;
  }

  get sgst(): number {
    return this.previewGrandGst / 2;
  }

  get subTotal(): number {
    return this.previewGrandAmt + this.previewGrandGst;
  }

  get rounding(): number {
    return Math.round(this.subTotal) - this.subTotal;
  }

  get grandTotalRounded(): number {
    return Math.round(this.subTotal);
  }

  get previewTotalBox(): number {
    return this.previewRows.reduce((sum, r) => sum + r.boxBunchQty, 0);
  }

  get previewTotalPatti(): number {
    return this.previewRows.reduce((sum, r) => sum + r.pattiQty, 0);
  }

  get previewTotalPkt(): number {
    return this.previewRows.reduce((sum, r) => sum + r.packetQty, 0);
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
    //   Authorization: '',
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

  onlyDigits(event: KeyboardEvent, maxDigits: number): void {
    const allowed = [
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'Tab',
    ];
    if (!allowed.includes(event.key)) {
      event.preventDefault();
      return;
    }
    const input = event.target as HTMLInputElement;
    const isDigit = event.key >= '0' && event.key <= '9';
    if (isDigit && input.value.length >= maxDigits) {
      event.preventDefault();
    }
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
