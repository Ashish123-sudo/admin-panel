export interface Currency {
  currencyId?: string;  // Changed from number to string (UUID)
  currencyCode: string;
  currencyName?: string;
  isDefault?: boolean;
}