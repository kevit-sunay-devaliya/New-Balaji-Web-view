import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../products.data';

export interface ProductsResponse {
  totalCount: number;
  success: boolean;
  products: Product[];
}

export interface OrderUnit {
  unitType: 'Packet' | 'Patti' | 'Box Bunch';
  quantity: number;
}

export interface OrderProduct {
  productCode: string;
  productName: string;
  units: OrderUnit[];
}

export interface CreateOrderPayload {
  retailerId: string;
  dealerId: string;
  products: OrderProduct[];
  source: string;
}

@Injectable({ providedIn: 'root' })
export class ProductApiService {
  constructor(private readonly http: HttpClient) {}

  fetchProducts(dealerId: string): Observable<ProductsResponse> {
    const headers = new HttpHeaders({ Authorization: 'Bearer 12312' });
    return this.http.post<ProductsResponse>(
      'https://qn15mp51-3400.inc1.devtunnels.ms/custom/balaji/products',
      { dealerId },
      { headers },
    );
  }

  submitOrder(payload: CreateOrderPayload): Observable<unknown> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Bearer 12312',
    });
    return this.http.post<unknown>(
      'https://qn15mp51-3400.inc1.devtunnels.ms/custom/balaji/order',
      payload,
      { headers },
    );
  }
}
