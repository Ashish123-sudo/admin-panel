export interface TcType {
  typeId?: number;
  typeName: string;
}

export interface TcLibraryItem {
  termId?: number;
  termText: string;
  tcType?: TcType;
  sortOrder?: number;  
}