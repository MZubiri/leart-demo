import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product } from '../../store/products';

export interface SiteSettingAdmin {
  id: number;
  storeName: string;
  whatsAppNumber: string;
  announcementText: string;
  instagramUrl: string;
  whatsAppQuoteTemplate: string;
  whatsAppPersonalizationTemplate: string;
  updatedAt: string;
}

export interface UpdateSettingsRequest {
  storeName: string;
  whatsAppNumber: string;
  announcementText: string;
  instagramUrl: string;
  whatsAppQuoteTemplate?: string;
  whatsAppPersonalizationTemplate?: string;
}

export interface OrderAdminAttachment {
  id: number;
  originalFileName: string;
  url: string;
  contentType: string;
  fileSizeBytes: number;
  uploadedAt: string;
}

export interface OrderAdmin {
  id: number;
  orderReference: string;
  customerName: string;
  phone: string;
  productTitle: string;
  peopleDetails: string;
  story: string;
  phrase: string;
  requirements: string;
  status: string;
  createdAt: string;
  attachments: OrderAdminAttachment[];
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin`;

  // Settings
  getSettings(): Observable<SiteSettingAdmin> {
    return this.http.get<SiteSettingAdmin>(`${this.baseUrl}/settings`);
  }

  updateSettings(data: UpdateSettingsRequest): Observable<SiteSettingAdmin> {
    return this.http.put<SiteSettingAdmin>(`${this.baseUrl}/settings`, data);
  }

  // Products
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/products`);
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/products/${id}`);
  }

  createProduct(data: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/products`, data);
  }

  updateProduct(id: string, data: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/products/${id}`, data);
  }

  toggleProductActive(id: string): Observable<{ id: string; isActive: boolean }> {
    return this.http.patch<{ id: string; isActive: boolean }>(`${this.baseUrl}/products/${id}/toggle`, {});
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/products/${id}`);
  }

  uploadProductImage(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${this.baseUrl}/products/upload-image`, formData);
  }

  // Orders
  getOrders(status?: string): Observable<OrderAdmin[]> {
    const params = status && status !== 'Todos' ? `?status=${encodeURIComponent(status)}` : '';
    return this.http.get<OrderAdmin[]>(`${this.baseUrl}/orders${params}`);
  }

  getOrderById(id: number): Observable<OrderAdmin> {
    return this.http.get<OrderAdmin>(`${this.baseUrl}/orders/${id}`);
  }

  updateOrderStatus(id: number, status: string): Observable<{ id: number; status: string }> {
    return this.http.patch<{ id: number; status: string }>(`${this.baseUrl}/orders/${id}/status`, { status });
  }

  deleteOrder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/orders/${id}`);
  }
}
