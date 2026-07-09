export type CustomerModalSubTab = 'basic' | 'locations' | 'references' | 'sales' | 'photos';

export interface CustomerDisplayName {
  first: string;
  last: string;
}

export interface CustomerWhatsappContact {
  prefix: string;
  number: string;
}
