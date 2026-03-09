export interface QuoteDetail {
  slNo?: number;
  quoteRef?: string;
  itemDesc: string;
  itemUnitRate: number;
  itemQuantity: number;
  itemDiscount?: number;
  itemValue: number;
}

export interface QuoteTermsCondition {
  groupName: string;
  termText: string;
  groupOrder: number;
  termOrder: number;
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
  customerAddress1?: string;
  customerAddress2?: string;
  customerCity?: string;
  customerState?: string;
  customerCountry?: string;
  customerEmail?: string;
  termsConditions?: string;
  quoteDetails?: QuoteDetail[];
  incomingTerms?: QuoteTermsCondition[];
  quoteTermsConditions?: QuoteTermsCondition[];
}