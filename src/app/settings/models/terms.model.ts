export interface TermsDetail {
  detailId?: number;
  termText: string;
  sortOrder?: number;
}

export interface TermsGroup {
  groupId?: number;
  groupName: string;
  sortOrder?: number;
  termsDetails: TermsDetail[];
}

export interface TermsTemplate {
  templateId?: number;
  templateName: string;
  termsGroups: TermsGroup[];
}