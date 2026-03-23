import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product, PRODUCTS } from '../products.data';
import { ProductGroup, OrderPreviewRow } from '../models/product-group.model';

const STORAGE_KEY = 'balaji_order_quantities';
const CART_KEY = 'balaji_cart_mode';

@Injectable({ providedIn: 'root' })
export class OrderService {
  // ── Private BehaviorSubjects ───────────────────────────────────────────────
  private _isCartMode = new BehaviorSubject<boolean>(false);
  private _searchTerm = new BehaviorSubject<string>('');
  private _activeSegment = new BehaviorSubject<string>('ALL');
  private _segments = new BehaviorSubject<string[]>([]);
  private _productGroups = new BehaviorSubject<ProductGroup[]>([]);
  private _grandQty = new BehaviorSubject<number>(0);
  private _grandAmt = new BehaviorSubject<number>(0);
  private _grandBox = new BehaviorSubject<number>(0);
  private _grandPatti = new BehaviorSubject<number>(0);
  private _grandPkt = new BehaviorSubject<number>(0);

  // ── Public observables (consumed by templates via async pipe) ──────────────
  readonly isCartMode$ = this._isCartMode.asObservable();
  readonly searchTerm$ = this._searchTerm.asObservable();
  readonly activeSegment$ = this._activeSegment.asObservable();
  readonly segments$ = this._segments.asObservable();
  readonly productGroups$ = this._productGroups.asObservable();
  readonly grandQty$ = this._grandQty.asObservable();
  readonly grandAmt$ = this._grandAmt.asObservable();
  readonly grandBox$ = this._grandBox.asObservable();
  readonly grandPatti$ = this._grandPatti.asObservable();
  readonly grandPkt$ = this._grandPkt.asObservable();

  // ── Getters for current values (used internally and for ngModel binding) ───
  get isCartMode(): boolean {
    return this._isCartMode.value;
  }
  get searchTerm(): string {
    return this._searchTerm.value;
  }
  set searchTerm(val: string) {
    this._searchTerm.next(val);
  }
  get activeSegment(): string {
    return this._activeSegment.value;
  }
  get segments(): string[] {
    return this._segments.value;
  }
  get productGroups(): ProductGroup[] {
    return this._productGroups.value;
  }
  get grandQty(): number {
    return this._grandQty.value;
  }
  get grandAmt(): number {
    return this._grandAmt.value;
  }
  get grandBox(): number {
    return this._grandBox.value;
  }
  get grandPatti(): number {
    return this._grandPatti.value;
  }
  get grandPkt(): number {
    return this._grandPkt.value;
  }

  // ── Internal full (unfiltered) groups list ────────────────────────────────
  allProducts: Product[] = [];
  private allGroups: ProductGroup[] = [];
  focusedProduct: Product | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    try {
      this._isCartMode.next(localStorage.getItem(CART_KEY) === 'true');
    } catch {
      // storage unavailable (e.g. incognito with blocked storage)
    }

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
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      // storage unavailable
    }
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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // storage full or unavailable
    }
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
        });
      }
      groupMap.get(p.falvourEn)!.products.push(p);
      const grp = groupMap.get(p.falvourEn)!;
      if (!grp.segments.includes(p.Segment)) {
        grp.segments.push(p.Segment);
      }
    }
    this.allGroups = Array.from(groupMap.values());
    this._segments.next([
      'ALL',
      'NEW',
      ...Array.from(new Set(this.allProducts.map((p) => p.Segment))),
    ]);
    for (const group of this.allGroups) {
      group.hasBox = group.products.some((p) => p.boxBunch > 0);
      group.hasPatti = group.products.some((p) => p.patti > 0);
      group.hasPkt = group.products.some((p) => p.packet > 0);
      group.boxBunchLabel =
        group.products.find((p) => p.boxBunch > 0)?.boxBunch ?? 0;
      group.pattiLabel = group.products.find((p) => p.patti > 0)?.patti ?? 0;
    }
  }

  private recalcTotals(): void {
    let qty = 0,
      amt = 0,
      box = 0,
      patti = 0,
      pkt = 0;

    for (const group of this.allGroups) {
      group.groupTotal = 0;
      group.groupQty = 0;
      group.groupBox = 0;
      group.groupPatti = 0;
      group.groupPkt = 0;
      for (const p of group.products) {
        const bb = p.orderBoxBunch || 0;
        const pt = p.orderPatti || 0;
        const pktVal = p.orderPacket || 0;
        const totalUnits = bb * p.boxBunch + pt * (p.patti || 0) + pktVal;
        const a = totalUnits > 0 ? totalUnits * p.unitPrice : 0;
        group.groupTotal += a;
        group.groupQty += bb + pt + pktVal;
        group.groupBox += bb;
        group.groupPatti += pt;
        group.groupPkt += pktVal;
        qty += bb + pt + pktVal;
        amt += a;
        box += bb;
        patti += pt;
        pkt += pktVal;
      }
    }

    this._grandQty.next(qty);
    this._grandAmt.next(amt);
    this._grandBox.next(box);
    this._grandPatti.next(patti);
    this._grandPkt.next(pkt);
  }

  onQtyChange(): void {
    this.recalcTotals();
    this.persistQuantities();
  }

  onSearch(): void {
    const term = this._searchTerm.value.toLowerCase();
    const activeSeg = this._activeSegment.value;
    const filtered = this.allGroups.filter((group) => {
      const matchesTerm =
        group.flavorEn.toLowerCase().includes(term) ||
        group.products.some((p) => p.productName.toLowerCase().includes(term));
      const matchesSegment =
        activeSeg === 'ALL' ||
        (activeSeg === 'NEW'
          ? group.products.some((p) => p.newItem)
          : group.segments.includes(activeSeg));
      return matchesTerm && matchesSegment;
    });
    this._productGroups.next(filtered);
  }

  setSegment(segment: string): void {
    this._activeSegment.next(segment);
    this.onSearch();
  }

  toggleCart(): void {
    this._isCartMode.next(!this._isCartMode.value);
    try {
      localStorage.setItem(CART_KEY, String(this._isCartMode.value));
    } catch {
      // storage unavailable
    }
    this.applyCartFilter();
  }

  private applyCartFilter(): void {
    if (this._isCartMode.value) {
      const filtered = this.allGroups.filter((group) =>
        group.products.some(
          (p) =>
            (p.orderBoxBunch || 0) > 0 ||
            (p.orderPatti || 0) > 0 ||
            (p.orderPacket || 0) > 0,
        ),
      );
      this._productGroups.next(filtered);
    } else {
      this.onSearch();
    }
  }

  buildPreviewRows(): OrderPreviewRow[] {
    const rows: OrderPreviewRow[] = [];
    for (const group of this.allGroups) {
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
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CART_KEY);
    } catch {
      // storage unavailable
    }
    this._isCartMode.next(false);
    this.recalcTotals();
    this.applyCartFilter();
  }

  productTrackBy(_index: number, product: Product): string {
    return product.productId;
  }

  groupTrackBy(_index: number, group: ProductGroup): string {
    return group.flavorEn;
  }
}
