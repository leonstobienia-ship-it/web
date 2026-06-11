import {
  ConfiguracaoTesteOperacionalV27A,
  ExecucaoAdministrativaV29CInput,
  FlagsEscritaOperacionalV27A,
  IDiagnosticoReadonlyEnac,
  IAlcadaEnac,
  IHistoricoConfiguracaoEnac,
  IRequisicaoResumoEnac,
  PreValidacaoOperacionalV27AResultado,
  PreValidacaoTesteControladoSnapshotResultado,
  ResultadoAdministrativoV29C,
  ResultadoOperacionalV27A,
  SnapshotCriacaoTesteInput,
  SnapshotCriacaoTesteResultado,
  IUsuarioPerfilEnac
} from '../models';

export interface IEnacRepository {
  listarUsuariosPerfis(options?: { somenteAtivos?: boolean }): Promise<IUsuarioPerfilEnac[]>;
  listarAlcadas(): Promise<IAlcadaEnac[]>;
  listarRequisicoesResumo(): Promise<IRequisicaoResumoEnac[]>;
  listarHistoricoConfiguracoes(): Promise<IHistoricoConfiguracaoEnac[]>;
  obterDiagnosticoReadonly(): Promise<IDiagnosticoReadonlyEnac>;
  preValidarTesteControladoSnapshot(input: SnapshotCriacaoTesteInput): Promise<PreValidacaoTesteControladoSnapshotResultado>;
  executarTesteControladoSnapshot(input: SnapshotCriacaoTesteInput): Promise<SnapshotCriacaoTesteResultado>;
  preValidarEscritaOperacionalRestritaV27A(emailOuLogin: string, flags: FlagsEscritaOperacionalV27A, config: ConfiguracaoTesteOperacionalV27A): Promise<PreValidacaoOperacionalV27AResultado>;
  executarAtualizacaoStatusRequisicaoV27A(emailOuLogin: string, flags: FlagsEscritaOperacionalV27A, config: ConfiguracaoTesteOperacionalV27A): Promise<ResultadoOperacionalV27A>;
  executarCriarSnapshotAprovacaoOperacionalV27A(emailOuLogin: string, flags: FlagsEscritaOperacionalV27A, config: ConfiguracaoTesteOperacionalV27A): Promise<ResultadoOperacionalV27A>;
  executarAprovarCompraV27A(emailOuLogin: string, flags: FlagsEscritaOperacionalV27A, config: ConfiguracaoTesteOperacionalV27A): Promise<ResultadoOperacionalV27A>;
  executarCriarPedidoCompraV27A(emailOuLogin: string, flags: FlagsEscritaOperacionalV27A, config: ConfiguracaoTesteOperacionalV27A): Promise<ResultadoOperacionalV27A>;
  executarVincularNotaFiscalV27A(emailOuLogin: string, flags: FlagsEscritaOperacionalV27A, config: ConfiguracaoTesteOperacionalV27A): Promise<ResultadoOperacionalV27A>;
  executarProgramarPagamentoV27A(emailOuLogin: string, flags: FlagsEscritaOperacionalV27A, config: ConfiguracaoTesteOperacionalV27A): Promise<ResultadoOperacionalV27A>;
  executarAdministracaoV29C(input: ExecucaoAdministrativaV29CInput): Promise<ResultadoAdministrativoV29C>;
}
