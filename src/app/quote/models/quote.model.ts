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
  currency?: string;
  termsConditions?: string;
  customerAddress1?: string;
  customerAddress2?: string;
  customerCity?: string;
  customerState?: string;
  customerCountry?: string;
  customerEmail?: string;
  quoteDetails?: QuoteDetail[];
}