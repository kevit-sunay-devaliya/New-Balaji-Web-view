import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../products.data';
import { environment } from '../../environments/environment';

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
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  fetchProducts(dealerId: string): Observable<ProductsResponse> {
    return this.http.post<ProductsResponse>(
      `${this.baseUrl}/custom/balaji/products`,
      { dealerId },
    );
  }

  submitOrder(payload: CreateOrderPayload): Observable<unknown> {
    return this.http.post<unknown>(
      `${this.baseUrl}/custom/balaji/order`,
      payload,
    );
  }
}
