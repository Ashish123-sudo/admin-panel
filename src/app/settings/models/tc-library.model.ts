export interface TcType {
  typeId?: string;  // Changed from number to string (UUID)
  typeName: string;
}

export interface TcLibraryItem {
  termId?: string;  // Changed from number to string (UUID)
  termText: string;
  tcType?: TcType;
  sortOrder?: number;  
}