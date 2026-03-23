import { Product } from '../products.data';

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
