import { TcLibraryItem } from './tc-library.model';

export interface TcTemplate {
  templateId?: number;
  templateName: string;
  terms?: TcLibraryItem[];
}