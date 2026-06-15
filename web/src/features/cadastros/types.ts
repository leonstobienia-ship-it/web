import type { CadastroPayload, CadastroRecord } from '../../services/erpApi';

export interface CadastroOption {
  value: string;
  label: string;
}

export interface CadastroField {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'date' | 'number' | 'hidden';
  required?: boolean;
  options?: CadastroOption[];
  step?: string;
}

export interface CadastroColumn {
  key: string;
  label: string;
  format?: (record: CadastroRecord) => string;
}

export interface CadastroResourceConfig {
  singular: string;
  plural: string;
  fields: CadastroField[];
  columns: CadastroColumn[];
  emptyText: string;
  initialValues: Record<string, string>;
  list: () => Promise<CadastroRecord[]>;
  create: (payload: CadastroPayload) => Promise<CadastroRecord>;
  update: (id: string, payload: CadastroPayload) => Promise<CadastroRecord>;
  inativar: (id: string) => Promise<CadastroRecord>;
  reativar: (id: string) => Promise<CadastroRecord>;
}
