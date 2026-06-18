import type {
  AprovacaoStatus,
  CentroCustoApi,
  ContaPagarApi,
  DocumentoApi,
  FornecedorApi,
  NotaEntradaApi,
  ObraApi,
  PedidoCompraApi,
  PerfilApi,
  ProgramacaoPagamentoApi,
  UsuarioApi
} from '../../services/erpApi';
import type { RegraAlcadaMock } from './types';

export type UsuarioOperacional = UsuarioApi;
export type PerfilOperacional = PerfilApi;
export type ObraOperacional = ObraApi;
export type CentroCustoOperacional = CentroCustoApi;
export type FornecedorOperacional = FornecedorApi;
export type PedidoCompraOperacional = PedidoCompraApi;
export type NotaFiscalEntradaOperacional = NotaEntradaApi;
export type ContaPagarOperacional = ContaPagarApi;
export type ProgramacaoPagamentoOperacional = ProgramacaoPagamentoApi;
export type DocumentoAnexoOperacional = DocumentoApi;
export type RegraAlcadaOperacional = RegraAlcadaMock;

export interface AprovacaoOperacional {
  status: AprovacaoStatus | string;
  responsavel_nome?: string | null;
  aprovado_em?: string | null;
  motivo?: string | null;
}

export interface EventoAuditoriaOperacional {
  id: string;
  modulo: string;
  entidade: string;
  entidade_id: string;
  acao: string;
  usuario_nome: string;
  created_at: string;
  status_anterior?: string | null;
  status_novo?: string | null;
  observacao?: string | null;
}

export interface ParametroSistemaOperacional {
  chave: string;
  valor: string | number | boolean;
  descricao: string;
  alterado_por: string;
  alterado_em: string;
  aplica_retroativamente: false;
}
