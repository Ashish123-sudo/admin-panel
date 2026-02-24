// Quote Detail interface
export interface QuoteDetail {
  slNo?: number;
  quoteRef?: string;        // optional (backend fills if needed)
  itemDesc: string;
  itemUnitRate: number;
  itemQuantity: number;
  itemValue: number;
}

// Quote Header interface
export interface QuoteHeader {
  quoteId?: number;
  quoteRef?: string;        // ✅ MAKE OPTIONAL
  customerId?: number;
  quoteDate: string;
  totalQuantity?: number;
  totalValue?: number;
  quoteDetails?: QuoteDetail[];
}