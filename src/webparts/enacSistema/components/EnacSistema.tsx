import * as React from 'react';
import {
  ConfiguracaoTesteOperacionalV27A,
  IDiagnosticoReadonlyEnac,
  FlagsEscritaOperacionalV27A,
  IAlcadaEnac,
  IHistoricoConfiguracaoEnac,
  IObraEnac,
  IRequisicaoResumoEnac,
  ISolicitacaoEnac,
  IUsuarioPerfilEnac,
  MarcadorTesteEscritaEnac,
  OrigemDadosEnac,
  PerfilEnac,
  PreValidacaoOperacionalV27AResultado,
  PreValidacaoTesteControladoSnapshotResultado,
  ResultadoOperacionalV27A,
  SnapshotCriacaoTesteResultado,
  StatusProcesso
} from '../models';
import { SharePointEnacRepository } from '../services/SharePointEnacRepository';
import styles from './EnacSistema.module.scss';

const CONFIRMACAO_ESCRITA_TESTE_V26A = 'TESTAR-ESCRITA-V2.6A-ENAC';

export interface IEnacSistemaProps {
  currentUserName: string;
  currentUserEmail?: string;
  currentUserPerfil: PerfilEnac;
  origemDados?: OrigemDadosEnac;
  diagnosticoReadonly?: boolean;
  repository?: SharePointEnacRepository;
  siteUrl?: string;
  escritaTesteHabilitada?: boolean;
  modoEscritaTeste?: boolean;
  confirmacaoEscritaTeste?: string;
  escritaTesteRequisicaoItemId?: number;
  escritaTesteValorAnalisado?: number;
  escritaTesteMarcador?: MarcadorTesteEscritaEnac;
  flagsEscritaOperacionalV27A?: FlagsEscritaOperacionalV27A;
  configuracaoTesteOperacionalV27A?: ConfiguracaoTesteOperacionalV27A;
}

const obras: IObraEnac[] = [
  { id: '1', nome: 'Obra Alpha', codigoObra: 'OBR-001', cliente: 'Cliente Alpha', centroCusto: 'CC-1101', enderecoEntrega: 'Canteiro Alpha - Portaria 2' },
  { id: '2', nome: 'Retrofit Galpao Sul', codigoObra: 'OBR-014', cliente: 'Industria Sul', centroCusto: 'CC-2214', enderecoEntrega: 'Galpao Sul - Docas' }
];

const formatCurrency = (value: number | undefined): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));

const alcadasIniciais: IAlcadaEnac[] = [
  { id: '1', regraInternaId: 'ALC-COMPRA-GUSTAVO-0001', processo: 'Compra', tipoSolicitacao: 'Todos', obra: 'Todas', valorMinimo: 0, valorMaximo: 20000, ilimitado: false, aprovadorPrincipalId: 'usr-gustavo', aprovadorPrincipalNome: 'Gustavo', aprovadorPrincipalEmail: 'gustavo@example.invalid', exigeAprovacaoAdicional: false, vigenciaInicial: '2026-06-02', ativa: true, observacoes: 'Parametro inicial editavel.' },
  { id: '2', regraInternaId: 'ALC-COMPRA-LEON-0001', processo: 'Compra', tipoSolicitacao: 'Todos', obra: 'Todas', valorMinimo: 20000.01, ilimitado: true, aprovadorPrincipalId: 'usr-leon', aprovadorPrincipalNome: 'Leon', aprovadorPrincipalEmail: 'leon@example.invalid', exigeAprovacaoAdicional: false, vigenciaInicial: '2026-06-02', ativa: true, observacoes: 'Parametro inicial editavel.' },
  { id: '3', regraInternaId: 'ALC-LIB-BANCARIA-LEON-0001', processo: 'LiberacaoBancaria', tipoSolicitacao: 'Todos', obra: 'Todas', valorMinimo: 0, ilimitado: true, aprovadorPrincipalId: 'usr-leon', aprovadorPrincipalNome: 'Leon', aprovadorPrincipalEmail: 'leon@example.invalid', exigeAprovacaoAdicional: false, vigenciaInicial: '2026-06-02', ativa: true, observacoes: 'Liberacao bancaria exclusiva de Leon.' }
];

const usuarios: IUsuarioPerfilEnac[] = [
  { id: 'usr-leon', usuarioInternoId: 'USR-LEON-0001', nome: 'Leon', emailCorporativo: 'leon@example.invalid', contaMicrosoft365Id: 1, contaMicrosoft365Nome: 'Leon', contaMicrosoft365Email: 'leon@example.invalid', cargoFuncao: 'Diretor', perfilPrincipal: 'Diretoria', perfisAdicionais: ['AdministradorSistema'], podeCriarSolicitacao: false, podeRegistrarCotacoes: false, podeAprovarCompras: true, podeEmitirPedido: false, podeVincularNf: false, podeProgramarPagamento: false, podeLiberarPagamento: true, podeAtualizarStatusFinal: true, podeAdministrarConfiguracoes: true, usuarioAtivo: true },
  { id: 'usr-gustavo', usuarioInternoId: 'USR-GUSTAVO-0001', nome: 'Gustavo', emailCorporativo: 'gustavo@example.invalid', contaMicrosoft365Id: 2, contaMicrosoft365Nome: 'Gustavo', contaMicrosoft365Email: 'gustavo@example.invalid', cargoFuncao: 'Planejamento', perfilPrincipal: 'Planejamento', perfisAdicionais: [], podeCriarSolicitacao: false, podeRegistrarCotacoes: false, podeAprovarCompras: true, podeEmitirPedido: false, podeVincularNf: false, podeProgramarPagamento: false, podeLiberarPagamento: false, podeAtualizarStatusFinal: false, podeAdministrarConfiguracoes: false, usuarioAtivo: true },
  { id: 'usr-matheus', usuarioInternoId: 'USR-MATHEUS-0001', nome: 'Matheus', emailCorporativo: 'matheus@example.invalid', contaMicrosoft365Id: 3, contaMicrosoft365Nome: 'Matheus', contaMicrosoft365Email: 'matheus@example.invalid', cargoFuncao: 'Compras e financeiro operacional', perfilPrincipal: 'ComprasFinanceiroOperacional', perfisAdicionais: [], podeCriarSolicitacao: false, podeRegistrarCotacoes: false, podeAprovarCompras: false, podeEmitirPedido: true, podeVincularNf: true, podeProgramarPagamento: true, podeLiberarPagamento: false, podeAtualizarStatusFinal: false, podeAdministrarConfiguracoes: false, usuarioAtivo: true },
  { id: 'usr-kemilly', usuarioInternoId: 'USR-KEMILLY-0001', nome: 'Kemilly', emailCorporativo: 'kemilly@example.invalid', contaMicrosoft365Id: 4, contaMicrosoft365Nome: 'Kemilly', contaMicrosoft365Email: 'kemilly@example.invalid', cargoFuncao: 'Cotacoes e contratos', perfilPrincipal: 'CotacoesContratos', perfisAdicionais: [], podeCriarSolicitacao: false, podeRegistrarCotacoes: true, podeAprovarCompras: false, podeEmitirPedido: false, podeVincularNf: false, podeProgramarPagamento: false, podeLiberarPagamento: false, podeAtualizarStatusFinal: false, podeAdministrarConfiguracoes: false, usuarioAtivo: true },
  { id: 'usr-campo', usuarioInternoId: 'USR-CAMPO-0001', nome: 'Engenheiro Teste', emailCorporativo: 'campo@example.invalid', contaMicrosoft365Id: 5, contaMicrosoft365Nome: 'Engenheiro Teste', contaMicrosoft365Email: 'campo@example.invalid', cargoFuncao: 'Engenheiro de campo', perfilPrincipal: 'Campo', perfisAdicionais: [], podeCriarSolicitacao: true, podeRegistrarCotacoes: false, podeAprovarCompras: false, podeEmitirPedido: false, podeVincularNf: false, podeProgramarPagamento: false, podeLiberarPagamento: false, podeAtualizarStatusFinal: false, podeAdministrarConfiguracoes: false, usuarioAtivo: true }
];

const historicoConfiguracoes: IHistoricoConfiguracaoEnac[] = [
  { tipoConfiguracao: 'Alcada', valorAnterior: 'Configuracao inicial', valorNovo: 'Compra ate R$ 20.000,00 com Gustavo; acima com Leon', usuarioAlteracao: 'Leon', dataHora: new Date().toISOString(), justificativa: 'Parametro beta editavel do MVP' }
];

const initialSolicitacoes: ISolicitacaoEnac[] = [
  {
    id: 'REQ-1001',
    titulo: 'Concreto usinado para bloco A',
    obra: obras[0],
    tipo: 'Material',
    descricao: 'Volume complementar para concretagem da fundacao.',
    especificacaoTecnica: 'FCK 30 MPa, slump 12 +/- 2, bombeavel.',
    quantidade: 18,
    unidade: 'm3',
    frenteServico: 'Fundacao bloco A',
    dataNecessaria: '2026-06-07',
    prioridade: 'Alta',
    justificativaUrgencia: 'Janela de concretagem confirmada.',
    solicitante: 'Engenheiro de Campo',
    dataHoraSolicitacao: new Date().toISOString(),
    status: 'AguardandoAprovacao',
    cotacao: {
      propostas: [
        { fornecedor: 'Fornecedor Concreto Base', valor: 12400, prazoEntrega: '2026-06-06', frete: 'CIF incluso', condicaoPagamento: '28 dias boleto', anexoProposta: 'proposta-base.pdf' },
        { fornecedor: 'Concreto Rapido', valor: 13100, prazoEntrega: '2026-06-07', frete: 'CIF incluso', condicaoPagamento: '21 dias boleto', anexoProposta: 'proposta-rapido.pdf' },
        { fornecedor: 'Mix Forte', valor: 12850, prazoEntrega: '2026-06-06', frete: 'R$ 450,00', condicaoPagamento: '30 dias boleto', anexoProposta: 'proposta-mix.pdf' }
      ],
      fornecedorRecomendado: 'Fornecedor Concreto Base',
      valorRecomendado: 12400,
      prazoRecomendado: '2026-06-06',
      condicaoPagamentoRecomendada: '28 dias boleto',
      justificativaRecomendacao: 'Menor valor total com prazo compativel.'
    },
    aprovadorExigido: 'Gustavo',
    divergencias: [],
    historico: [
      { data: new Date().toISOString(), autor: 'Engenheiro de Campo', perfil: 'Campo', descricao: 'Solicitacao criada', statusNovo: 'SolicitacaoCriada' },
      { data: new Date().toISOString(), autor: 'Kemilly', perfil: 'CotacoesContratos', descricao: 'Cotacoes registradas e fornecedor recomendado', statusNovo: 'AguardandoAprovacao' }
    ]
  }
];

export function EnacSistema(props: IEnacSistemaProps): JSX.Element {
  const [perfil, setPerfil] = React.useState<PerfilEnac>(props.currentUserPerfil || 'Campo');
  const [view, setView] = React.useState('dashboard');
  const [solicitacoes, setSolicitacoes] = React.useState<ISolicitacaoEnac[]>(initialSolicitacoes);
  const [alcadas] = React.useState<IAlcadaEnac[]>(alcadasIniciais);
  const [selectedId, setSelectedId] = React.useState(initialSolicitacoes[0].id);
  const [usuariosPerfisReadonly, setUsuariosPerfisReadonly] = React.useState<IUsuarioPerfilEnac[]>([]);
  const [alcadasReadonly, setAlcadasReadonly] = React.useState<IAlcadaEnac[]>([]);
  const [requisicoesResumoReadonly, setRequisicoesResumoReadonly] = React.useState<IRequisicaoResumoEnac[]>([]);
  const [historicoConfiguracoesReadonly, setHistoricoConfiguracoesReadonly] = React.useState<IHistoricoConfiguracaoEnac[]>([]);
  const [diagnosticoReadonlyState, setDiagnosticoReadonlyState] = React.useState<IDiagnosticoReadonlyEnac | null>(null);
  const [origemDadosEfetiva, setOrigemDadosEfetiva] = React.useState<OrigemDadosEnac>('local');
  const [carregandoReadonly, setCarregandoReadonly] = React.useState<boolean>(false);
  const [erroReadonly, setErroReadonly] = React.useState<string | null>(null);
  const [resultadoEscritaTeste, setResultadoEscritaTeste] = React.useState<SnapshotCriacaoTesteResultado | null>(null);
  const [preValidacaoEscritaTeste, setPreValidacaoEscritaTeste] = React.useState<PreValidacaoTesteControladoSnapshotResultado | null>(null);
  const [erroPreValidacaoEscritaTeste, setErroPreValidacaoEscritaTeste] = React.useState<string | null>(null);
  const [confirmacaoFinalEscritaTeste, setConfirmacaoFinalEscritaTeste] = React.useState<string>('');
  const [executandoEscritaTeste, setExecutandoEscritaTeste] = React.useState<boolean>(false);
  const [preValidacaoOperacionalV27A, setPreValidacaoOperacionalV27A] = React.useState<PreValidacaoOperacionalV27AResultado | null>(null);
  const [erroOperacionalV27A, setErroOperacionalV27A] = React.useState<string | null>(null);
  const [confirmacaoFinalOperacionalV27A, setConfirmacaoFinalOperacionalV27A] = React.useState<string>('');
  const [resultadoOperacionalV27A, setResultadoOperacionalV27A] = React.useState<ResultadoOperacionalV27A | null>(null);
  const [executandoOperacionalV27A, setExecutandoOperacionalV27A] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (props.origemDados !== 'sharepoint' || !props.repository) {
      setOrigemDadosEfetiva('local');
      setCarregandoReadonly(false);
      return;
    }

    let disposed = false;
    setCarregandoReadonly(true);
    setErroReadonly(null);

    const carregarReadonly = async (): Promise<void> => {
      const erros: string[] = [];
      let usuariosPerfis: IUsuarioPerfilEnac[] = [];
      let alcadasSharePoint: IAlcadaEnac[] = [];
      let requisicoesResumo: IRequisicaoResumoEnac[] = [];
      let historicoSharePoint: IHistoricoConfiguracaoEnac[] = [];
      let diagnostico: IDiagnosticoReadonlyEnac | null = null;

      try {
        usuariosPerfis = await props.repository!.listarUsuariosPerfis();
      } catch (error) {
        erros.push(`usuarios: ${error instanceof Error ? error.message : String(error)}`);
      }

      try {
        alcadasSharePoint = await props.repository!.listarAlcadas();
      } catch (error) {
        erros.push(`alcadas: ${error instanceof Error ? error.message : String(error)}`);
      }

      try {
        requisicoesResumo = await props.repository!.listarRequisicoesResumo();
      } catch (error) {
        erros.push(`requisicoes: ${error instanceof Error ? error.message : String(error)}`);
      }

      try {
        diagnostico = await props.repository!.obterDiagnosticoReadonly();
      } catch (error) {
        erros.push(`diagnostico: ${error instanceof Error ? error.message : String(error)}`);
      }

      try {
        historicoSharePoint = await props.repository!.listarHistoricoConfiguracoes();
      } catch (error) {
        if (DEBUG && props.diagnosticoReadonly) {
          console.warn('[ENAC][V2.5A] Historico readonly indisponivel; fallback local mantido', error instanceof Error ? error.message : String(error));
        }
      }

      if (erros.length > 0) {
        throw new Error(erros.join(' | '));
      }

      if (!diagnostico) {
        throw new Error('Diagnostico readonly nao retornado.');
      }

      if (disposed) {
        return;
      }

      setUsuariosPerfisReadonly(usuariosPerfis);
      setAlcadasReadonly(alcadasSharePoint);
      setRequisicoesResumoReadonly(requisicoesResumo);
      setHistoricoConfiguracoesReadonly(historicoSharePoint);
      setDiagnosticoReadonlyState(diagnostico);
      setOrigemDadosEfetiva('sharepoint');

      if (DEBUG && props.diagnosticoReadonly) {
        console.info('[ENAC][V2.5A] Dados readonly SharePoint disponiveis para interface', {
          fonteCards: 'sharepoint',
          usuariosPerfis: usuariosPerfis.length,
          alcadas: alcadasSharePoint.length,
          requisicoesResumo: requisicoesResumo.length,
          historicoConfiguracoes: historicoSharePoint.length,
          diagnostico
        });
      }

      setCarregandoReadonly(false);
    };

    carregarReadonly()
      .catch((error: Error) => {
        if (disposed) {
          return;
        }

        setUsuariosPerfisReadonly([]);
        setAlcadasReadonly([]);
        setRequisicoesResumoReadonly([]);
        setHistoricoConfiguracoesReadonly([]);
        setDiagnosticoReadonlyState(null);
        setOrigemDadosEfetiva('local');
        setErroReadonly(error.message);

        if (DEBUG && props.diagnosticoReadonly) {
          console.warn('[ENAC][V2.4F] Falha no consumo readonly SharePoint; fallback local mantido', error.message);
        }

        setCarregandoReadonly(false);
      });

    return () => {
      disposed = true;
    };
  }, [props.diagnosticoReadonly, props.origemDados, props.repository]);

  React.useEffect(() => {
    if (!DEBUG || !props.diagnosticoReadonly) {
      return;
    }

    console.info('[ENAC][V2.4C] Estado readonly interno', {
      origemDadosEfetiva,
      carregandoReadonly,
      erroReadonly,
      usuariosPerfis: usuariosPerfisReadonly.length,
      alcadas: alcadasReadonly.length,
      requisicoesResumo: requisicoesResumoReadonly.length,
      historicoConfiguracoes: historicoConfiguracoesReadonly.length,
      diagnosticoReadonly: diagnosticoReadonlyState
    });
  }, [
    alcadasReadonly.length,
    carregandoReadonly,
    diagnosticoReadonlyState,
    erroReadonly,
    historicoConfiguracoesReadonly.length,
    origemDadosEfetiva,
    props.diagnosticoReadonly,
    requisicoesResumoReadonly.length,
    usuariosPerfisReadonly.length
  ]);

  const selected = solicitacoes.find((item) => item.id === selectedId) || solicitacoes[0];
  const usandoSharePointReadonly = origemDadosEfetiva === 'sharepoint';
  const usuariosParaAdmin = usandoSharePointReadonly ? usuariosPerfisReadonly : usuarios;
  const alcadasParaAdmin = usandoSharePointReadonly ? alcadasReadonly : alcadas;
  const historicoParaAdmin = usandoSharePointReadonly && historicoConfiguracoesReadonly.length > 0 ? historicoConfiguracoesReadonly : historicoConfiguracoes;
  const escritaTesteConfigurada = Boolean(
    props.escritaTesteHabilitada &&
    props.modoEscritaTeste &&
    props.confirmacaoEscritaTeste === CONFIRMACAO_ESCRITA_TESTE_V26A &&
    props.escritaTesteRequisicaoItemId &&
    props.escritaTesteValorAnalisado &&
    props.escritaTesteMarcador
  );

  React.useEffect(() => {
    if (!props.repository || origemDadosEfetiva !== 'sharepoint' || !escritaTesteConfigurada) {
      setPreValidacaoEscritaTeste(null);
      setErroPreValidacaoEscritaTeste(null);
      return;
    }

    let disposed = false;
    setErroPreValidacaoEscritaTeste(null);

    props.repository.preValidarTesteControladoSnapshot({
      requisicaoItemId: props.escritaTesteRequisicaoItemId!,
      valorAnalisado: props.escritaTesteValorAnalisado!,
      tipoSolicitacao: 'Material',
      marcadorTeste: props.escritaTesteMarcador!,
      modoEscritaTeste: props.modoEscritaTeste === true,
      confirmacao: props.confirmacaoEscritaTeste!,
      idempotenteValidarExistente: true
    })
      .then((resultado) => {
        if (!disposed) {
          setPreValidacaoEscritaTeste(resultado);
        }
      })
      .catch((error: Error) => {
        if (!disposed) {
          setPreValidacaoEscritaTeste(null);
          setErroPreValidacaoEscritaTeste(error.message);
        }
      });

    return () => {
      disposed = true;
    };
  }, [
    escritaTesteConfigurada,
    origemDadosEfetiva,
    props.confirmacaoEscritaTeste,
    props.escritaTesteMarcador,
    props.escritaTesteRequisicaoItemId,
    props.escritaTesteValorAnalisado,
    props.modoEscritaTeste,
    props.repository
  ]);

  React.useEffect(() => {
    if (!props.repository || origemDadosEfetiva !== 'sharepoint' || !props.currentUserEmail || !props.flagsEscritaOperacionalV27A?.habilitarEscritaOperacionalV27A || !props.configuracaoTesteOperacionalV27A) {
      setPreValidacaoOperacionalV27A(null);
      setErroOperacionalV27A(null);
      return;
    }

    let disposed = false;
    setErroOperacionalV27A(null);

    props.repository.preValidarEscritaOperacionalRestritaV27A(
      props.currentUserEmail,
      props.flagsEscritaOperacionalV27A,
      props.configuracaoTesteOperacionalV27A
    )
      .then((resultado) => {
        if (!disposed) {
          setPreValidacaoOperacionalV27A(resultado);
        }
      })
      .catch((error: Error) => {
        if (!disposed) {
          setPreValidacaoOperacionalV27A(null);
          setErroOperacionalV27A(error.message);
        }
      });

    return () => {
      disposed = true;
    };
  }, [
    origemDadosEfetiva,
    props.configuracaoTesteOperacionalV27A,
    props.currentUserEmail,
    props.flagsEscritaOperacionalV27A,
    props.repository
  ]);

  async function executarEscritaTesteSnapshot(): Promise<void> {
    if (!props.repository || origemDadosEfetiva !== 'sharepoint' || !escritaTesteConfigurada) {
      setResultadoEscritaTeste({
        sucesso: false,
        bloqueado: true,
        status: 'Bloqueada',
        mensagem: 'Teste de escrita V2.6A bloqueado: configuracao, repository ou origem SharePoint ausente.',
        requisicaoItemId: props.escritaTesteRequisicaoItemId || 0,
        alertas: [{ codigo: 'CONFIGURACAO_INCOMPLETA', mensagem: 'A escrita de teste nao esta habilitada para esta pagina.' }]
      });
      return;
    }

    if (confirmacaoFinalEscritaTeste !== CONFIRMACAO_ESCRITA_TESTE_V26A || !preValidacaoEscritaTeste?.sucesso || preValidacaoEscritaTeste.bloqueado) {
      setResultadoEscritaTeste({
        sucesso: false,
        bloqueado: true,
        status: 'Bloqueada',
        mensagem: 'Teste de escrita V2.6A bloqueado: pre-validacao readonly ou confirmacao final pendente.',
        requisicaoItemId: props.escritaTesteRequisicaoItemId || 0,
        alertas: [{ codigo: 'PRE_VALIDACAO_OU_CONFIRMACAO_PENDENTE', mensagem: 'Revise o resumo readonly e digite a confirmacao final exigida.' }]
      });
      return;
    }

    setExecutandoEscritaTeste(true);
    try {
      const resultado = await props.repository.executarTesteControladoSnapshot({
        requisicaoItemId: props.escritaTesteRequisicaoItemId!,
        valorAnalisado: props.escritaTesteValorAnalisado!,
        tipoSolicitacao: 'Material',
        marcadorTeste: props.escritaTesteMarcador!,
        modoEscritaTeste: props.modoEscritaTeste === true,
        confirmacao: props.confirmacaoEscritaTeste!,
        idempotenteValidarExistente: true
      });
      setResultadoEscritaTeste(resultado);
    } catch (error) {
      setResultadoEscritaTeste({
        sucesso: false,
        bloqueado: true,
        status: 'Erro',
        mensagem: error instanceof Error ? error.message : String(error),
        requisicaoItemId: props.escritaTesteRequisicaoItemId || 0,
        alertas: [{ codigo: 'ERRO_INTERFACE_TESTE', mensagem: error instanceof Error ? error.message : String(error) }]
      });
    } finally {
      setExecutandoEscritaTeste(false);
    }
  }

  async function executarOperacionalV27A(): Promise<void> {
    const flags = props.flagsEscritaOperacionalV27A;
    const config = props.configuracaoTesteOperacionalV27A;
    const itemId = config?.itemTesteOperacionalIdV27A || 0;

    if (!props.repository || origemDadosEfetiva !== 'sharepoint' || !props.currentUserEmail || !flags || !config || !preValidacaoOperacionalV27A?.podeExecutar) {
      setResultadoOperacionalV27A({
        sucesso: false,
        bloqueado: true,
        acao: config?.acaoTesteOperacionalV27A || 'AtualizarStatusRequisicao',
        mensagem: 'Escrita V2.7A bloqueada: pre-validacao especifica do item ausente ou reprovada.',
        itemId,
        alertas: [{ codigo: 'PRE_VALIDACAO_ESPECIFICA_OBRIGATORIA', mensagem: 'Execute e aprove a pre-validacao especifica do item antes da escrita.' }]
      });
      return;
    }

    if (
      confirmacaoFinalOperacionalV27A !== flags.confirmacaoManualV27A ||
      preValidacaoOperacionalV27A.itemTesteId !== itemId ||
      !preValidacaoOperacionalV27A.marcadorEncontrado
    ) {
      setResultadoOperacionalV27A({
        sucesso: false,
        bloqueado: true,
        acao: config.acaoTesteOperacionalV27A,
        mensagem: 'Escrita V2.7A bloqueada: confirmacao final, item ou marcador divergente.',
        itemId,
        alertas: [{ codigo: 'CONFIRMACAO_ITEM_OU_MARCADOR_DIVERGENTE', mensagem: 'A confirmacao final deve bater com a configuracao e o item validado.' }]
      });
      return;
    }

    setExecutandoOperacionalV27A(true);
    try {
      const resultado = config.acaoTesteOperacionalV27A === 'CriarSnapshotAprovacaoOperacional'
        ? await props.repository.criarSnapshotAprovacaoOperacional({
          requisicaoItemId: itemId,
          valorAnalisado: config.valorTesteOperacionalV27A || 6720,
          tipoSolicitacao: 'Material',
          marcadorTeste: flags.marcadorTesteOperacionalV27A
        }, props.currentUserEmail, flags)
        : await props.repository.atualizarRequisicaoCompraControlada(itemId, {
          statusNovo: config.statusDestinoTesteOperacionalV27A || 'Aguardando aprovação',
          observacao: config.observacaoTesteOperacionalV27A || 'V2.7A-TESTE - teste operacional restrito',
          marcadorTeste: flags.marcadorTesteOperacionalV27A
        }, config.acaoTesteOperacionalV27A, props.currentUserEmail, flags);

      setResultadoOperacionalV27A(resultado);
    } catch (error) {
      setResultadoOperacionalV27A({
        sucesso: false,
        bloqueado: true,
        acao: config.acaoTesteOperacionalV27A,
        mensagem: error instanceof Error ? error.message : String(error),
        itemId,
        alertas: [{ codigo: 'ERRO_ESCRITA_OPERACIONAL_V27A', mensagem: error instanceof Error ? error.message : String(error) }]
      });
    } finally {
      setExecutandoOperacionalV27A(false);
    }
  }

  function criarSolicitacao(form: FormData): void {
    const obra = obras.find((item) => item.id === String(form.get('obra'))) || obras[0];
    const next: ISolicitacaoEnac = {
      id: `REQ-${1001 + solicitacoes.length}`,
      titulo: String(form.get('titulo')),
      obra,
      tipo: String(form.get('tipo')) as ISolicitacaoEnac['tipo'],
      descricao: String(form.get('descricao')),
      especificacaoTecnica: String(form.get('especificacaoTecnica')),
      quantidade: Number(form.get('quantidade') || 0),
      unidade: String(form.get('unidade') || ''),
      frenteServico: String(form.get('frenteServico')),
      dataNecessaria: String(form.get('dataNecessaria')),
      prioridade: String(form.get('prioridade')) as ISolicitacaoEnac['prioridade'],
      justificativaUrgencia: String(form.get('justificativaUrgencia') || ''),
      anexoReferencia: String(form.get('anexoReferencia') || ''),
      observacoes: String(form.get('observacoes') || ''),
      solicitante: props.currentUserName,
      dataHoraSolicitacao: new Date().toISOString(),
      status: 'AguardandoCotacao',
      divergencias: [],
      historico: [
        { data: new Date().toISOString(), autor: props.currentUserName, perfil: 'Campo', descricao: 'Solicitacao criada', statusNovo: 'SolicitacaoCriada' },
        { data: new Date().toISOString(), autor: 'Sistema', perfil: 'Sistema', descricao: `Enviada para cotacao com obra ${obra.codigoObra} / ${obra.centroCusto}`, statusNovo: 'AguardandoCotacao' }
      ]
    };

    setSolicitacoes([next, ...solicitacoes]);
    setSelectedId(next.id);
    setView('minhas');
  }

  function registrarCotacao(id: string, valor: number, fornecedor: string): void {
    const regra = calcularRegra(alcadas, valor);
    const aprovador = usuarios.find((usuario) => usuario.id === regra.aprovadorPrincipalId);
    setSolicitacoes(solicitacoes.map((item) => item.id === id ? {
      ...item,
      status: 'AguardandoAprovacao',
      aprovadorExigido: aprovador?.nome || regra.aprovadorPrincipalNome,
      cotacao: {
        propostas: [{ fornecedor, valor, prazoEntrega: item.dataNecessaria, frete: 'A confirmar', condicaoPagamento: 'A confirmar' }],
        fornecedorRecomendado: fornecedor,
        valorRecomendado: valor,
        prazoRecomendado: item.dataNecessaria,
        condicaoPagamentoRecomendada: 'A confirmar',
        justificativaRecomendacao: 'Recomendacao inicial registrada no MVP.'
      },
      snapshotAprovacaoCompra: {
        regraAlcadaUtilizada: regra.regraInternaId,
        processo: regra.processo,
        faixaValorVigente: `${regra.valorMinimo} ate ${regra.ilimitado ? 'ilimitado' : regra.valorMaximo}`,
        valorAnalisado: valor,
        aprovadorBaseId: regra.aprovadorPrincipalId,
        aprovadorBaseNome: aprovador?.nome || regra.aprovadorPrincipalNome || '',
        aprovadorBaseEmail: aprovador?.emailCorporativo || regra.aprovadorPrincipalEmail || '',
        aprovadorEfetivoId: regra.aprovadorPrincipalId,
        aprovadorEfetivoNome: aprovador?.nome || regra.aprovadorPrincipalNome || '',
        aprovadorEfetivoEmail: aprovador?.emailCorporativo || regra.aprovadorPrincipalEmail || '',
        substituicaoAplicada: false,
        motivoResolucaoAprovador: 'Sem substituicao temporaria vigente.',
        dataHoraAplicacao: new Date().toISOString()
      },
      historico: [...item.historico, { data: new Date().toISOString(), autor: 'Kemilly', perfil: 'CotacoesContratos', descricao: 'Cotacao registrada e enviada para aprovacao', statusNovo: 'AguardandoAprovacao' }]
    } : item));
  }

  function aprovar(id: string): void {
    setSolicitacoes(solicitacoes.map((item) => item.id === id ? {
      ...item,
      status: 'AprovadaParaCompra',
      aprovadoPor: perfil === 'Planejamento' ? 'Gustavo' : 'Leon',
      historico: [...item.historico, { data: new Date().toISOString(), autor: perfil === 'Planejamento' ? 'Gustavo' : 'Leon', perfil, descricao: 'Compra aprovada conforme alcada parametrizada', statusNovo: 'AprovadaParaCompra' }]
    } : item));
  }

  function emitirPedido(id: string, numeroPedido: string): void {
    setSolicitacoes(solicitacoes.map((item) => item.id === id ? {
      ...item,
      status: 'PedidoEmitido',
      pedidoCompra: { numeroPedido, prazoEntregaConfirmado: item.cotacao?.prazoRecomendado || item.dataNecessaria, enderecoEntrega: item.obra.enderecoEntrega || '', observacoes: 'Pedido emitido no MVP.' },
      historico: [...item.historico, { data: new Date().toISOString(), autor: 'Matheus', perfil: 'ComprasFinanceiroOperacional', descricao: 'Pedido de compra emitido', statusNovo: 'PedidoEmitido' }]
    } : item));
  }

  function programarPagamento(id: string): void {
    setSolicitacoes(solicitacoes.map((item) => item.id === id ? {
      ...item,
      status: 'AguardandoLiberacaoBancaria',
      notaFiscal: { numero: 'NF-0001', dataEmissao: new Date().toISOString().slice(0, 10), dataVencimento: item.dataNecessaria, valorBruto: item.cotacao?.valorRecomendado || 0, retencoesDescontos: 0, valorLiquido: item.cotacao?.valorRecomendado || 0 },
      programacaoBancaria: { bancoContaPagamento: 'Banco principal', formaPagamento: 'Boleto', dataProgramada: item.dataNecessaria, valorProgramado: item.cotacao?.valorRecomendado || 0 },
      historico: [...item.historico, { data: new Date().toISOString(), autor: 'Matheus', perfil: 'ComprasFinanceiroOperacional', descricao: 'NF vinculada e pagamento programado no banco', statusNovo: 'AguardandoLiberacaoBancaria' }]
    } : item));
  }

  function concluirPagamento(id: string): void {
    setSolicitacoes(solicitacoes.map((item) => item.id === id ? {
      ...item,
      status: 'PagoConcluido',
      historico: [...item.historico, { data: new Date().toISOString(), autor: 'Leon', perfil: 'Diretoria', descricao: 'Pagamento liberado, confirmado e status final atualizado', statusNovo: 'PagoConcluido' }]
    } : item));
  }

  return (
    <section className={styles.enacSistema}>
      <aside>
        <strong>ENAC</strong>
        {['dashboard', 'nova', 'minhas', 'cotacoes', 'aprovacoes', 'pedido', 'financeiro', 'liberacao', 'historico', 'adminUsuarios', 'adminAlcadas', 'adminHistorico'].map((key) => (
          <button key={key} className={view === key ? styles.active : ''} onClick={() => setView(key)}>{key}</button>
        ))}
      </aside>
      <main>
        <header>
          <h1>Sistema Operacional ENAC</h1>
          <select value={perfil} onChange={(event) => setPerfil(event.target.value as PerfilEnac)}>
            <option value="Campo">Campo / Engenheiro</option>
            <option value="CotacoesContratos">Cotacoes e Contratos / Kemilly</option>
            <option value="ComprasFinanceiroOperacional">Compras e Financeiro Operacional / Matheus</option>
            <option value="Planejamento">Planejamento / Gustavo</option>
            <option value="Diretoria">Diretoria / Leon</option>
            <option value="AdministradorSistema">Administrador do Sistema / Leon</option>
          </select>
        </header>

        {view === 'dashboard' && <Dashboard perfil={perfil} solicitacoes={solicitacoes} requisicoesResumo={usandoSharePointReadonly ? requisicoesResumoReadonly : []} origemDados={origemDadosEfetiva} />}
        {view === 'nova' && <NovaSolicitacao onSubmit={criarSolicitacao} />}
        {view === 'minhas' && <Tabela solicitacoes={solicitacoes} onSelect={(id) => { setSelectedId(id); setView('historico'); }} />}
        {view === 'cotacoes' && <Cotacoes solicitacoes={solicitacoes} onSelect={setSelectedId} selected={selected} onRegistrarCotacao={registrarCotacao} />}
        {view === 'aprovacoes' && <Aprovacoes solicitacoes={solicitacoes} perfil={perfil} onApprove={aprovar} />}
        {view === 'pedido' && <Pedido selected={selected} onEmitirPedido={emitirPedido} />}
        {view === 'financeiro' && <Financeiro selected={selected} onProgramarPagamento={programarPagamento} />}
        {view === 'liberacao' && <Liberacao solicitacoes={solicitacoes} onConcluir={concluirPagamento} />}
        {view === 'historico' && <Historico selected={selected} />}
        {view === 'adminUsuarios' && <AdminUsuarios usuarios={usuariosParaAdmin} origemDados={origemDadosEfetiva} />}
        {view === 'adminAlcadas' && <Alcadas alcadas={alcadasParaAdmin} origemDados={origemDadosEfetiva} />}
        {view === 'adminHistorico' && (
          <>
            <AdminHistorico historico={historicoParaAdmin} origemDados={origemDadosEfetiva} />
            {perfil === 'AdministradorSistema' && escritaTesteConfigurada && (
              <TesteEscritaSnapshot
                disabled={executandoEscritaTeste || confirmacaoFinalEscritaTeste !== CONFIRMACAO_ESCRITA_TESTE_V26A || !preValidacaoEscritaTeste?.sucesso || preValidacaoEscritaTeste.bloqueado}
                preValidacao={preValidacaoEscritaTeste}
                erroPreValidacao={erroPreValidacaoEscritaTeste}
                confirmacaoFinal={confirmacaoFinalEscritaTeste}
                resultado={resultadoEscritaTeste}
                onConfirmacaoFinalChange={setConfirmacaoFinalEscritaTeste}
                onExecutar={executarEscritaTesteSnapshot}
              />
            )}
            {perfil === 'AdministradorSistema' && props.flagsEscritaOperacionalV27A?.habilitarEscritaOperacionalV27A && (
              <PainelOperacionalV27A
                flags={props.flagsEscritaOperacionalV27A}
                config={props.configuracaoTesteOperacionalV27A}
                preValidacao={preValidacaoOperacionalV27A}
                erro={erroOperacionalV27A}
                confirmacaoFinal={confirmacaoFinalOperacionalV27A}
                resultado={resultadoOperacionalV27A}
                executando={executandoOperacionalV27A}
                onConfirmacaoFinalChange={setConfirmacaoFinalOperacionalV27A}
                onExecutar={executarOperacionalV27A}
              />
            )}
          </>
        )}
      </main>
    </section>
  );
}

function Dashboard({ perfil, solicitacoes, requisicoesResumo, origemDados }: { perfil: PerfilEnac; solicitacoes: ISolicitacaoEnac[]; requisicoesResumo: IRequisicaoResumoEnac[]; origemDados: OrigemDadosEnac }): JSX.Element {
  const cards = cardsDashboard(perfil, solicitacoes, requisicoesResumo, origemDados);
  return <div className={styles.metrics}>{cards.map((card) => <div key={card.label}><span>{card.label}</span><strong>{card.value}</strong></div>)}</div>;
}

function cardsDashboard(perfil: PerfilEnac, solicitacoes: ISolicitacaoEnac[], requisicoesResumo: IRequisicaoResumoEnac[], origemDados: OrigemDadosEnac): { label: string; value: string | number }[] {
  if (origemDados === 'sharepoint') {
    return [
      { label: 'Solicitacoes ativas', value: requisicoesResumo.length },
      { label: 'Aguardando cotacao', value: countResumoStatus(requisicoesResumo, ['AguardandoCotacao', 'Aguardando cotacao', 'Aguardando cotação']) },
      { label: 'Aguardando aprovacao', value: countResumoStatus(requisicoesResumo, ['AguardandoAprovacao', 'Aguardando aprovacao', 'Aguardando aprovação']) }
    ];
  }

  if (perfil === 'CotacoesContratos') return [
    { label: 'Aguardando cotacao', value: countStatus(solicitacoes, 'AguardandoCotacao') },
    { label: 'Em cotacao', value: countStatus(solicitacoes, 'EmCotacao') },
    { label: 'Pendentes de justificativa', value: solicitacoes.filter((item) => (item.cotacao?.propostas.length || 0) < 3).length }
  ];
  if (perfil === 'ComprasFinanceiroOperacional') return [
    { label: 'Aguardando pedido', value: countStatus(solicitacoes, 'AprovadaParaCompra') },
    { label: 'Pedidos aguardando NF', value: countStatus(solicitacoes, 'PedidoEmitido') },
    { label: 'Aguardando liberacao', value: countStatus(solicitacoes, 'AguardandoLiberacaoBancaria') }
  ];
  if (perfil === 'Diretoria') return [
    { label: 'Aprovacoes Leon', value: solicitacoes.filter((item) => item.aprovadorExigido === 'Leon').length },
    { label: 'Divergencias', value: countStatus(solicitacoes, 'DivergenciaIdentificada') },
    { label: 'Liberacao bancaria', value: countStatus(solicitacoes, 'AguardandoLiberacaoBancaria') }
  ];
  return [
    { label: 'Solicitacoes ativas', value: solicitacoes.length },
    { label: 'Aguardando cotacao', value: countStatus(solicitacoes, 'AguardandoCotacao') },
    { label: 'Aguardando aprovacao', value: countStatus(solicitacoes, 'AguardandoAprovacao') }
  ];
}

function countStatus(solicitacoes: ISolicitacaoEnac[], status: StatusProcesso): number {
  return solicitacoes.filter((item) => item.status === status).length;
}

function countResumoStatus(requisicoes: IRequisicaoResumoEnac[], statusAliases: string[]): number {
  return requisicoes.filter((item) => statusAliases.some((status) => normalizarStatusReadonly(item.status) === normalizarStatusReadonly(status))).length;
}

function normalizarStatusReadonly(value: string | undefined): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

function NovaSolicitacao({ onSubmit }: { onSubmit: (form: FormData) => void }): JSX.Element {
  return (
    <form onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget)); }}>
      <label>Obra<select name="obra">{obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.nome}</option>)}</select></label>
      <label>Tipo<select name="tipo"><option value="Material">Material</option><option value="Servico">Servico</option><option value="Locacao">Locacao</option><option value="Equipamento">Equipamento</option></select></label>
      <label>Descricao do item/servico<input name="titulo" required /></label>
      <label>Descricao complementar<textarea name="descricao" required /></label>
      <label>Especificacao tecnica<textarea name="especificacaoTecnica" required /></label>
      <label>Quantidade<input name="quantidade" type="number" step="0.01" /></label>
      <label>Unidade<input name="unidade" /></label>
      <label>Frente de servico/local<input name="frenteServico" required /></label>
      <label>Data necessaria<input name="dataNecessaria" type="date" required /></label>
      <label>Prioridade<select name="prioridade"><option>Normal</option><option>Alta</option><option>Emergencial</option></select></label>
      <label>Justificativa de urgencia<textarea name="justificativaUrgencia" /></label>
      <label>Anexo/foto/projeto/referencia<input name="anexoReferencia" /></label>
      <label>Observacoes<textarea name="observacoes" /></label>
      <button type="submit">Enviar para cotacao</button>
    </form>
  );
}

function Cotacoes({ solicitacoes, selected, onSelect, onRegistrarCotacao }: { solicitacoes: ISolicitacaoEnac[]; selected: ISolicitacaoEnac; onSelect: (id: string) => void; onRegistrarCotacao: (id: string, valor: number, fornecedor: string) => void }): JSX.Element {
  return (
    <div className={styles.split}>
      <Tabela solicitacoes={solicitacoes.filter((item) => item.status === 'AguardandoCotacao' || item.status === 'EmCotacao')} onSelect={onSelect} />
      <form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); onRegistrarCotacao(selected.id, Number(form.get('valor')), String(form.get('fornecedor'))); }}>
        <h2>Cotacao por Kemilly</h2>
        <p>{selected.id} - {selected.titulo}</p>
        <label>Fornecedor recomendado<input name="fornecedor" defaultValue={selected.cotacao?.fornecedorRecomendado} required /></label>
        <label>Valor recomendado<input name="valor" type="number" step="0.01" defaultValue={selected.cotacao?.valorRecomendado || 0} required /></label>
        <label>Justificativa<textarea name="justificativa" defaultValue={selected.cotacao?.justificativaRecomendacao} /></label>
        <button type="submit">Enviar para aprovacao</button>
      </form>
    </div>
  );
}

function Aprovacoes({ solicitacoes, perfil, onApprove }: { solicitacoes: ISolicitacaoEnac[]; perfil: PerfilEnac; onApprove: (id: string) => void }): JSX.Element {
  const aprovador = perfil === 'Planejamento' ? 'Gustavo' : perfil === 'Diretoria' ? 'Leon' : '';
  return (
    <>
      <h2>Aprovacoes Pendentes</h2>
      {solicitacoes.filter((item) => item.status === 'AguardandoAprovacao' && (!aprovador || item.aprovadorExigido === aprovador)).map((item) => (
        <div className={styles.row} key={item.id}>
          <span>{item.id} - {item.titulo}<br />{item.snapshotAprovacaoCompra?.faixaValorVigente}</span>
          <strong>{formatCurrency(item.cotacao?.valorRecomendado)}</strong>
          <button onClick={() => onApprove(item.id)}>Aprovar</button>
        </div>
      ))}
    </>
  );
}

function Pedido({ selected, onEmitirPedido }: { selected: ISolicitacaoEnac; onEmitirPedido: (id: string, numeroPedido: string) => void }): JSX.Element {
  return (
    <form onSubmit={(event) => { event.preventDefault(); onEmitirPedido(selected.id, String(new FormData(event.currentTarget).get('numeroPedido'))); }}>
      <h2>Pedido de Compra por Matheus</h2>
      <p>{selected.id} - {selected.titulo}</p>
      <p>Fornecedor aprovado: {selected.cotacao?.fornecedorRecomendado || '-'}</p>
        <p>Valor aprovado: {formatCurrency(selected.cotacao?.valorRecomendado)}</p>
      <label>Numero do pedido<input name="numeroPedido" defaultValue={selected.pedidoCompra?.numeroPedido} required /></label>
      <button type="submit">Emitir pedido</button>
    </form>
  );
}

function Financeiro({ selected, onProgramarPagamento }: { selected: ISolicitacaoEnac; onProgramarPagamento: (id: string) => void }): JSX.Element {
  return (
    <form onSubmit={(event) => { event.preventDefault(); onProgramarPagamento(selected.id); }}>
      <h2>NF e Programacao Bancaria por Matheus</h2>
      <p>{selected.id} - {selected.titulo}</p>
      <label>Numero da NF<input /></label>
      <label>Boleto ou dados de pagamento<input /></label>
      <label>Data programada<input type="date" /></label>
      <button type="submit">Programar pagamento no banco</button>
    </form>
  );
}

function Liberacao({ solicitacoes, onConcluir }: { solicitacoes: ISolicitacaoEnac[]; onConcluir: (id: string) => void }): JSX.Element {
  return (
    <>
      <h2>Liberacao Bancaria por Leon</h2>
      {solicitacoes.filter((item) => item.status === 'AguardandoLiberacaoBancaria').map((item) => (
        <div className={styles.row} key={item.id}>
          <span>{item.id} - {item.titulo}<br />{item.programacaoBancaria?.dataProgramada}</span>
          <strong>{formatCurrency(item.programacaoBancaria?.valorProgramado)}</strong>
          <button onClick={() => onConcluir(item.id)}>Liberar e concluir</button>
        </div>
      ))}
    </>
  );
}

function AdminUsuarios({ usuarios: usuariosExibidos, origemDados }: { usuarios: IUsuarioPerfilEnac[]; origemDados: OrigemDadosEnac }): JSX.Element {
  return (
    <>
      <p>Fonte: {origemDados === 'sharepoint' ? 'SharePoint readonly' : 'Fallback local'}</p>
      <table>
        <thead><tr><th>Nome</th><th>Usuario interno</th><th>Perfil</th><th>Cargo/Função</th><th>Status</th></tr></thead>
        <tbody>
          {usuariosExibidos.map((usuario) => (
            <tr key={usuario.usuarioInternoId || usuario.id}>
              <td>{usuario.nome}</td>
              <td>{usuario.usuarioInternoId}</td>
              <td>{usuario.perfilPrincipal}</td>
              <td>{usuario.cargoFuncao || '-'}</td>
              <td>{usuario.usuarioAtivo ? 'Ativo' : 'Inativo'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function AdminHistorico({ historico, origemDados }: { historico: IHistoricoConfiguracaoEnac[]; origemDados: OrigemDadosEnac }): JSX.Element {
  return (
    <>
      <p>Fonte: {origemDados === 'sharepoint' && historico.length > 0 ? 'SharePoint readonly' : 'Fallback local'}</p>
      <table>
        <thead><tr><th>Configuracao</th><th>Anterior</th><th>Novo</th><th>Usuario</th><th>Justificativa</th></tr></thead>
        <tbody>
          {historico.map((item, index) => (
            <tr key={`${item.tipoConfiguracao}-${item.dataHora}-${index}`}><td>{item.tipoConfiguracao}</td><td>{item.valorAnterior}</td><td>{item.valorNovo}</td><td>{item.usuarioAlteracao}</td><td>{item.justificativa}</td></tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function TesteEscritaSnapshot({
  disabled,
  preValidacao,
  erroPreValidacao,
  confirmacaoFinal,
  resultado,
  onConfirmacaoFinalChange,
  onExecutar
}: {
  disabled: boolean;
  preValidacao: PreValidacaoTesteControladoSnapshotResultado | null;
  erroPreValidacao: string | null;
  confirmacaoFinal: string;
  resultado: SnapshotCriacaoTesteResultado | null;
  onConfirmacaoFinalChange: (value: string) => void;
  onExecutar: () => void;
}): JSX.Element {
  return (
    <div className={styles.row}>
      <strong>Teste controlado V2.6A - criar snapshot de teste</strong>
      <span>Disponivel apenas com configuracao explicita de teste e confirmacao administrativa.</span>
      {erroPreValidacao && <span>Pre-validacao: {erroPreValidacao}</span>}
      {preValidacao && (
        <span>
          Pre-validacao: {preValidacao.status} - {preValidacao.mensagem}<br />
          Item: {preValidacao.requisicaoItemId} / {preValidacao.marcadorEncontrado || '-'}<br />
          Valor: {formatCurrency(preValidacao.valorAnalisado)}<br />
          Regra: {preValidacao.regraInternaId || '-'}<br />
          Aprovador base/efetivo: {preValidacao.aprovadorBaseNome || '-'} / {preValidacao.aprovadorEfetivoNome || '-'}<br />
          Acoes previstas: snapshot {preValidacao.criaraSnapshot ? 'sim' : 'nao'}, vinculo {preValidacao.vincularaSnapshotAprovacaoCompra ? 'sim' : 'nao'}, historico {preValidacao.registraraHistorico ? 'sim' : 'nao'}
        </span>
      )}
      <label>Confirmacao final<input value={confirmacaoFinal} onChange={(event) => onConfirmacaoFinalChange(event.currentTarget.value)} /></label>
      <button disabled={disabled} onClick={onExecutar}>Teste controlado V2.6A - criar snapshot de teste</button>
      {resultado && <span>{resultado.status}: {resultado.mensagem}</span>}
    </div>
  );
}

function PainelOperacionalV27A({
  flags,
  config,
  preValidacao,
  erro,
  confirmacaoFinal,
  resultado,
  executando,
  onConfirmacaoFinalChange,
  onExecutar
}: {
  flags: FlagsEscritaOperacionalV27A;
  config?: ConfiguracaoTesteOperacionalV27A;
  preValidacao: PreValidacaoOperacionalV27AResultado | null;
  erro: string | null;
  confirmacaoFinal: string;
  resultado: ResultadoOperacionalV27A | null;
  executando: boolean;
  onConfirmacaoFinalChange: (value: string) => void;
  onExecutar: () => void;
}): JSX.Element {
  const itemConfigurado = config?.itemTesteOperacionalIdV27A || 0;
  const podeExibirBotao = Boolean(
    preValidacao?.podeExecutar &&
    preValidacao.itemTesteId === itemConfigurado &&
    preValidacao.marcadorEncontrado &&
    confirmacaoFinal === flags.confirmacaoManualV27A
  );

  return (
    <div className={styles.row}>
      <strong>V2.7A - pre-validacao especifica do item</strong>
      <span>
        Status das travas: escrita {flags.habilitarEscritaOperacionalV27A ? 'habilitada' : 'desabilitada'},
        modo teste {flags.modoTesteOperacionalV27A ? 'ativo' : 'inativo'},
        somente itens {flags.marcadorTesteOperacionalV27A}.
      </span>
      <span>
        Item configurado: {itemConfigurado || '-'}<br />
        Acao pretendida: {config?.acaoTesteOperacionalV27A || '-'}<br />
        Status destino: {config?.statusDestinoTesteOperacionalV27A || '-'}
      </span>
      {erro && <span>Pre-validacao: {erro}</span>}
      {preValidacao && (
        <span>
          Pre-validacao: {preValidacao.bloqueado ? 'bloqueada' : 'liberada'} - {preValidacao.mensagem}<br />
          Usuario: {preValidacao.usuarioAtual?.nome || '-'} / {preValidacao.usuarioAtual?.perfilPrincipal || '-'}<br />
          Leitura: {preValidacao.listaConsulta || '-'} / {preValidacao.modoAcessoLista || '-'} / item {preValidacao.itemIdSolicitado || '-'} / HTTP {preValidacao.statusHttpLeitura || '-'}<br />
          Erro leitura: {preValidacao.erroLeituraItem || '-'}<br />
          Item lido: {preValidacao.itemEncontrado ? preValidacao.itemTesteId : '-'} / marcador {preValidacao.marcadorEncontrado ? 'confirmado' : 'nao confirmado'}<br />
          Campos com marcador: {preValidacao.camposComMarcador && preValidacao.camposComMarcador.length > 0 ? preValidacao.camposComMarcador.join(', ') : '-'}<br />
          Valores de marcador: {preValidacao.valoresCamposMarcador && preValidacao.valoresCamposMarcador.length > 0 ? preValidacao.valoresCamposMarcador.join(' | ') : '-'}<br />
          Campos retornados: {preValidacao.camposRetornados && preValidacao.camposRetornados.length > 0 ? preValidacao.camposRetornados.join(', ') : '-'}<br />
          Status: {preValidacao.statusAtual || '-'} {'->'} {preValidacao.statusDestino || '-'}<br />
          Transicao: {preValidacao.transicaoPermitida ? 'permitida' : 'bloqueada'} / campos {preValidacao.camposObrigatoriosPresentes ? 'presentes' : 'pendentes'}<br />
          Lista/campo: {preValidacao.listaAlterada || '-'} / {preValidacao.campoAlterado || '-'}<br />
          Valor previsto: {preValidacao.valorAnteriorPrevisto || '-'} {'->'} {preValidacao.valorNovoPrevisto || '-'}<br />
          Historico previsto: {preValidacao.historicoPrevisto || '-'}<br />
          Acoes permitidas: {preValidacao.acoesPermitidas.length > 0 ? preValidacao.acoesPermitidas.join(', ') : '-'}<br />
          Pode executar: {preValidacao.podeExecutar ? 'sim' : 'nao'}<br />
          Alertas: {preValidacao.alertas.length > 0 ? preValidacao.alertas.map((alerta) => alerta.codigo).join(', ') : '-'}
        </span>
      )}
      <label>Confirmacao final<input value={confirmacaoFinal} onChange={(event) => onConfirmacaoFinalChange(event.currentTarget.value)} /></label>
      {podeExibirBotao && (
        <button disabled={executando} onClick={onExecutar}>Executar escrita V2.7A no item validado</button>
      )}
      {!podeExibirBotao && <span>Botao de escrita oculto ate a pre-validacao especifica do item aprovar e a confirmacao final bater exatamente.</span>}
      {resultado && <span>{resultado.bloqueado ? 'Bloqueada' : 'Executada'}: {resultado.mensagem}</span>}
    </div>
  );
}

function Alcadas({ alcadas, origemDados }: { alcadas: IAlcadaEnac[]; origemDados: OrigemDadosEnac }): JSX.Element {
  return (
    <>
      <p>Fonte: {origemDados === 'sharepoint' ? 'SharePoint readonly' : 'Fallback local'}</p>
      <table>
        <thead><tr><th>Regra</th><th>Processo</th><th>Tipo</th><th>Faixa</th><th>Aprovador</th><th>Status</th></tr></thead>
        <tbody>
          {alcadas.map((item) => (
            <tr key={item.id}>
              <td>{item.regraInternaId || item.id}</td>
              <td>{item.processo}</td>
              <td>{item.tipoSolicitacao}</td>
              <td>{formatCurrency(item.valorMinimo)}<br />{item.ilimitado ? 'Ilimitado' : formatCurrency(item.valorMaximo)}</td>
              <td>{item.aprovadorPrincipalNome || item.aprovadorPrincipalId || '-'}</td>
              <td>{item.ativa ? 'Ativa' : 'Inativa'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function Historico({ selected }: { selected: ISolicitacaoEnac }): JSX.Element {
  return (
    <>
      <h2>Historico do Processo</h2>
      <p>{selected.id} - {selected.titulo}</p>
      {selected.historico.map((evento, index) => (
        <div className={styles.row} key={index}>
          <strong>{evento.descricao}</strong>
          <span>{evento.autor} - {evento.statusNovo}</span>
        </div>
      ))}
    </>
  );
}

function Tabela({ solicitacoes, onSelect }: { solicitacoes: ISolicitacaoEnac[]; onSelect: (id: string) => void }): JSX.Element {
  return (
    <table>
      <thead><tr><th>Processo</th><th>Obra</th><th>Status</th><th>Valor</th><th /></tr></thead>
      <tbody>
        {solicitacoes.map((item) => (
          <tr key={item.id}>
            <td>{item.id}<br />{item.titulo}</td>
            <td>{item.obra.nome}<br />{item.obra.centroCusto}</td>
            <td>{item.status}</td>
            <td>{formatCurrency(item.cotacao?.valorRecomendado)}</td>
            <td><button onClick={() => onSelect(item.id)}>Abrir</button></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function calcularRegra(alcadas: IAlcadaEnac[], valor: number): IAlcadaEnac {
  return alcadas.find((item) => item.processo === 'Compra' && item.ativa && valor >= item.valorMinimo && (item.ilimitado || !item.valorMaximo || valor <= item.valorMaximo)) || alcadas[0];
}
