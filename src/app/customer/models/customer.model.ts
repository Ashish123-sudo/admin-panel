export interface Customer {
  customerId: string;  // Changed from number to string (UUID)
  name: string;
  address1: string;
  address2: string;
  city: string;
  stateProvince: string;
  country: string;
  contactNumber: string;
  emailId: string;
  webUrl: string;
}