import { Injectable } from '@angular/core';
import { Product, PRODUCTS } from '../products.data';
import { ProductGroup, OrderPreviewRow } from '../models/product-group.model';

const STORAGE_KEY = 'balaji_order_quantities';
const THEME_KEY = 'balaji_theme';
const CART_KEY = 'balaji_cart_mode';

@Injectable({ providedIn: 'root' })
export class OrderService {
  isDarkMode = false;
  isCartMode = false;
  searchTerm = '';
  activeSegment = 'ALL';
  segments: string[] = [];

  grandQty = 0;
  grandAmt = 0;
  grandBox = 0;
  grandPatti = 0;
  grandPkt = 0;

  allProducts: Product[] = [];
  productGroups: ProductGroup[] = [];

  focusedProduct: Product | null = null;

  toastMessage = '';
  toastVisible = false;
  private toastTimer: any = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.isDarkMode = localStorage.getItem(THEME_KEY) === 'dark';
    this.isCartMode = localStorage.getItem(CART_KEY) === 'true';

    this.allProducts = PRODUCTS.map((p) => ({
      ...p,
      orderBoxBunch: undefined,
      orderPatti: undefined,
      orderPacket: undefined,
    }));

    this.restoreQuantities();
    this.buildGroups();
    this.recalcTotals();
    this.applyCartFilter();
  }

  private restoreQuantities(): void {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const data: Record<
        string,
        { orderBoxBunch?: number; orderPatti?: number; orderPacket?: number }
      > = JSON.parse(saved);
      for (const p of this.allProducts) {
        if (data[p.productId]) {
          p.orderBoxBunch = data[p.productId].orderBoxBunch;
          p.orderPatti = data[p.productId].orderPatti;
          p.orderPacket = data[p.productId].orderPacket;
        }
      }
    } catch {
      // ignore corrupt storage data
    }
  }

  private persistQuantities(): void {
    const data: Record<
      string,
      { orderBoxBunch?: number; orderPatti?: number; orderPacket?: number }
    > = {};
    for (const p of this.allProducts) {
      if (
        (p.orderBoxBunch || 0) > 0 ||
        (p.orderPatti || 0) > 0 ||
        (p.orderPacket || 0) > 0
      ) {
        data[p.productId] = {
          orderBoxBunch: p.orderBoxBunch,
          orderPatti: p.orderPatti,
          orderPacket: p.orderPacket,
        };
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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

  private recalcTotals(): void {
    this.grandQty = 0;
    this.grandAmt = 0;
    this.grandBox = 0;
    this.grandPatti = 0;
    this.grandPkt = 0;

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
        this.grandBox += bb;
        this.grandPatti += pt;
        this.grandPkt += pkt;
      }
    }
  }

  onQtyChange(): void {
    this.recalcTotals();
    this.persistQuantities();
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
    localStorage.setItem(THEME_KEY, this.isDarkMode ? 'dark' : 'light');
  }

  toggleCart(): void {
    this.isCartMode = !this.isCartMode;
    localStorage.setItem(CART_KEY, String(this.isCartMode));
    this.applyCartFilter();
  }

  private applyCartFilter(): void {
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

  buildPreviewRows(): OrderPreviewRow[] {
    const rows: OrderPreviewRow[] = [];
    for (const group of this.productGroups) {
      for (const p of group.products) {
        const bb = p.orderBoxBunch || 0;
        const pt = p.orderPatti || 0;
        const pkt = p.orderPacket || 0;
        if (bb > 0 || pt > 0 || pkt > 0) {
          const totalUnits = bb * p.boxBunch + pt * (p.patti || 0) + pkt;
          const baseAmt = totalUnits * p.unitPrice;
          rows.push({
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
    return rows;
  }

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

  clearOrder(): void {
    for (const p of this.allProducts) {
      p.orderBoxBunch = undefined;
      p.orderPatti = undefined;
      p.orderPacket = undefined;
    }
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CART_KEY);
    this.isCartMode = false;
    this.recalcTotals();
    this.applyCartFilter();
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
      this.showToast(
        `Max ${maxDigits} digit${maxDigits > 1 ? 's' : ''} allowed (0–${'9'.repeat(maxDigits)})`,
      );
    }
  }

  showToast(message: string): void {
    this.toastMessage = message;
    this.toastVisible = true;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
    }, 2500);
  }

  productTrackBy(_index: number, product: Product): string {
    return product.productId;
  }

  groupTrackBy(_index: number, group: ProductGroup): string {
    return group.flavorEn;
  }
}
