export interface QuoteDetail {
  slNo?: string;
  quoteRef?: string;
  quoteId?: string;
  itemDesc: string;
  itemUnitRate: number;
  itemQuantity: number;
  itemDiscount?: number;
  itemValue: number;
}

export interface QuoteTermsCondition {
  id?: string;
  groupName: string;
  termText: string;
  groupOrder: number;
  termOrder: number;
}

export interface QuoteHeader {
  quoteId?: string;
  quoteRef?: string;
  customer?: { customerId: string };  // ✅ nested object for POST
  customerId?: string;                // ✅ kept for display in list
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
  approvalStatus?: string;
  submittedBy?: string;
  approvedBy?: string;
  rejectionReason?: string;
}