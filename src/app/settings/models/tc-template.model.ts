import { TcLibraryItem } from './tc-library.model';

export interface TcTemplate {
  templateId?: string;  // Changed from number to string (UUID)
  templateName: string;
  terms?: TcLibraryItem[];
}