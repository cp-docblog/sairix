export interface Contact {
  id: number;
  name: string;
  wa_id: number;
  lastMessageTime?: number;
}

export interface Message {
  id: number;
  message_id: number;
  from: number;
  to: number | null;
  body: string | null;
  time: number | null;
  media_url?: string;
  media_type?: 'image' | 'video' | 'audio' | 'document';
}

export interface CompanyInfo {
  id: number;
  type: string;
  name: string;
  data: string;
}

export type InfoType = 'Phone Number' | 'Email' | 'URL' | 'Location' | 'Other';

export interface AuthUser {
  email: string;
  password: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  details: string;
  sku: string;
  availability: ProductAvailability;
  quantity?: number;
}

export type ProductAvailability = 'Sold Out' | 'Out of Stock' | 'Coming Soon' | 'Available' | 'Limited';