export interface QuoteDetail {
  slNo?: number;
  quoteRef?: string;
  itemDesc: string;
  itemUnitRate: number;
  itemQuantity: number;
  itemValue: number;
}

export interface QuoteHeader {
  quoteId?: number;
  quoteRef?: string;
  customerId?: number;
  customerName?: string;
  quoteDate: string;
  totalQuantity?: number;
  totalValue?: number;
  currency?: string;        // ✅ ADD
  quoteDetails?: QuoteDetail[];
}