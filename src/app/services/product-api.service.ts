import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../products.data';

export interface ProductsResponse {
  totalCount: number;
  success: boolean;
  products: Product[];
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
}
