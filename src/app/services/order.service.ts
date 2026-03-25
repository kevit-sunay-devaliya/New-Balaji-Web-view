import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product, PRODUCTS } from '../products.data';
import { ProductGroup, OrderPreviewRow } from '../models/product-group.model';

const STORAGE_KEY = 'balaji_order_quantities';
const CART_KEY = 'balaji_cart_mode';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private _isCartMode = new BehaviorSubject<boolean>(false);
  private _searchTerm = new BehaviorSubject<string>('');
  private _activeSegment = new BehaviorSubject<string>('ALL');
  sortOrder: 'none' | 'asc' | 'desc' = 'none';
  private _segments = new BehaviorSubject<string[]>([]);
  private _productGroups = new BehaviorSubject<ProductGroup[]>([]);
  private _grandQty = new BehaviorSubject<number>(0);
  private _grandAmt = new BehaviorSubject<number>(0);
  private _grandBox = new BehaviorSubject<number>(0);
  private _grandPatti = new BehaviorSubject<number>(0);
  private _grandPkt = new BehaviorSubject<number>(0);
  private _loading = new BehaviorSubject<boolean>(false);
  private _error = new BehaviorSubject<string | null>(null);

  readonly isCartMode$ = this._isCartMode.asObservable();
  readonly loading$ = this._loading.asObservable();
  readonly error$ = this._error.asObservable();
  readonly activeSegment$ = this._activeSegment.asObservable();
  readonly segments$ = this._segments.asObservable();
  readonly productGroups$ = this._productGroups.asObservable();
  readonly grandQty$ = this._grandQty.asObservable();
  readonly grandAmt$ = this._grandAmt.asObservable();
  readonly grandBox$ = this._grandBox.asObservable();
  readonly grandPatti$ = this._grandPatti.asObservable();
  readonly grandPkt$ = this._grandPkt.asObservable();

  get searchTerm(): string {
    return this._searchTerm.value;
  }
  set searchTerm(val: string) {
    this._searchTerm.next(val);
  }

  allProducts: Product[] = [];
  private allGroups: ProductGroup[] = [];
  focusedProduct: Product | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    try {
      this._isCartMode.next(localStorage.getItem(CART_KEY) === 'true');
    } catch (e) {
      console.warn('localStorage unavailable, cart mode defaulting to false.', e);
    }

    // --- STATIC DATA (API temporarily disabled) ---
    this.allProducts = PRODUCTS.map((p) => ({
      ...p,
      orderBoxBunch: undefined,
      orderPatti: undefined,
      orderPacket: undefined,
    }));
    this.restoreQuantities();
    this.buildGroups();
    this.recalcTotals();
    this.onSearch();
    // --- END STATIC DATA ---

    /* API CALL - re-enable when ready:
    this._loading.next(true);
    this._error.next(null);
    this.productApiService.fetchProducts().subscribe({
      next: (products) => {
        this.allProducts = products.map((p) => ({
          ...p,
          orderBoxBunch: undefined,
          orderPatti: undefined,
          orderPacket: undefined,
        }));
        this.restoreQuantities();
        this.buildGroups();
        this.recalcTotals();
        this.onSearch();
        this._loading.next(false);
      },
      error: (err) => {
        console.error('Failed to load products from API', err);
        this._loading.next(false);
        this._error.next('Failed to load products. Please try again.');
      },
    });
    */
  }

  private restoreQuantities(): void {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      console.warn(
        'localStorage unavailable, order quantities not restored.',
        e,
      );
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
    } catch (e) {
      console.warn('Corrupt order data in localStorage, discarding.', e);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (removeErr) {
        console.warn(
          'Failed to remove corrupt order data from localStorage.',
          removeErr,
        );
      }
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
    } catch (e) {
      console.warn('Failed to save order quantities to localStorage.', e);
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
    let filtered = this.allGroups.filter((group) => {
      const matchesTerm =
        group.flavorEn.toLowerCase().includes(term) ||
        group.products.some((p) => p.productName.toLowerCase().includes(term));
      const matchesSegment =
        activeSeg === 'ALL' ||
        (activeSeg === 'NEW'
          ? group.products.some((p) => p.newItem)
          : group.segments.includes(activeSeg));
      const matchesCart =
        !this._isCartMode.value ||
        group.products.some(
          (p) =>
            (p.orderBoxBunch || 0) > 0 ||
            (p.orderPatti || 0) > 0 ||
            (p.orderPacket || 0) > 0,
        );
      return matchesTerm && matchesSegment && matchesCart;
    });
    if (this.sortOrder === 'asc') {
      filtered = [...filtered].sort((a, b) =>
        a.flavorEn.localeCompare(b.flavorEn),
      );
    } else if (this.sortOrder === 'desc') {
      filtered = [...filtered].sort((a, b) =>
        b.flavorEn.localeCompare(a.flavorEn),
      );
    }
    this._productGroups.next(filtered);
  }

  setSort(order: 'asc' | 'desc' | 'none'): void {
    this.sortOrder = order;
    this.onSearch();
  }

  setSegment(segment: string): void {
    this._activeSegment.next(segment);
    this.onSearch();
  }

  toggleCart(): void {
    this._isCartMode.next(!this._isCartMode.value);
    try {
      localStorage.setItem(CART_KEY, String(this._isCartMode.value));
    } catch (e) {
      console.warn('Failed to persist cart mode to localStorage.', e);
    }
    this.onSearch();
  }

  private applyCartFilter(): void {
    this.onSearch();
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
    } catch (e) {
      console.warn('Failed to clear order data from localStorage.', e);
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
