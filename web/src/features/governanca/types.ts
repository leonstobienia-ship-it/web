export type GovernancaPerfilMock =
  | 'Matheus'
  | 'Gustavo'
  | 'Leon'
  | 'Kemilly'
  | 'Campo'
  | 'Diretoria/Admin';

export interface RegraAlcadaMock {
  id: string;
  modulo: string;
  tipo_documento: string;
  acao: string;
  limite_tecnico: number;
  aprovador_tecnico: GovernancaPerfilMock;
  aprovador_diretoria: GovernancaPerfilMock;
  observacao: string;
}

export interface ResolucaoAprovacaoMock {
  aprovador: GovernancaPerfilMock;
  badge: string;
  motivo: string;
  limite: number;
  nivel: 'tecnico' | 'diretoria';
}
