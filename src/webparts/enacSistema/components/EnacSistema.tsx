import * as React from 'react';
import {
  AcaoAdministrativaV29C,
  AlcadaAdministrativaV29CPayload,
  ConfiguracaoAdministrativaV29B,
  ConfiguracaoTesteOperacionalV27A,
  IDiagnosticoReadonlyEnac,
  FlagsEscritaAdministrativaV29B,
  FlagsEscritaAdministrativaV29C,
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
  PreValidacaoAdministrativaV29BResultado,
  PreValidacaoAdministrativaV29CResultado,
  PreValidacaoOperacionalV27AResultado,
  PreValidacaoTesteControladoSnapshotResultado,
  ResultadoAdministrativoV29C,
  ResultadoOperacionalV27A,
  SnapshotCriacaoTesteResultado,
  StatusProcesso,
  UsuarioAdministrativoV29CPayload
} from '../models';
import { SharePointEnacRepository } from '../services/SharePointEnacRepository';
import styles from './EnacSistema.module.scss';

const CONFIRMACAO_ESCRITA_TESTE_V26A = 'TESTAR-ESCRITA-V2.6A-ENAC';
const enacLogo = require('../assets/enac-logo.png');
const views = [
  { key: 'dashboard', label: 'Visão geral' },
  { key: 'nova', label: 'Nova solicitação' },
  { key: 'minhas', label: 'Requisições' },
  { key: 'cotacoes', label: 'Cotações' },
  { key: 'aprovacoes', label: 'Aprovações' },
  { key: 'pedido', label: 'Pedidos' },
  { key: 'financeiro', label: 'Notas e pagamentos' },
  { key: 'liberacao', label: 'Liberação' },
  { key: 'historico', label: 'Histórico' },
  { key: 'adminUsuarios', label: 'Usuários' },
  { key: 'adminPerfis', label: 'Perfis' },
  { key: 'adminAlcadas', label: 'Alçadas' },
  { key: 'adminHistorico', label: 'Auditoria' }
];

const adminViewKeys = ['adminUsuarios', 'adminPerfis', 'adminAlcadas', 'adminHistorico'];
const perfilOptions: PerfilEnac[] = ['Campo', 'CotacoesContratos', 'ComprasFinanceiroOperacional', 'Planejamento', 'Diretoria', 'AdministradorSistema', 'ConsultaLeitura'];
const perfilLabels: Record<PerfilEnac, string> = {
  Campo: 'Campo / Engenharia',
  CotacoesContratos: 'Cotações e Contratos',
  ComprasFinanceiroOperacional: 'Compras / Financeiro',
  Planejamento: 'Planejamento / Aprovação',
  Diretoria: 'Diretoria',
  AdministradorSistema: 'Administrador do Sistema',
  ConsultaLeitura: 'Consulta / Leitura'
};
const perfilChoiceSharePoint: Record<PerfilEnac, string> = {
  Campo: 'Campo / Engenheiro',
  CotacoesContratos: 'Cotações e Contratos',
  ComprasFinanceiroOperacional: 'Compras e Financeiro Operacional',
  Planejamento: 'Planejamento',
  Diretoria: 'Diretoria',
  AdministradorSistema: 'Administrador do Sistema',
  ConsultaLeitura: 'Consulta / Leitura'
};
const CONFIRMACAO_ADMINISTRATIVA_V29B = 'CONFIRMAR-ESCRITA-ADMINISTRATIVA-V2.9B-ENAC';
const CONFIRMACAO_ADMINISTRATIVA_V29C = 'CONFIRMAR-ESCRITA-ADMINISTRATIVA-V2.9C-ENAC';
const MARCADOR_ADMINISTRATIVO_V29C = 'V2.9C-ADMIN-TESTE';

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
  flagsEscritaAdministrativaV29B?: FlagsEscritaAdministrativaV29B;
  configuracaoAdministrativaV29B?: ConfiguracaoAdministrativaV29B;
  flagsEscritaAdministrativaV29C?: FlagsEscritaAdministrativaV29C;
}

const obras: IObraEnac[] = [
  { id: '1', nome: 'Obra Alpha', codigoObra: 'OBR-001', cliente: 'Cliente Alpha', centroCusto: 'CC-1101', enderecoEntrega: 'Canteiro Alpha - Portaria 2' },
  { id: '2', nome: 'Retrofit Galpao Sul', codigoObra: 'OBR-014', cliente: 'Industria Sul', centroCusto: 'CC-2214', enderecoEntrega: 'Galpao Sul - Docas' }
];

const formatCurrency = (value: number | undefined): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));

const formatDisplayName = (value: string | undefined): string =>
  String(value || '-')
    .replace(/^V2\.3B-TESTE\s*-\s*/i, '')
    .replace(/^usr-/i, '')
    .trim() || '-';

const formatUserInternalId = (value: string | undefined): string => {
  const cleaned = formatDisplayName(value).replace(/^USR-/i, '');
  return cleaned === '-' ? '-' : cleaned;
};

const normalizeIdentity = (value: string | undefined): string =>
  String(value || '').trim().toLowerCase();

const getPerfisAutorizados = (usuario: IUsuarioPerfilEnac | undefined, fallback: PerfilEnac): PerfilEnac[] => {
  if (!usuario || !usuario.usuarioAtivo) {
    return [fallback];
  }

  const perfis = [
    usuario.perfilPrincipal,
    ...(usuario.perfisAdicionais || []),
    ...(usuario.podeAdministrarConfiguracoes ? ['AdministradorSistema' as PerfilEnac] : [])
  ]
    .filter((item, index, array) => array.indexOf(item) === index);

  return perfis.length > 0 ? perfis : [fallback];
};

const findUsuarioAtual = (
  candidatos: IUsuarioPerfilEnac[],
  currentUserEmail: string | undefined,
  currentUserName: string | undefined,
  fallbackPerfil: PerfilEnac,
  allowFallbackByPerfil: boolean
): IUsuarioPerfilEnac | undefined => {
  const email = normalizeIdentity(currentUserEmail);
  const name = normalizeIdentity(currentUserName);

  const byEmail = candidatos.find((usuario) => {
    const emails = [
      usuario.emailCorporativo,
      usuario.contaMicrosoft365Email,
      usuario.contaMicrosoft365Login
    ].map(normalizeIdentity);

    return email.length > 0 && emails.indexOf(email) >= 0;
  });

  if (byEmail) {
    return byEmail;
  }

  const byName = candidatos.find((usuario) => name.length > 0 && normalizeIdentity(usuario.nome) === name);
  if (byName) {
    return byName;
  }

  if (allowFallbackByPerfil) {
    return candidatos.find((usuario) => usuario.perfilPrincipal === fallbackPerfil && usuario.usuarioAtivo) || candidatos[0];
  }

  return undefined;
};

const isValidEmail = (value: string | undefined): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

const buildPreValidacaoAdministrativaV29B = (
  flags: FlagsEscritaAdministrativaV29B | undefined,
  config: ConfiguracaoAdministrativaV29B | undefined,
  usuarioAtual: IUsuarioPerfilEnac | undefined,
  perfilAdministradorAtivo: boolean,
  usuariosExistentes: IUsuarioPerfilEnac[],
  alcadasExistentes: IAlcadaEnac[]
): PreValidacaoAdministrativaV29BResultado => {
  const acao = config?.acaoAdministrativaV29B || 'CriarUsuarioSistema';
  const alertas: { codigo: string; mensagem: string }[] = [];

  if (!flags?.habilitarEscritaAdministrativaV29B) {
    alertas.push({ codigo: 'ESCRITA_ADMIN_DESABILITADA', mensagem: 'habilitarEscritaAdministrativaV29B esta desligada.' });
  }

  if (!flags?.modoTesteAdministrativoV29B) {
    alertas.push({ codigo: 'MODO_TESTE_ADMIN_DESLIGADO', mensagem: 'modoTesteAdministrativoV29B deve estar ativo para homologacao.' });
  }

  if (flags?.exigirConfirmacaoAdministrativaV29B !== false && flags?.confirmacaoAdministrativaV29B !== CONFIRMACAO_ADMINISTRATIVA_V29B) {
    alertas.push({ codigo: 'CONFIRMACAO_ADMIN_INVALIDA', mensagem: 'Confirmacao administrativa V2.9B nao confere.' });
  }

  if (flags?.marcadorAdministrativoV29B !== 'V2.9B-ADMIN-TESTE') {
    alertas.push({ codigo: 'MARCADOR_ADMIN_INVALIDO', mensagem: 'Marcador administrativo deve ser V2.9B-ADMIN-TESTE.' });
  }

  if (!usuarioAtual || !usuarioAtual.usuarioAtivo || !perfilAdministradorAtivo) {
    alertas.push({ codigo: 'USUARIO_NAO_ADMINISTRADOR', mensagem: 'Acao administrativa exige usuario ativo com perfil Administrador do Sistema.' });
  }

  const observacao = `${flags?.marcadorAdministrativoV29B || 'V2.9B-ADMIN-TESTE'} - ${config?.observacaoAdminTesteV29B || 'pre-validacao administrativa sem escrita real'}`;
  let payloadPrevisto: Record<string, unknown> | undefined;

  if (acao === 'CriarUsuarioSistema' || acao === 'AtualizarUsuarioPerfilStatus') {
    const usuarioInternoId = String(config?.usuarioInternoIdAdminTesteV29B || '').trim();
    const email = String(config?.emailUsuarioAdminTesteV29B || '').trim();
    const perfil = config?.perfilPrincipalAdminTesteV29B || 'Campo';
    const usuarioExistente = config?.usuarioAdminTesteIdV29B
      ? usuariosExistentes.find((item) => Number(item.id) === config.usuarioAdminTesteIdV29B || Number(item.contaMicrosoft365Id) === config.usuarioAdminTesteIdV29B)
      : undefined;

    if (acao === 'CriarUsuarioSistema') {
      if (!config?.nomeUsuarioAdminTesteV29B) alertas.push({ codigo: 'NOME_USUARIO_AUSENTE', mensagem: 'Nome de exibicao e obrigatorio.' });
      if (!usuarioInternoId) alertas.push({ codigo: 'USUARIO_INTERNO_ID_AUSENTE', mensagem: 'UsuarioInternoId e obrigatorio.' });
      if (!config?.contaMicrosoft365IdAdminTesteV29B) alertas.push({ codigo: 'CONTA_M365_ID_AUSENTE', mensagem: 'ContaMicrosoft365Id e obrigatorio.' });
      if (!isValidEmail(email)) alertas.push({ codigo: 'EMAIL_INVALIDO', mensagem: 'Email corporativo deve ser valido.' });
      if (usuariosExistentes.some((item) => normalizeIdentity(item.usuarioInternoId) === normalizeIdentity(usuarioInternoId))) {
        alertas.push({ codigo: 'USUARIO_INTERNO_ID_DUPLICADO', mensagem: `UsuarioInternoId ${usuarioInternoId} ja existe.` });
      }
      if (usuariosExistentes.some((item) => normalizeIdentity(item.emailCorporativo) === normalizeIdentity(email))) {
        alertas.push({ codigo: 'EMAIL_DUPLICADO', mensagem: `Email ${email} ja existe no cadastro.` });
      }
    }

    if (acao === 'AtualizarUsuarioPerfilStatus' && !config?.usuarioAdminTesteIdV29B) {
      alertas.push({ codigo: 'USUARIO_ITEM_ID_AUSENTE', mensagem: 'usuarioAdminTesteIdV29B e obrigatorio para atualizar usuario.' });
    }

    if (acao === 'AtualizarUsuarioPerfilStatus' && config?.usuarioAdminTesteIdV29B && !usuarioExistente) {
      alertas.push({ codigo: 'USUARIO_ITEM_NAO_RESOLVIDO', mensagem: 'Item de usuario informado nao foi resolvido no conjunto carregado.' });
    }

    payloadPrevisto = acao === 'CriarUsuarioSistema'
      ? {
        Title: config?.nomeUsuarioAdminTesteV29B || '',
        UsuarioInternoId: usuarioInternoId,
        ContaMicrosoft365Id: config?.contaMicrosoft365IdAdminTesteV29B,
        EmailCorporativo: email,
        PerfilPrincipal: perfilChoiceSharePoint[perfil],
        PerfisAdicionais: { results: (config?.perfisAdicionaisAdminTesteV29B || []).map((item) => perfilChoiceSharePoint[item]) },
        UsuarioAtivo: config?.usuarioAtivoAdminTesteV29B !== false,
        CargoFuncao: config?.cargoFuncaoAdminTesteV29B || '',
        PodeAdministrarConfiguracoes: perfil === 'AdministradorSistema',
        PodeAprovarCompras: perfil === 'Diretoria' || perfil === 'Planejamento',
        PodeAtualizarStatusFinal: perfil === 'Diretoria',
        PodeCriarSolicitacao: perfil === 'Campo',
        PodeEmitirPedido: perfil === 'ComprasFinanceiroOperacional',
        PodeLiberarPagamento: perfil === 'Diretoria',
        PodeProgramarPagamento: perfil === 'ComprasFinanceiroOperacional',
        PodeRegistrarCotacoes: perfil === 'CotacoesContratos',
        PodeVincularNF: perfil === 'ComprasFinanceiroOperacional',
        Observacoes: observacao
      }
      : {
        PerfilPrincipal: perfilChoiceSharePoint[perfil],
        PerfisAdicionais: { results: (config?.perfisAdicionaisAdminTesteV29B || []).map((item) => perfilChoiceSharePoint[item]) },
        UsuarioAtivo: config?.usuarioAtivoAdminTesteV29B !== false,
        CargoFuncao: config?.cargoFuncaoAdminTesteV29B || '',
        Observacoes: observacao
      };
  }

  if (acao === 'AtualizarAlcadaUsuario') {
    const minimo = config?.valorMinimoAlcadaAdminTesteV29B;
    const maximo = config?.valorMaximoAlcadaAdminTesteV29B;
    const ilimitado = config?.ilimitadoAlcadaAdminTesteV29B === true;
    const aprovador = usuariosExistentes.find((item) => Number(item.id) === config?.aprovadorPrincipalIdAdminTesteV29B);

    if (!config?.tituloAlcadaAdminTesteV29B) alertas.push({ codigo: 'TITULO_ALCADA_AUSENTE', mensagem: 'Title/Regra e obrigatorio.' });
    if (!config?.regraInternaIdAdminTesteV29B) alertas.push({ codigo: 'REGRA_INTERNA_ID_AUSENTE', mensagem: 'RegraInternaId e obrigatorio.' });
    if (minimo === undefined || minimo < 0) alertas.push({ codigo: 'VALOR_MINIMO_INVALIDO', mensagem: 'ValorMinimo deve ser maior ou igual a zero.' });
    if (!ilimitado && (maximo === undefined || maximo < Number(minimo || 0))) alertas.push({ codigo: 'VALOR_MAXIMO_INVALIDO', mensagem: 'ValorMaximo deve ser maior ou igual ao ValorMinimo quando a regra nao for ilimitada.' });
    if (!config?.aprovadorPrincipalIdAdminTesteV29B) alertas.push({ codigo: 'APROVADOR_PRINCIPAL_AUSENTE', mensagem: 'AprovadorPrincipalId e obrigatorio.' });
    if (config?.aprovadorPrincipalIdAdminTesteV29B && !aprovador) alertas.push({ codigo: 'APROVADOR_NAO_RESOLVIDO', mensagem: 'AprovadorPrincipalId nao foi resolvido nos usuarios carregados.' });
    if (aprovador && !aprovador.usuarioAtivo) alertas.push({ codigo: 'APROVADOR_INATIVO', mensagem: 'Usuarios inativos nao podem ser selecionados para novas alcadas.' });
    if (!config?.vigenciaInicialAdminTesteV29B) alertas.push({ codigo: 'VIGENCIA_INICIAL_AUSENTE', mensagem: 'VigenciaInicial e obrigatoria.' });

    const conflito = alcadasExistentes.some((item) =>
      item.ativa &&
      item.processo === 'Compra' &&
      item.tipoSolicitacao === 'Material' &&
      minimo !== undefined &&
      Number(item.valorMinimo) <= (ilimitado ? Number.MAX_SAFE_INTEGER : Number(maximo || 0)) &&
      (item.ilimitado || Number(item.valorMaximo || 0) >= minimo)
    );
    if (conflito) {
      alertas.push({ codigo: 'POSSIVEL_SOBREPOSICAO_ALCADA', mensagem: 'Existe regra ativa potencialmente sobreposta; revisar antes de qualquer escrita.' });
    }

    payloadPrevisto = {
      Title: config?.tituloAlcadaAdminTesteV29B || '',
      RegraInternaId: config?.regraInternaIdAdminTesteV29B || '',
      Processo: config?.processoAlcadaAdminTesteV29B || 'Compra',
      TipoSolicitacao: config?.tipoSolicitacaoAlcadaAdminTesteV29B || 'Material',
      ValorMinimo: minimo,
      ValorMaximo: ilimitado ? undefined : maximo,
      Ilimitado: ilimitado,
      AprovadorPrincipalId: config?.aprovadorPrincipalIdAdminTesteV29B,
      AprovadorAdicionalId: config?.aprovadorAdicionalIdAdminTesteV29B,
      ExigeAprovacaoAdicional: config?.exigeAprovacaoAdicionalAdminTesteV29B === true,
      Ativo: config?.alcadaAtivaAdminTesteV29B !== false,
      VigenciaInicial: config?.vigenciaInicialAdminTesteV29B || '',
      VigenciaFinal: config?.vigenciaFinalAdminTesteV29B || undefined,
      Observacoes: observacao
    };
  }

  const historicoPrevisto = {
    Title: `${flags?.marcadorAdministrativoV29B || 'V2.9B-ADMIN-TESTE'} ${acao}`,
    TipoConfiguracao: acao.indexOf('Alcada') >= 0 ? 'Alcada' : 'UsuarioPerfil',
    AcaoRealizada: acao,
    UsuarioAlteracao: usuarioAtual?.nome || '-',
    ValorAnterior: 'A resolver antes da escrita real',
    ValorNovo: JSON.stringify(payloadPrevisto || {}),
    Justificativa: observacao
  };
  const sucesso = alertas.length === 0;

  return {
    sucesso,
    bloqueado: !sucesso,
    mensagem: sucesso
      ? 'Pre-validacao administrativa concluida. Payload e historico previstos; execucao real deve ocorrer somente em rodada autorizada.'
      : 'Pre-validacao administrativa bloqueada. Nenhuma escrita administrativa deve ser executada.',
    acao,
    usuarioAtual,
    perfilAdministradorAtivo,
    flagsValidas: Boolean(flags?.habilitarEscritaAdministrativaV29B && flags?.modoTesteAdministrativoV29B && flags.confirmacaoAdministrativaV29B === CONFIRMACAO_ADMINISTRATIVA_V29B),
    payloadPrevisto,
    historicoPrevisto,
    alertas
  };
};

const toSharePointPerfis = (perfis: PerfilEnac[]): string[] => perfis.map((item) => perfilChoiceSharePoint[item]);

const parseNumberField = (value: string | undefined): number | undefined => {
  const parsed = Number(String(value || '').replace(',', '.').trim());
  return Number.isFinite(parsed) ? parsed : undefined;
};

const rangesOverlap = (aMin: number, aMax: number | undefined, bMin: number, bMax: number | undefined): boolean => {
  const fimA = aMax === undefined ? Number.POSITIVE_INFINITY : aMax;
  const fimB = bMax === undefined ? Number.POSITIVE_INFINITY : bMax;
  return aMin <= fimB && bMin <= fimA;
};

const isSameSharePointItem = (item: IUsuarioPerfilEnac | undefined, targetId: number | undefined): boolean =>
  Boolean(item && targetId && (Number(item.id) === targetId || String(item.id) === String(targetId)));

const sanitizeEmail = (value: string | undefined): string => {
  const email = String(value || '').trim();
  const parts = email.split('@');
  if (parts.length !== 2) {
    return email ? `${email.substring(0, 2)}***` : '-';
  }

  return `${parts[0].substring(0, 2)}***@${parts[1]}`;
};

const sanitizeM365 = (value: string | number | undefined): string => {
  const raw = String(value || '').trim();
  return raw ? `${raw.substring(0, 3)}***` : '-';
};

const buildPreValidacaoAdministrativaV29C = (
  acao: AcaoAdministrativaV29C,
  flags: FlagsEscritaAdministrativaV29C | undefined,
  usuarioAtual: IUsuarioPerfilEnac | undefined,
  perfilAdministradorAtivo: boolean,
  usuariosExistentes: IUsuarioPerfilEnac[],
  alcadasExistentes: IAlcadaEnac[],
  payloadUsuario: UsuarioAdministrativoV29CPayload | undefined,
  payloadAlcada: AlcadaAdministrativaV29CPayload | undefined,
  justificativa: string
): PreValidacaoAdministrativaV29CResultado => {
  const alertas: { codigo: string; mensagem: string }[] = [];

  if (!flags?.habilitarEscritaAdministrativaV29C) alertas.push({ codigo: 'ESCRITA_ADMIN_V29C_DESABILITADA', mensagem: 'habilitarEscritaAdministrativaV29C esta desligada.' });
  if (!flags?.modoTesteAdministrativoV29C) alertas.push({ codigo: 'MODO_TESTE_ADMIN_V29C_DESLIGADO', mensagem: 'modoTesteAdministrativoV29C deve estar ativo.' });
  if (flags?.exigirConfirmacaoAdministrativaV29C !== false && flags?.confirmacaoAdministrativaV29C !== CONFIRMACAO_ADMINISTRATIVA_V29C) alertas.push({ codigo: 'CONFIRMACAO_ADMIN_V29C_INVALIDA', mensagem: 'Confirmacao administrativa V2.9C nao confere.' });
  if (flags?.marcadorAdministrativoV29C !== MARCADOR_ADMINISTRATIVO_V29C) alertas.push({ codigo: 'MARCADOR_ADMIN_V29C_INVALIDO', mensagem: `Marcador administrativo deve ser ${MARCADOR_ADMINISTRATIVO_V29C}.` });
  if (!usuarioAtual || !usuarioAtual.usuarioAtivo || !perfilAdministradorAtivo) alertas.push({ codigo: 'USUARIO_SEM_ADMINISTRACAO', mensagem: 'Ação exige usuário ativo com perfil Administrador do Sistema selecionado.' });
  if (!justificativa.trim()) alertas.push({ codigo: 'JUSTIFICATIVA_AUSENTE', mensagem: 'Justificativa administrativa e obrigatoria.' });

  let payloadPrevisto: Record<string, unknown> | undefined;
  let itemAlvoId: number | undefined;
  let diagnosticoUsuarioPreValidacao: Record<string, unknown> | undefined;

  if (acao === 'CriarUsuarioSistema' || acao === 'AtualizarUsuarioPerfilStatus') {
    const usuario = payloadUsuario;
    const usuarioExistente = usuario?.itemId ? usuariosExistentes.find((item) => Number(item.id) === usuario.itemId) : undefined;

    if (!usuario) {
      alertas.push({ codigo: 'PAYLOAD_USUARIO_AUSENTE', mensagem: 'Payload de usuario nao foi montado.' });
    } else {
      itemAlvoId = usuario.itemId;
      const duplicadoUsuarioInterno = usuario.usuarioInternoId.trim()
        ? usuariosExistentes.find((item) => normalizeIdentity(item.usuarioInternoId) === normalizeIdentity(usuario.usuarioInternoId))
        : undefined;
      const duplicadoEmail = usuario.emailCorporativo.trim()
        ? usuariosExistentes.find((item) => normalizeIdentity(item.emailCorporativo) === normalizeIdentity(usuario.emailCorporativo))
        : undefined;
      const duplicadoContaM365 = usuario.contaMicrosoft365Id
        ? usuariosExistentes.find((item) => Number(item.contaMicrosoft365Id) === usuario.contaMicrosoft365Id)
        : undefined;
      const duplicidadeProprioItemIgnorada = acao === 'AtualizarUsuarioPerfilStatus' && (
        isSameSharePointItem(duplicadoUsuarioInterno, usuario.itemId) ||
        isSameSharePointItem(duplicadoEmail, usuario.itemId) ||
        isSameSharePointItem(duplicadoContaM365, usuario.itemId)
      );

      if (acao === 'AtualizarUsuarioPerfilStatus' && !usuarioExistente) alertas.push({ codigo: 'USUARIO_ALVO_NAO_RESOLVIDO', mensagem: 'Usuario alvo de edicao nao foi encontrado.' });
      if (acao === 'CriarUsuarioSistema' && duplicadoUsuarioInterno) alertas.push({ codigo: 'USUARIO_INTERNO_ID_DUPLICADO', mensagem: `UsuarioInternoId ${usuario.usuarioInternoId} ja existe.` });
      if (acao === 'CriarUsuarioSistema' && duplicadoEmail) alertas.push({ codigo: 'EMAIL_DUPLICADO', mensagem: `Email ${sanitizeEmail(usuario.emailCorporativo)} ja existe no cadastro.` });
      if (acao === 'CriarUsuarioSistema' && duplicadoContaM365) alertas.push({ codigo: 'CONTA_M365_DUPLICADA', mensagem: `ContaMicrosoft365Id ${sanitizeM365(usuario.contaMicrosoft365Id)} ja esta vinculada.` });
      if (acao === 'AtualizarUsuarioPerfilStatus' && duplicadoUsuarioInterno && !isSameSharePointItem(duplicadoUsuarioInterno, usuario.itemId)) alertas.push({ codigo: 'USUARIO_INTERNO_ID_DUPLICADO', mensagem: 'UsuarioInternoId pertence a outro item.' });
      if (acao === 'AtualizarUsuarioPerfilStatus' && duplicadoEmail && !isSameSharePointItem(duplicadoEmail, usuario.itemId)) alertas.push({ codigo: 'EMAIL_DUPLICADO', mensagem: 'EmailCorporativo pertence a outro item.' });
      if (acao === 'AtualizarUsuarioPerfilStatus' && duplicadoContaM365 && !isSameSharePointItem(duplicadoContaM365, usuario.itemId)) alertas.push({ codigo: 'CONTA_M365_DUPLICADA', mensagem: 'ContaMicrosoft365 pertence a outro item.' });
      if (duplicidadeProprioItemIgnorada) alertas.push({ codigo: 'DUPLICIDADE_PROPRIO_ITEM_IGNORADA', mensagem: 'UsuarioInternoId, EmailCorporativo ou ContaMicrosoft365 encontrados no proprio item alvo; diagnostico nao bloqueante.' });
      if (!usuario.nome.trim()) alertas.push({ codigo: 'NOME_USUARIO_AUSENTE', mensagem: 'Nome completo e obrigatorio.' });
      if (!usuario.usuarioInternoId.trim()) alertas.push({ codigo: 'USUARIO_INTERNO_ID_AUSENTE', mensagem: 'UsuarioInternoId e obrigatorio.' });
      if (!usuario.contaMicrosoft365Id && !usuario.contaMicrosoft365Login?.trim()) alertas.push({ codigo: 'CONTA_M365_AUSENTE', mensagem: 'Informe ContaMicrosoft365Id ou e-mail/login para resolucao controlada.' });
      if (!isValidEmail(usuario.emailCorporativo)) alertas.push({ codigo: 'EMAIL_INVALIDO', mensagem: 'EmailCorporativo deve ser valido.' });
      if (perfilOptions.indexOf(usuario.perfilPrincipal) < 0) alertas.push({ codigo: 'PERFIL_INVALIDO', mensagem: 'PerfilPrincipal invalido.' });
      if (usuario.perfisAdicionais.some((perfilItem) => perfilOptions.indexOf(perfilItem) < 0)) alertas.push({ codigo: 'PERFIS_ADICIONAIS_INVALIDOS', mensagem: 'PerfisAdicionais contem choice invalido.' });
      if (usuario.perfilPrincipal === 'AdministradorSistema') alertas.push({ codigo: 'ALERTA_ADMINISTRADOR_SISTEMA', mensagem: 'Administrador do Sistema exige confirmacao manual forte.' });

      diagnosticoUsuarioPreValidacao = {
        lista: 'ENAC Usuarios Perfis',
        itemAlvoId: usuario.itemId || null,
        itemAlvoNome: usuarioExistente?.nome || usuario.nome,
        perfilAtual: usuarioExistente?.perfilPrincipal || '-',
        statusAtual: usuarioExistente ? (usuarioExistente.usuarioAtivo ? 'Ativo' : 'Inativo') : '-',
        contaMicrosoft365Sanitizada: sanitizeM365(usuario.contaMicrosoft365Id || usuario.contaMicrosoft365Login),
        emailSanitizado: sanitizeEmail(usuario.emailCorporativo),
        contaM365DuplicadaReal: Boolean(duplicadoContaM365 && (acao === 'CriarUsuarioSistema' || !isSameSharePointItem(duplicadoContaM365, usuario.itemId))),
        emailDuplicadoReal: Boolean(duplicadoEmail && (acao === 'CriarUsuarioSistema' || !isSameSharePointItem(duplicadoEmail, usuario.itemId))),
        usuarioInternoIdDuplicadoReal: Boolean(duplicadoUsuarioInterno && (acao === 'CriarUsuarioSistema' || !isSameSharePointItem(duplicadoUsuarioInterno, usuario.itemId))),
        duplicidadeProprioItemIgnorada
      };

      payloadPrevisto = {
        Title: usuario.nome,
        UsuarioInternoId: usuario.usuarioInternoId,
        ContaMicrosoft365Id: usuario.contaMicrosoft365Id || 'resolver via ensureUser',
        EmailCorporativo: usuario.emailCorporativo,
        PerfilPrincipal: perfilChoiceSharePoint[usuario.perfilPrincipal],
        PerfisAdicionais: toSharePointPerfis(usuario.perfisAdicionais),
        UsuarioAtivo: usuario.usuarioAtivo,
        CargoFuncao: usuario.cargoFuncao || '',
        Observacoes: `${MARCADOR_ADMINISTRATIVO_V29C} - ${usuario.observacoes || justificativa}`,
        PodeAdministrarConfiguracoes: usuario.podeAdministrarConfiguracoes,
        PodeAprovarCompras: usuario.podeAprovarCompras,
        PodeAtualizarStatusFinal: usuario.podeAtualizarStatusFinal,
        PodeCriarSolicitacao: usuario.podeCriarSolicitacao,
        PodeEmitirPedido: usuario.podeEmitirPedido,
        PodeLiberarPagamento: usuario.podeLiberarPagamento,
        PodeProgramarPagamento: usuario.podeProgramarPagamento,
        PodeRegistrarCotacoes: usuario.podeRegistrarCotacoes,
        PodeVincularNF: usuario.podeVincularNf
      };
      itemAlvoId = usuario.itemId;
    }
  }

  if (acao === 'AtualizarAlcadaUsuario') {
    const alcada = payloadAlcada;
    const alcadaExistente = alcada?.itemId ? alcadasExistentes.find((item) => Number(item.id) === alcada.itemId) : undefined;

    if (!alcada) {
      alertas.push({ codigo: 'PAYLOAD_ALCADA_AUSENTE', mensagem: 'Payload de alcada nao foi montado.' });
    } else {
      itemAlvoId = alcada.itemId;
      if (alcada.itemId && !alcadaExistente) alertas.push({ codigo: 'ALCADA_ALVO_NAO_RESOLVIDA', mensagem: 'Alcada alvo de edicao nao foi encontrada.' });
      if (!alcada.titulo.trim()) alertas.push({ codigo: 'TITULO_ALCADA_AUSENTE', mensagem: 'Title da alcada e obrigatorio.' });
      if (!alcada.regraInternaId.trim()) alertas.push({ codigo: 'REGRA_INTERNA_ID_AUSENTE', mensagem: 'RegraInternaId e obrigatorio.' });
      if (alcada.valorMinimo < 0) alertas.push({ codigo: 'VALOR_MINIMO_INVALIDO', mensagem: 'ValorMinimo deve ser maior ou igual a zero.' });
      if (!alcada.ilimitado && (alcada.valorMaximo === undefined || alcada.valorMaximo < alcada.valorMinimo)) alertas.push({ codigo: 'VALOR_MAXIMO_INVALIDO', mensagem: 'ValorMaximo deve ser maior ou igual ao ValorMinimo.' });

      const aprovadorPrincipal = usuariosExistentes.find((item) => Number(item.id) === alcada.aprovadorPrincipalId);
      const aprovadorAdicional = alcada.aprovadorAdicionalId ? usuariosExistentes.find((item) => Number(item.id) === alcada.aprovadorAdicionalId) : undefined;
      if (!aprovadorPrincipal || !aprovadorPrincipal.usuarioAtivo) alertas.push({ codigo: 'APROVADOR_PRINCIPAL_INVALIDO', mensagem: 'AprovadorPrincipalId deve existir e estar ativo.' });
      if (alcada.aprovadorAdicionalId && (!aprovadorAdicional || !aprovadorAdicional.usuarioAtivo)) alertas.push({ codigo: 'APROVADOR_ADICIONAL_INVALIDO', mensagem: 'AprovadorAdicionalId deve existir e estar ativo.' });
      if (!alcada.vigenciaInicial.trim()) alertas.push({ codigo: 'VIGENCIA_INICIAL_AUSENTE', mensagem: 'VigenciaInicial e obrigatoria.' });

      const conflito = alcadasExistentes.some((item) =>
        Number(item.id) !== alcada.itemId &&
        item.ativa &&
        item.processo === alcada.processo &&
        (item.tipoSolicitacao || 'Todos') === (alcada.tipoSolicitacao || 'Todos') &&
        String(item.obraId || '') === String(alcada.obraId || '') &&
        rangesOverlap(item.valorMinimo, item.ilimitado ? undefined : item.valorMaximo, alcada.valorMinimo, alcada.ilimitado ? undefined : alcada.valorMaximo)
      );
      if (alcada.ativa && conflito) alertas.push({ codigo: 'CONFLITO_ALCADA_ATIVA', mensagem: 'Existe regra ativa com mesma chave e faixa sobreposta.' });

      payloadPrevisto = {
        Title: alcada.titulo,
        RegraInternaId: alcada.regraInternaId,
        Processo: alcada.processo,
        TipoSolicitacao: alcada.tipoSolicitacao || 'Todos',
        ValorMinimo: alcada.valorMinimo,
        ValorMaximo: alcada.ilimitado ? undefined : alcada.valorMaximo,
        Ilimitado: alcada.ilimitado,
        AprovadorPrincipalId: alcada.aprovadorPrincipalId,
        AprovadorAdicionalId: alcada.aprovadorAdicionalId,
        ExigeAprovacaoAdicional: alcada.exigeAprovacaoAdicional,
        Ativo: alcada.ativa,
        VigenciaInicial: alcada.vigenciaInicial,
        VigenciaFinal: alcada.vigenciaFinal || undefined,
        ObraId: alcada.obraId,
        Observacoes: `${MARCADOR_ADMINISTRATIVO_V29C} - ${alcada.observacoes || justificativa}`
      };
    }
  }

  const bloqueado = alertas.some((alerta) => alerta.codigo !== 'ALERTA_ADMINISTRADOR_SISTEMA' && alerta.codigo !== 'DUPLICIDADE_PROPRIO_ITEM_IGNORADA');

  return {
    sucesso: !bloqueado,
    bloqueado,
    mensagem: bloqueado ? 'Pre-validacao administrativa V2.9C bloqueada.' : 'Pre-validacao administrativa V2.9C concluida; escrita depende da confirmacao final.',
    acao,
    usuarioAtual,
    perfilAdministradorAtivo,
    flagsValidas: Boolean(flags?.habilitarEscritaAdministrativaV29C && flags.modoTesteAdministrativoV29C && flags.confirmacaoAdministrativaV29C === CONFIRMACAO_ADMINISTRATIVA_V29C),
    payloadPrevisto,
    historicoPrevisto: {
      Title: `${MARCADOR_ADMINISTRATIVO_V29C} ${acao}`,
      TipoConfiguracao: acao,
      ValorAnterior: 'Gerado no momento da execucao a partir do item carregado.',
      ValorNovo: JSON.stringify(payloadPrevisto || {}),
      Justificativa: justificativa,
      Resultado: bloqueado ? 'Bloqueado na pre-validacao' : 'Previsto para execucao controlada',
      DiagnosticoPreValidacao: diagnosticoUsuarioPreValidacao
    },
    itemAlvoId,
    alertas
  };
};

type PermissoesUsuarioV29C = Pick<UsuarioAdministrativoV29CPayload,
  'podeAdministrarConfiguracoes' |
  'podeAprovarCompras' |
  'podeAtualizarStatusFinal' |
  'podeCriarSolicitacao' |
  'podeEmitirPedido' |
  'podeLiberarPagamento' |
  'podeProgramarPagamento' |
  'podeRegistrarCotacoes' |
  'podeVincularNf'
>;

const permissoesVaziasV29C: PermissoesUsuarioV29C = {
  podeAdministrarConfiguracoes: false,
  podeAprovarCompras: false,
  podeAtualizarStatusFinal: false,
  podeCriarSolicitacao: false,
  podeEmitirPedido: false,
  podeLiberarPagamento: false,
  podeProgramarPagamento: false,
  podeRegistrarCotacoes: false,
  podeVincularNf: false
};

const permissoesPadraoPorPerfilV29C = (perfil: PerfilEnac): PermissoesUsuarioV29C => ({
  ...permissoesVaziasV29C,
  podeAdministrarConfiguracoes: perfil === 'AdministradorSistema',
  podeAprovarCompras: perfil === 'Diretoria' || perfil === 'Planejamento',
  podeAtualizarStatusFinal: perfil === 'Diretoria',
  podeCriarSolicitacao: perfil === 'Campo',
  podeEmitirPedido: perfil === 'ComprasFinanceiroOperacional',
  podeLiberarPagamento: perfil === 'Diretoria',
  podeProgramarPagamento: perfil === 'ComprasFinanceiroOperacional',
  podeRegistrarCotacoes: perfil === 'CotacoesContratos',
  podeVincularNf: perfil === 'ComprasFinanceiroOperacional'
});

const permissoesDoUsuarioV29C = (usuario: IUsuarioPerfilEnac | undefined, fallbackPerfil: PerfilEnac): PermissoesUsuarioV29C => {
  if (!usuario) {
    return permissoesPadraoPorPerfilV29C(fallbackPerfil);
  }

  return {
    podeAdministrarConfiguracoes: usuario.podeAdministrarConfiguracoes === true,
    podeAprovarCompras: usuario.podeAprovarCompras === true,
    podeAtualizarStatusFinal: usuario.podeAtualizarStatusFinal === true,
    podeCriarSolicitacao: usuario.podeCriarSolicitacao === true,
    podeEmitirPedido: usuario.podeEmitirPedido === true,
    podeLiberarPagamento: usuario.podeLiberarPagamento === true,
    podeProgramarPagamento: usuario.podeProgramarPagamento === true,
    podeRegistrarCotacoes: usuario.podeRegistrarCotacoes === true,
    podeVincularNf: usuario.podeVincularNf === true
  };
};

const permissaoLabelsV29C: Record<keyof PermissoesUsuarioV29C, string> = {
  podeAdministrarConfiguracoes: 'Administrar configurações',
  podeAprovarCompras: 'Aprovar compras',
  podeAtualizarStatusFinal: 'Atualizar status final',
  podeCriarSolicitacao: 'Criar solicitações',
  podeEmitirPedido: 'Emitir pedido',
  podeLiberarPagamento: 'Liberar pagamento',
  podeProgramarPagamento: 'Programar pagamento',
  podeRegistrarCotacoes: 'Registrar cotações',
  podeVincularNf: 'Vincular NF'
};

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
  { id: 'usr-campo', usuarioInternoId: 'USR-CAMPO-0001', nome: 'Engenheiro Teste', emailCorporativo: 'campo@example.invalid', contaMicrosoft365Id: 5, contaMicrosoft365Nome: 'Engenheiro Teste', contaMicrosoft365Email: 'campo@example.invalid', cargoFuncao: 'Engenheiro de campo', perfilPrincipal: 'Campo', perfisAdicionais: [], podeCriarSolicitacao: true, podeRegistrarCotacoes: false, podeAprovarCompras: false, podeEmitirPedido: false, podeVincularNf: false, podeProgramarPagamento: false, podeLiberarPagamento: false, podeAtualizarStatusFinal: false, podeAdministrarConfiguracoes: false, usuarioAtivo: true },
  { id: 'usr-consulta', usuarioInternoId: 'USR-CONSULTA-0001', nome: 'Consulta', emailCorporativo: 'consulta@example.invalid', contaMicrosoft365Id: 6, contaMicrosoft365Nome: 'Consulta', contaMicrosoft365Email: 'consulta@example.invalid', cargoFuncao: 'Consulta / leitura', perfilPrincipal: 'ConsultaLeitura', perfisAdicionais: [], podeCriarSolicitacao: false, podeRegistrarCotacoes: false, podeAprovarCompras: false, podeEmitirPedido: false, podeVincularNf: false, podeProgramarPagamento: false, podeLiberarPagamento: false, podeAtualizarStatusFinal: false, podeAdministrarConfiguracoes: false, usuarioAtivo: true }
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
  const viewportRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    let frameId = 0;

    const updateViewportVars = (): void => {
      const el = viewportRef.current;
      if (!el) {
        return;
      }

      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        el.style.setProperty('--enac-breakout-left', '0px');
        el.style.setProperty('--enac-viewport-width', '100%');

        const rect = el.getBoundingClientRect();
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth || rect.width;
        const measuredLeft = Math.max(0, Math.round(rect.left));
        const safetyGap = 16;
        const safeViewportWidth = Math.max(320, Math.round(viewportWidth - measuredLeft - safetyGap));

        // Keep the webpart anchored inside the SharePoint canvas; shifting left hides the ENAC menu under site navigation.
        el.style.setProperty('--enac-breakout-left', '0px');
        el.style.setProperty('--enac-viewport-width', `${safeViewportWidth}px`);
      });
    };

    updateViewportVars();
    window.addEventListener('resize', updateViewportVars);
    window.addEventListener('orientationchange', updateViewportVars);
    const timerId = window.setTimeout(updateViewportVars, 250);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timerId);
      window.removeEventListener('resize', updateViewportVars);
      window.removeEventListener('orientationchange', updateViewportVars);
    };
  }, []);

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
  const usuarioAtualSistema = findUsuarioAtual(usuariosParaAdmin, props.currentUserEmail, props.currentUserName, props.currentUserPerfil || 'Campo', !usandoSharePointReadonly);
  const usuarioCadastrado = Boolean(usuarioAtualSistema);
  const usuarioAtivo = Boolean(usuarioAtualSistema?.usuarioAtivo);
  const perfisAutorizados = getPerfisAutorizados(usuarioAtualSistema, props.currentUserPerfil || 'Campo');
  const perfilSelecionadoAutorizado = perfisAutorizados.indexOf(perfil) >= 0;
  const perfilAdministradorAtivo = usuarioAtivo && perfil === 'AdministradorSistema' && perfisAutorizados.indexOf('AdministradorSistema') >= 0;
  const acessoOperacionalBloqueado = usandoSharePointReadonly && (!usuarioCadastrado || !usuarioAtivo || !perfilSelecionadoAutorizado);
  const viewsPermitidas = views.filter((item) => adminViewKeys.indexOf(item.key) === -1 || perfilAdministradorAtivo);
  const perfilSelectDesabilitado = acessoOperacionalBloqueado || perfisAutorizados.length <= 1;
  const nomeUsuarioBanner = formatDisplayName(usuarioAtualSistema?.nome || props.currentUserName || 'Usuario nao cadastrado');
  const preValidacaoAdministrativaV29B = props.flagsEscritaAdministrativaV29B?.habilitarEscritaAdministrativaV29B && props.configuracaoAdministrativaV29B
    ? buildPreValidacaoAdministrativaV29B(
      props.flagsEscritaAdministrativaV29B,
      props.configuracaoAdministrativaV29B,
      usuarioAtualSistema,
      perfilAdministradorAtivo,
      usuariosParaAdmin,
      alcadasParaAdmin
    )
    : null;
  const escritaTesteConfigurada = Boolean(
    props.escritaTesteHabilitada &&
    props.modoEscritaTeste &&
    props.confirmacaoEscritaTeste === CONFIRMACAO_ESCRITA_TESTE_V26A &&
    props.escritaTesteRequisicaoItemId &&
    props.escritaTesteValorAnalisado &&
    props.escritaTesteMarcador
  );

  React.useEffect(() => {
    if (perfisAutorizados.length > 0 && perfisAutorizados.indexOf(perfil) === -1) {
      setPerfil(perfisAutorizados[0]);
    }
  }, [perfil, perfisAutorizados.join('|')]);

  React.useEffect(() => {
    if (!perfilAdministradorAtivo && adminViewKeys.indexOf(view) >= 0) {
      setView('dashboard');
    }
  }, [perfilAdministradorAtivo, view]);

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

    if (config.acaoTesteOperacionalV27A === 'AtualizarStatusRequisicao' && (
      preValidacaoOperacionalV27A.acaoPretendida !== 'AtualizarStatusRequisicao' ||
      preValidacaoOperacionalV27A.statusDestino !== (config.statusDestinoTesteOperacionalV27A || 'Aguardando aprovação') ||
      preValidacaoOperacionalV27A.campoAlterado !== 'StatusdaRequisi_x00e7__x00e3_o'
    )) {
      setResultadoOperacionalV27A({
        sucesso: false,
        bloqueado: true,
        acao: config.acaoTesteOperacionalV27A,
        mensagem: 'Escrita V2.7A bloqueada: esta rodada permite apenas atualizar status da requisicao validada.',
        itemId,
        alertas: [{ codigo: 'EXECUCAO_ACAO_NAO_SUPORTADA', mensagem: 'Somente AtualizarStatusRequisicao no campo StatusdaRequisi_x00e7__x00e3_o esta autorizada na V2.7A.2C.' }]
      });
      return;
    }

    if (config.acaoTesteOperacionalV27A === 'CriarSnapshotAprovacaoOperacional' && (
      preValidacaoOperacionalV27A.acaoPretendida !== 'CriarSnapshotAprovacaoOperacional' ||
      preValidacaoOperacionalV27A.campoAlterado !== 'ENAC Snapshots Regras' ||
      preValidacaoOperacionalV27A.snapshotExistenteId ||
      !preValidacaoOperacionalV27A.regraInternaId ||
      !preValidacaoOperacionalV27A.aprovadorBaseNome ||
      !preValidacaoOperacionalV27A.aprovadorEfetivoNome
    )) {
      setResultadoOperacionalV27A({
        sucesso: false,
        bloqueado: true,
        acao: config.acaoTesteOperacionalV27A,
        mensagem: 'Escrita V2.7A bloqueada: snapshot operacional exige pre-validacao especifica completa e item sem snapshot.',
        itemId,
        alertas: [{ codigo: 'EXECUCAO_SNAPSHOT_PREVALIDACAO_INCOMPLETA', mensagem: 'Revise item, snapshot existente, regra e aprovador antes da escrita.' }]
      });
      return;
    }

    if (config.acaoTesteOperacionalV27A === 'AprovarCompra' && (
      preValidacaoOperacionalV27A.acaoPretendida !== 'AprovarCompra' ||
      preValidacaoOperacionalV27A.statusDestino !== (config.statusDestinoTesteOperacionalV27A || 'Aprovada para compra') ||
      preValidacaoOperacionalV27A.campoAlterado !== 'StatusdaRequisi_x00e7__x00e3_o' ||
      !preValidacaoOperacionalV27A.snapshotExistenteId ||
      !preValidacaoOperacionalV27A.regraInternaId ||
      !preValidacaoOperacionalV27A.aprovadorBaseNome ||
      !preValidacaoOperacionalV27A.aprovadorEfetivoNome
    )) {
      setResultadoOperacionalV27A({
        sucesso: false,
        bloqueado: true,
        acao: config.acaoTesteOperacionalV27A,
        mensagem: 'Escrita V2.7A bloqueada: AprovarCompra exige pre-validacao especifica completa, snapshot e aprovador resolvidos.',
        itemId,
        alertas: [{ codigo: 'EXECUCAO_APROVACAO_PREVALIDACAO_INCOMPLETA', mensagem: 'Revise item, status destino, snapshot, regra e aprovador antes da escrita.' }]
      });
      return;
    }

    if (config.acaoTesteOperacionalV27A !== 'AtualizarStatusRequisicao' && config.acaoTesteOperacionalV27A !== 'CriarSnapshotAprovacaoOperacional' && config.acaoTesteOperacionalV27A !== 'AprovarCompra' && config.acaoTesteOperacionalV27A !== 'CriarPedidoCompra' && config.acaoTesteOperacionalV27A !== 'VincularNotaFiscal' && config.acaoTesteOperacionalV27A !== 'ProgramarPagamento') {
      setResultadoOperacionalV27A({
        sucesso: false,
        bloqueado: true,
        acao: config.acaoTesteOperacionalV27A,
        mensagem: 'Escrita V2.7A bloqueada: acao ainda nao preparada para teste manual.',
        itemId,
        alertas: [{ codigo: 'EXECUCAO_ACAO_NAO_SUPORTADA', mensagem: 'Somente AtualizarStatusRequisicao, CriarSnapshotAprovacaoOperacional, AprovarCompra, CriarPedidoCompra, VincularNotaFiscal e ProgramarPagamento estao preparados nesta fase.' }]
      });
      return;
    }

    if (config.acaoTesteOperacionalV27A === 'CriarPedidoCompra' && (
      preValidacaoOperacionalV27A.acaoPretendida !== 'CriarPedidoCompra' ||
      preValidacaoOperacionalV27A.campoAlterado?.indexOf('Fornecedor0Id') === -1 ||
      !preValidacaoOperacionalV27A.pedidoFornecedorId ||
      !preValidacaoOperacionalV27A.pedidoVinculoTextual ||
      !preValidacaoOperacionalV27A.pedidoTituloPrevisto ||
      !preValidacaoOperacionalV27A.snapshotExistenteId ||
      preValidacaoOperacionalV27A.pedidoExistenteId
    )) {
      setResultadoOperacionalV27A({
        sucesso: false,
        bloqueado: true,
        acao: config.acaoTesteOperacionalV27A,
        mensagem: 'Escrita V2.7A bloqueada: CriarPedidoCompra exige pre-validacao completa da Lista 03, fornecedor e vinculo textual.',
        itemId,
        alertas: [{ codigo: 'EXECUCAO_PEDIDO_PREVALIDACAO_INCOMPLETA', mensagem: 'Revise fornecedorTesteIdV27A, SnapshotAprovacaoCompra, vinculo textual e inexistencia de pedido anterior.' }]
      });
      return;
    }

    if (config.acaoTesteOperacionalV27A === 'VincularNotaFiscal' && (
      preValidacaoOperacionalV27A.acaoPretendida !== 'VincularNotaFiscal' ||
      preValidacaoOperacionalV27A.campoAlterado?.indexOf('EnviadaparaContabilidade_x003f_') === -1 ||
      !preValidacaoOperacionalV27A.snapshotExistenteId ||
      !preValidacaoOperacionalV27A.notaFiscalPedidoId ||
      !preValidacaoOperacionalV27A.notaFiscalNumeroPrevisto ||
      !preValidacaoOperacionalV27A.notaFiscalFornecedorId ||
      !preValidacaoOperacionalV27A.notaFiscalObraId ||
      !preValidacaoOperacionalV27A.notaFiscalStatusInicial ||
      !preValidacaoOperacionalV27A.notaFiscalTipo ||
      !preValidacaoOperacionalV27A.notaFiscalEnviadaContabilidade ||
      preValidacaoOperacionalV27A.notaFiscalExistenteId
    )) {
      setResultadoOperacionalV27A({
        sucesso: false,
        bloqueado: true,
        acao: config.acaoTesteOperacionalV27A,
        mensagem: 'Escrita V2.7A bloqueada: VincularNotaFiscal exige pre-validacao completa da Lista 04, pedido, fornecedor, obra e campo obrigatorio de contabilidade.',
        itemId,
        alertas: [{ codigo: 'EXECUCAO_NF_PREVALIDACAO_INCOMPLETA', mensagem: 'Revise pedidoTesteIdV27A, numeroNotaFiscalTesteV27A, ValorBrutodaNF, Fornecedor0Id, ObraId, EnviadaparaContabilidade_x003f_ e inexistencia de NF anterior.' }]
      });
      return;
    }

    if (config.acaoTesteOperacionalV27A === 'ProgramarPagamento' && (
      preValidacaoOperacionalV27A.acaoPretendida !== 'ProgramarPagamento' ||
      preValidacaoOperacionalV27A.campoAlterado?.indexOf('Fornecedor_x002f_PrestadorId') === -1 ||
      !preValidacaoOperacionalV27A.snapshotExistenteId ||
      !preValidacaoOperacionalV27A.pagamentoNotaFiscalId ||
      !preValidacaoOperacionalV27A.pagamentoNotaFiscalNumero ||
      !preValidacaoOperacionalV27A.pagamentoFornecedorId ||
      !preValidacaoOperacionalV27A.pagamentoObraId ||
      !preValidacaoOperacionalV27A.pagamentoValorBruto ||
      !preValidacaoOperacionalV27A.pagamentoVencimento ||
      !preValidacaoOperacionalV27A.pagamentoDataProgramada ||
      !preValidacaoOperacionalV27A.pagamentoStatusInicial ||
      !preValidacaoOperacionalV27A.pagamentoForma ||
      !preValidacaoOperacionalV27A.pagamentoConta ||
      !preValidacaoOperacionalV27A.pagamentoCategoria ||
      !preValidacaoOperacionalV27A.pagamentoOrigem ||
      preValidacaoOperacionalV27A.pagamentoExistenteId
    )) {
      setResultadoOperacionalV27A({
        sucesso: false,
        bloqueado: true,
        acao: config.acaoTesteOperacionalV27A,
        mensagem: 'Escrita V2.7A bloqueada: ProgramarPagamento exige pre-validacao completa da Lista 10, NF, fornecedor, obra, valores e choices de pagamento.',
        itemId,
        alertas: [{ codigo: 'EXECUCAO_PAGAMENTO_PREVALIDACAO_INCOMPLETA', mensagem: 'Revise notaFiscalTesteIdV27A, numeroNotaFiscalTesteV27A, valor, Fornecedor_x002f_PrestadorId, ObraId, StatusdoPagamento, FormadePagamento, ContadePagamento e inexistencia de pagamento anterior.' }]
      });
      return;
    }

    setExecutandoOperacionalV27A(true);
    try {
      const resultado = config.acaoTesteOperacionalV27A === 'CriarSnapshotAprovacaoOperacional'
        ? await props.repository.executarCriarSnapshotAprovacaoOperacionalV27A(props.currentUserEmail, flags, config)
        : config.acaoTesteOperacionalV27A === 'AprovarCompra'
          ? await props.repository.executarAprovarCompraV27A(props.currentUserEmail, flags, config)
          : config.acaoTesteOperacionalV27A === 'CriarPedidoCompra'
            ? await props.repository.executarCriarPedidoCompraV27A(props.currentUserEmail, flags, config)
            : config.acaoTesteOperacionalV27A === 'VincularNotaFiscal'
              ? await props.repository.executarVincularNotaFiscalV27A(props.currentUserEmail, flags, config)
              : config.acaoTesteOperacionalV27A === 'ProgramarPagamento'
                ? await props.repository.executarProgramarPagamentoV27A(props.currentUserEmail, flags, config)
                : await props.repository.executarAtualizacaoStatusRequisicaoV27A(props.currentUserEmail, flags, config);

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
    <div ref={viewportRef} className={styles.viewport}>
    <section className={styles.enacSistema}>
      <aside className={styles.sideNav}>
        <div className={styles.sideNavBrand}>
          <img src={enacLogo} alt="ENAC" className={styles.sideNavLogo} />
        </div>
        {viewsPermitidas.map((item) => (
          <button key={item.key} className={view === item.key ? styles.active : ''} onClick={() => setView(item.key)}>{item.label}</button>
        ))}
      </aside>
      <main className={styles.mainPanel}>
        <header className={styles.appHeader}>
          <div className={styles.headerIdentity}>
            <div className={styles.titleBlock}>
              <h1 className={styles.appTitle}>Sistema ENAC</h1>
              <p>Obras, compras, NF e financeiro</p>
            </div>
          </div>
          <div className={styles.headerMeta}>
            <span className={styles.environmentBadge}>Homologação assistida</span>
            <div className={styles.userAccessBox}>
              <span className={styles.userAccessLabel}>Usuário</span>
              <strong>{nomeUsuarioBanner}</strong>
            </div>
            <label className={styles.profileAccessField}>
              Perfil de acesso
              <select value={perfil} disabled={perfilSelectDesabilitado} onChange={(event) => setPerfil(event.target.value as PerfilEnac)}>
                {(perfisAutorizados.length > 0 ? perfisAutorizados : perfilOptions).map((item) => (
                  <option key={item} value={item}>{perfilLabels[item]}</option>
                ))}
              </select>
            </label>
          </div>
        </header>

        <div className={styles.contentPanel}>
        {acessoOperacionalBloqueado && (
          <div className={styles.adminNotice}>
            {!usuarioCadastrado && 'Usuário não cadastrado no Sistema ENAC. Ações operacionais e administrativas permanecem bloqueadas.'}
            {usuarioCadastrado && !usuarioAtivo && 'Usuário inativo no Sistema ENAC. Ações operacionais e administrativas permanecem bloqueadas.'}
            {usuarioCadastrado && usuarioAtivo && !perfilSelecionadoAutorizado && 'Perfil selecionado não autorizado para o usuário atual.'}
          </div>
        )}
        {view === 'dashboard' && <Dashboard perfil={perfil} solicitacoes={solicitacoes} requisicoesResumo={usandoSharePointReadonly ? requisicoesResumoReadonly : []} origemDados={origemDadosEfetiva} />}
        {view === 'nova' && <NovaSolicitacao onSubmit={criarSolicitacao} />}
        {view === 'minhas' && <Tabela solicitacoes={solicitacoes} onSelect={(id) => { setSelectedId(id); setView('historico'); }} />}
        {view === 'cotacoes' && <Cotacoes solicitacoes={solicitacoes} onSelect={setSelectedId} selected={selected} onRegistrarCotacao={registrarCotacao} />}
        {view === 'aprovacoes' && <Aprovacoes solicitacoes={solicitacoes} perfil={perfil} onApprove={aprovar} />}
        {view === 'pedido' && <Pedido selected={selected} onEmitirPedido={emitirPedido} />}
        {view === 'financeiro' && <Financeiro selected={selected} onProgramarPagamento={programarPagamento} />}
        {view === 'liberacao' && <Liberacao solicitacoes={solicitacoes} onConcluir={concluirPagamento} />}
        {view === 'historico' && <Historico selected={selected} />}
        {view === 'adminUsuarios' && perfilAdministradorAtivo && (
          <AdminUsuarios
            usuarios={usuariosParaAdmin}
            alcadas={alcadasParaAdmin}
            origemDados={origemDadosEfetiva}
            repository={props.repository}
            flags={props.flagsEscritaAdministrativaV29C}
            usuarioAtual={usuarioAtualSistema}
            perfilAdministradorAtivo={perfilAdministradorAtivo}
          />
        )}
        {view === 'adminPerfis' && perfilAdministradorAtivo && (
          <AdminPerfis
            usuarios={usuariosParaAdmin}
            alcadas={alcadasParaAdmin}
            origemDados={origemDadosEfetiva}
            repository={props.repository}
            flags={props.flagsEscritaAdministrativaV29C}
            usuarioAtual={usuarioAtualSistema}
            perfilAdministradorAtivo={perfilAdministradorAtivo}
          />
        )}
        {view === 'adminAlcadas' && perfilAdministradorAtivo && (
          <Alcadas
            alcadas={alcadasParaAdmin}
            usuarios={usuariosParaAdmin}
            origemDados={origemDadosEfetiva}
            repository={props.repository}
            flags={props.flagsEscritaAdministrativaV29C}
            usuarioAtual={usuarioAtualSistema}
            perfilAdministradorAtivo={perfilAdministradorAtivo}
          />
        )}
        {view === 'adminHistorico' && (
          <>
            {perfilAdministradorAtivo && <AdminHistorico historico={historicoParaAdmin} origemDados={origemDadosEfetiva} />}
            {perfilAdministradorAtivo && escritaTesteConfigurada && (
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
            {perfilAdministradorAtivo && props.flagsEscritaOperacionalV27A?.habilitarEscritaOperacionalV27A && (
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
            {perfilAdministradorAtivo && props.flagsEscritaAdministrativaV29B?.habilitarEscritaAdministrativaV29B && (
              <PainelAdministrativoV29B preValidacao={preValidacaoAdministrativaV29B} />
            )}
          </>
        )}
        </div>
      </main>
    </section>
    </div>
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
      <label>Tipo<select name="tipo"><option value="Material">Material</option><option value="Servico">Serviço</option><option value="Locacao">Locação</option><option value="Equipamento">Equipamento</option></select></label>
      <label>Descrição do item/serviço<input name="titulo" required /></label>
      <label>Descrição complementar<textarea name="descricao" required /></label>
      <label>Especificação técnica<textarea name="especificacaoTecnica" required /></label>
      <label>Quantidade<input name="quantidade" type="number" step="0.01" /></label>
      <label>Unidade<input name="unidade" /></label>
      <label>Frente de serviço/local<input name="frenteServico" required /></label>
      <label>Data necessária<input name="dataNecessaria" type="date" required /></label>
      <label>Prioridade<select name="prioridade"><option>Normal</option><option>Alta</option><option>Emergencial</option></select></label>
      <label>Justificativa de urgência<textarea name="justificativaUrgencia" /></label>
      <label>Anexo/foto/projeto/referencia<input name="anexoReferencia" /></label>
      <label>Observações<textarea name="observacoes" /></label>
      <button type="submit">Enviar para cotação</button>
    </form>
  );
}

function Cotacoes({ solicitacoes, selected, onSelect, onRegistrarCotacao }: { solicitacoes: ISolicitacaoEnac[]; selected: ISolicitacaoEnac; onSelect: (id: string) => void; onRegistrarCotacao: (id: string, valor: number, fornecedor: string) => void }): JSX.Element {
  return (
    <div className={styles.split}>
      <Tabela solicitacoes={solicitacoes.filter((item) => item.status === 'AguardandoCotacao' || item.status === 'EmCotacao')} onSelect={onSelect} />
      <form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); onRegistrarCotacao(selected.id, Number(form.get('valor')), String(form.get('fornecedor'))); }}>
        <h2>Cotação por Kemilly</h2>
        <p>{selected.id} - {selected.titulo}</p>
        <label>Fornecedor recomendado<input name="fornecedor" defaultValue={selected.cotacao?.fornecedorRecomendado} required /></label>
        <label>Valor recomendado<input name="valor" type="number" step="0.01" defaultValue={selected.cotacao?.valorRecomendado || 0} required /></label>
        <label>Justificativa<textarea name="justificativa" defaultValue={selected.cotacao?.justificativaRecomendacao} /></label>
        <button type="submit">Enviar para aprovação</button>
      </form>
    </div>
  );
}

function Aprovacoes({ solicitacoes, perfil, onApprove }: { solicitacoes: ISolicitacaoEnac[]; perfil: PerfilEnac; onApprove: (id: string) => void }): JSX.Element {
  const aprovador = perfil === 'Planejamento' ? 'Gustavo' : perfil === 'Diretoria' ? 'Leon' : '';
  return (
    <>
      <h2>Aprovações pendentes</h2>
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
      <h2>NF e programação bancária por Matheus</h2>
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
      <h2>Liberação bancária por Leon</h2>
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

function AdminUsuarios({
  usuarios: usuariosExibidos,
  alcadas,
  origemDados,
  repository,
  flags,
  usuarioAtual,
  perfilAdministradorAtivo
}: {
  usuarios: IUsuarioPerfilEnac[];
  alcadas: IAlcadaEnac[];
  origemDados: OrigemDadosEnac;
  repository?: SharePointEnacRepository;
  flags?: FlagsEscritaAdministrativaV29C;
  usuarioAtual?: IUsuarioPerfilEnac;
  perfilAdministradorAtivo: boolean;
}): JSX.Element {
  const [acao, setAcao] = React.useState<AcaoAdministrativaV29C>('AtualizarUsuarioPerfilStatus');
  const [usuarioId, setUsuarioId] = React.useState<string>(usuariosExibidos[0]?.id || '');
  const usuarioSelecionado = usuariosExibidos.find((usuario) => usuario.id === usuarioId) || usuariosExibidos[0];
  const [nome, setNome] = React.useState<string>(usuarioSelecionado?.nome || '');
  const [usuarioInternoId, setUsuarioInternoId] = React.useState<string>(usuarioSelecionado?.usuarioInternoId || '');
  const [contaMicrosoft365, setContaMicrosoft365] = React.useState<string>(usuarioSelecionado?.contaMicrosoft365Id ? String(usuarioSelecionado.contaMicrosoft365Id) : '');
  const [email, setEmail] = React.useState<string>(usuarioSelecionado?.emailCorporativo || '');
  const [perfilPrincipal, setPerfilPrincipal] = React.useState<PerfilEnac>(usuarioSelecionado?.perfilPrincipal || 'Campo');
  const [usuarioAtivo, setUsuarioAtivo] = React.useState<boolean>(usuarioSelecionado?.usuarioAtivo !== false);
  const [cargoFuncao, setCargoFuncao] = React.useState<string>(usuarioSelecionado?.cargoFuncao || '');
  const justificativa = `${MARCADOR_ADMINISTRATIVO_V29C} - cadastro de usuario pelo Sistema ENAC`;
  const confirmacaoFinal = CONFIRMACAO_ADMINISTRATIVA_V29C;
  const [resultado, setResultado] = React.useState<ResultadoAdministrativoV29C | null>(null);
  const [executando, setExecutando] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!usuarioSelecionado || acao === 'CriarUsuarioSistema') {
      return;
    }

    setNome(usuarioSelecionado.nome || '');
    setUsuarioInternoId(usuarioSelecionado.usuarioInternoId || '');
    setContaMicrosoft365(usuarioSelecionado.contaMicrosoft365Id ? String(usuarioSelecionado.contaMicrosoft365Id) : '');
    setEmail(usuarioSelecionado.emailCorporativo || '');
    setPerfilPrincipal(usuarioSelecionado.perfilPrincipal || 'Campo');
    setUsuarioAtivo(usuarioSelecionado.usuarioAtivo !== false);
    setCargoFuncao(usuarioSelecionado.cargoFuncao || '');
  }, [acao, usuarioSelecionado?.id]);

  React.useEffect(() => {
    if (acao !== 'CriarUsuarioSistema') {
      return;
    }

    setUsuarioId('');
    setNome('');
    setUsuarioInternoId('');
    setContaMicrosoft365('');
    setEmail('');
    setPerfilPrincipal('Campo');
    setUsuarioAtivo(true);
    setCargoFuncao('');
    setResultado(null);
  }, [acao]);

  const contaNumerica = parseNumberField(contaMicrosoft365);
  const permissoesBase = permissoesPadraoPorPerfilV29C(perfilPrincipal);
  const payloadUsuario: UsuarioAdministrativoV29CPayload = {
    itemId: acao === 'AtualizarUsuarioPerfilStatus' ? Number(usuarioSelecionado?.id || 0) || undefined : undefined,
    nome,
    usuarioInternoId,
    contaMicrosoft365Id: contaNumerica,
    contaMicrosoft365Login: contaNumerica ? undefined : contaMicrosoft365,
    emailCorporativo: email,
    perfilPrincipal,
    perfisAdicionais: acao === 'AtualizarUsuarioPerfilStatus' ? (usuarioSelecionado?.perfisAdicionais || []) : [],
    usuarioAtivo,
    cargoFuncao,
    observacoes: usuarioSelecionado?.observacoes || '',
    ...permissoesBase
  };
  const preValidacao = buildPreValidacaoAdministrativaV29C(acao, flags, usuarioAtual, perfilAdministradorAtivo, usuariosExibidos, alcadas, payloadUsuario, undefined, justificativa);
  const podeSalvar = Boolean(repository && origemDados === 'sharepoint' && preValidacao.sucesso && !preValidacao.bloqueado && confirmacaoFinal === CONFIRMACAO_ADMINISTRATIVA_V29C);
  const alertaBloqueante = preValidacao.alertas.find((alerta) => alerta.codigo !== 'ALERTA_ADMINISTRADOR_SISTEMA' && alerta.codigo !== 'DUPLICIDADE_PROPRIO_ITEM_IGNORADA');
  const mensagemSalvar = podeSalvar
    ? 'Pronto para salvar.'
    : alertaBloqueante?.mensagem || 'Revise os campos obrigatórios e a permissão administrativa antes de salvar.';

  async function executar(): Promise<void> {
    if (!repository || !usuarioAtual || !flags || !podeSalvar) {
      setResultado({
        sucesso: false,
        bloqueado: true,
        acao,
        mensagem: 'Escrita administrativa V2.9C bloqueada: pre-validacao, origem SharePoint ou confirmacao final ausente.',
        alertas: preValidacao.alertas
      });
      return;
    }

    setExecutando(true);
    try {
      setResultado(await repository.executarAdministracaoV29C({
        acao,
        flags,
        usuarioExecutor: usuarioAtual,
        payloadUsuario,
        justificativa,
        confirmacaoFinal,
        preValidacao,
        valorAnterior: usuarioSelecionado ? { ...usuarioSelecionado } : undefined
      }));
    } catch (error) {
      setResultado({
        sucesso: false,
        bloqueado: true,
        acao,
        mensagem: error instanceof Error ? error.message : String(error),
        alertas: [{ codigo: 'ERRO_EXECUCAO_ADMIN_V29C', mensagem: error instanceof Error ? error.message : String(error) }]
      });
    } finally {
      setExecutando(false);
    }
  }

  return (
    <>
      <p>Fonte: {origemDados === 'sharepoint' ? 'SharePoint' : 'Fallback local'}</p>
      <div className={styles.adminNotice}>
        Administração V2.9C disponível apenas para Administrador do Sistema ativo. A escrita exige flags no Property Pane, token, pré-validação, confirmação final e histórico.
      </div>
      <form className={styles.adminForm} onSubmit={(event) => event.preventDefault()}>
        <h2>Cadastro de usuários</h2>
        <label>Ação<select value={acao} onChange={(event) => setAcao(event.currentTarget.value as AcaoAdministrativaV29C)}><option value="AtualizarUsuarioPerfilStatus">Atualizar usuário</option><option value="CriarUsuarioSistema">Criar usuário</option></select></label>
        {acao === 'AtualizarUsuarioPerfilStatus' && <label>Usuário alvo<select value={usuarioId} onChange={(event) => setUsuarioId(event.currentTarget.value)}>{usuariosExibidos.map((usuario) => <option key={usuario.id} value={usuario.id}>{formatDisplayName(usuario.nome)} - {usuario.usuarioInternoId}</option>)}</select></label>}
        <label>Nome completo<input value={nome} onChange={(event) => setNome(event.currentTarget.value)} /></label>
        <label>Conta Microsoft 365 ID ou e-mail<input value={contaMicrosoft365} onChange={(event) => setContaMicrosoft365(event.currentTarget.value)} /></label>
        <label>E-mail corporativo<input value={email} onChange={(event) => setEmail(event.currentTarget.value)} /></label>
        <label>ID interno<input value={usuarioInternoId} onChange={(event) => setUsuarioInternoId(event.currentTarget.value)} /></label>
        <label>Perfil principal<select value={perfilPrincipal} onChange={(event) => setPerfilPrincipal(event.currentTarget.value as PerfilEnac)}>{perfilOptions.map((item) => <option key={item} value={item}>{perfilLabels[item]}</option>)}</select></label>
        <label>Status<select value={usuarioAtivo ? 'Ativo' : 'Inativo'} onChange={(event) => setUsuarioAtivo(event.currentTarget.value === 'Ativo')}><option value="Ativo">Ativo</option><option value="Inativo">Inativo</option></select></label>
        <label>Cargo/Função<input value={cargoFuncao} onChange={(event) => setCargoFuncao(event.currentTarget.value)} /></label>
        <button type="button" disabled={!podeSalvar || executando} onClick={executar}>Salvar</button>
        <span>{mensagemSalvar}</span>
        {resultado && <span>{resultado.bloqueado ? 'Bloqueada' : 'Executada'}: {resultado.mensagem}</span>}
      </form>
      <table>
        <thead><tr><th>Nome</th><th>Usuário interno</th><th>Perfil principal</th><th>Perfis adicionais</th><th>Cargo/Função</th><th>Status</th></tr></thead>
        <tbody>
          {usuariosExibidos.map((usuario) => (
            <tr key={usuario.usuarioInternoId || usuario.id}>
              <td>{formatDisplayName(usuario.nome)}</td>
              <td>{formatUserInternalId(usuario.usuarioInternoId || usuario.id)}</td>
              <td>{perfilLabels[usuario.perfilPrincipal]}</td>
              <td>{(usuario.perfisAdicionais || []).length > 0 ? (usuario.perfisAdicionais || []).map((item) => perfilLabels[item]).join(', ') : '-'}</td>
              <td>{usuario.cargoFuncao || '-'}</td>
              <td>{usuario.usuarioAtivo ? 'Ativo' : 'Inativo'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function AdminPerfis({
  usuarios: usuariosExibidos,
  alcadas,
  origemDados,
  repository,
  flags,
  usuarioAtual,
  perfilAdministradorAtivo
}: {
  usuarios: IUsuarioPerfilEnac[];
  alcadas: IAlcadaEnac[];
  origemDados: OrigemDadosEnac;
  repository?: SharePointEnacRepository;
  flags?: FlagsEscritaAdministrativaV29C;
  usuarioAtual?: IUsuarioPerfilEnac;
  perfilAdministradorAtivo: boolean;
}): JSX.Element {
  const [usuarioId, setUsuarioId] = React.useState<string>(usuariosExibidos[0]?.id || '');
  const usuarioSelecionado = usuariosExibidos.find((usuario) => usuario.id === usuarioId) || usuariosExibidos[0];
  const [perfilPrincipal, setPerfilPrincipal] = React.useState<PerfilEnac>(usuarioSelecionado?.perfilPrincipal || 'Campo');
  const [perfisAdicionais, setPerfisAdicionais] = React.useState<PerfilEnac[]>(usuarioSelecionado?.perfisAdicionais || []);
  const [permissoes, setPermissoes] = React.useState<PermissoesUsuarioV29C>(permissoesDoUsuarioV29C(usuarioSelecionado, perfilPrincipal));
  const justificativa = `${MARCADOR_ADMINISTRATIVO_V29C} - configuracao de perfil pelo Sistema ENAC`;
  const confirmacaoFinal = CONFIRMACAO_ADMINISTRATIVA_V29C;
  const [resultado, setResultado] = React.useState<ResultadoAdministrativoV29C | null>(null);
  const [executando, setExecutando] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!usuarioSelecionado) {
      return;
    }

    setPerfilPrincipal(usuarioSelecionado.perfilPrincipal || 'Campo');
    setPerfisAdicionais(usuarioSelecionado.perfisAdicionais || []);
    setPermissoes(permissoesDoUsuarioV29C(usuarioSelecionado, usuarioSelecionado.perfilPrincipal || 'Campo'));
  }, [usuarioSelecionado?.id]);

  const payloadUsuario: UsuarioAdministrativoV29CPayload = {
    itemId: Number(usuarioSelecionado?.id || 0) || undefined,
    nome: usuarioSelecionado?.nome || '',
    usuarioInternoId: usuarioSelecionado?.usuarioInternoId || '',
    contaMicrosoft365Id: usuarioSelecionado?.contaMicrosoft365Id,
    contaMicrosoft365Login: usuarioSelecionado?.contaMicrosoft365Login,
    emailCorporativo: usuarioSelecionado?.emailCorporativo || '',
    perfilPrincipal,
    perfisAdicionais,
    usuarioAtivo: usuarioSelecionado?.usuarioAtivo !== false,
    cargoFuncao: usuarioSelecionado?.cargoFuncao || '',
    observacoes: usuarioSelecionado?.observacoes || '',
    ...permissoes
  };
  const preValidacao = buildPreValidacaoAdministrativaV29C('AtualizarUsuarioPerfilStatus', flags, usuarioAtual, perfilAdministradorAtivo, usuariosExibidos, alcadas, payloadUsuario, undefined, justificativa);
  const podeSalvar = Boolean(repository && origemDados === 'sharepoint' && usuarioSelecionado && preValidacao.sucesso && !preValidacao.bloqueado && confirmacaoFinal === CONFIRMACAO_ADMINISTRATIVA_V29C);
  const alertaBloqueante = preValidacao.alertas.find((alerta) => alerta.codigo !== 'ALERTA_ADMINISTRADOR_SISTEMA' && alerta.codigo !== 'DUPLICIDADE_PROPRIO_ITEM_IGNORADA');
  const mensagemSalvar = podeSalvar
    ? 'Pronto para salvar.'
    : alertaBloqueante?.mensagem || 'Revise o usuário, perfil e permissão administrativa antes de salvar.';
  const permissoesSugeridas = permissoesPadraoPorPerfilV29C(perfilPrincipal);

  function togglePerfilAdicional(perfilItem: PerfilEnac, checked: boolean): void {
    const semPerfil = perfisAdicionais.filter((item) => item !== perfilItem);
    setPerfisAdicionais(checked ? [...semPerfil, perfilItem] : semPerfil);
  }

  async function executar(): Promise<void> {
    if (!repository || !usuarioAtual || !flags || !podeSalvar) {
      setResultado({
        sucesso: false,
        bloqueado: true,
        acao: 'AtualizarUsuarioPerfilStatus',
        mensagem: 'Escrita administrativa V2.9C bloqueada: pre-validacao, origem SharePoint ou confirmacao final ausente.',
        alertas: preValidacao.alertas
      });
      return;
    }

    setExecutando(true);
    try {
      setResultado(await repository.executarAdministracaoV29C({
        acao: 'AtualizarUsuarioPerfilStatus',
        flags,
        usuarioExecutor: usuarioAtual,
        payloadUsuario,
        justificativa,
        confirmacaoFinal,
        preValidacao,
        valorAnterior: usuarioSelecionado ? { ...usuarioSelecionado } : undefined
      }));
    } catch (error) {
      setResultado({
        sucesso: false,
        bloqueado: true,
        acao: 'AtualizarUsuarioPerfilStatus',
        mensagem: error instanceof Error ? error.message : String(error),
        alertas: [{ codigo: 'ERRO_EXECUCAO_PERFIL_V29C', mensagem: error instanceof Error ? error.message : String(error) }]
      });
    } finally {
      setExecutando(false);
    }
  }

  return (
    <>
      <p>Fonte: {origemDados === 'sharepoint' ? 'SharePoint' : 'Fallback local'}</p>
      <div className={styles.adminNotice}>
        Perfis V2.9C configuram permissões de usuários existentes. Criar uma nova categoria de perfil ainda exige mudança controlada de schema/lista SharePoint.
      </div>
      <form className={styles.adminForm} onSubmit={(event) => event.preventDefault()}>
        <h2>Perfis e permissões</h2>
        <label>Usuário<select value={usuarioId} onChange={(event) => setUsuarioId(event.currentTarget.value)}>{usuariosExibidos.map((usuario) => <option key={usuario.id} value={usuario.id}>{formatDisplayName(usuario.nome)} - {usuario.usuarioInternoId}</option>)}</select></label>
        <label>Perfil principal<select value={perfilPrincipal} onChange={(event) => setPerfilPrincipal(event.currentTarget.value as PerfilEnac)}>{perfilOptions.map((item) => <option key={item} value={item}>{perfilLabels[item]}</option>)}</select></label>
        <div className={styles.adminFieldGroup}>
          <strong>Perfis adicionais</strong>
          {perfilOptions.filter((item) => item !== perfilPrincipal).map((item) => (
            <label key={item}><input type="checkbox" checked={perfisAdicionais.indexOf(item) >= 0} onChange={(event) => togglePerfilAdicional(item, event.currentTarget.checked)} />{perfilLabels[item]}</label>
          ))}
        </div>
        <div className={styles.adminFieldGroup}>
          <strong>Permissões operacionais</strong>
          <button type="button" onClick={() => setPermissoes(permissoesSugeridas)}>Aplicar padrão do perfil</button>
          {(Object.keys(permissoes) as Array<keyof PermissoesUsuarioV29C>).map((key) => (
            <label key={key}><input type="checkbox" checked={permissoes[key]} onChange={(event) => setPermissoes({ ...permissoes, [key]: event.currentTarget.checked })} />{permissaoLabelsV29C[key]}</label>
          ))}
        </div>
        <button type="button" disabled={!podeSalvar || executando} onClick={executar}>Salvar</button>
        <span>{mensagemSalvar}</span>
        {resultado && <span>{resultado.bloqueado ? 'Bloqueada' : 'Executada'}: {resultado.mensagem}</span>}
      </form>
      <table>
        <thead><tr><th>Usuário</th><th>Perfil principal</th><th>Perfis adicionais</th><th>Permissões ativas</th><th>Status</th></tr></thead>
        <tbody>
          {usuariosExibidos.map((usuario) => {
            const permissoesAtivas = (Object.keys(permissaoLabelsV29C) as Array<keyof PermissoesUsuarioV29C>)
              .filter((key) => permissoesDoUsuarioV29C(usuario, usuario.perfilPrincipal)[key])
              .map((key) => permissaoLabelsV29C[key]);

            return (
              <tr key={usuario.usuarioInternoId || usuario.id}>
                <td>{formatDisplayName(usuario.nome)}<br />{formatUserInternalId(usuario.usuarioInternoId || usuario.id)}</td>
                <td>{perfilLabels[usuario.perfilPrincipal]}</td>
                <td>{(usuario.perfisAdicionais || []).length > 0 ? (usuario.perfisAdicionais || []).map((item) => perfilLabels[item]).join(', ') : '-'}</td>
                <td>{permissoesAtivas.length > 0 ? permissoesAtivas.join(', ') : '-'}</td>
                <td>{usuario.usuarioAtivo ? 'Ativo' : 'Inativo'}</td>
              </tr>
            );
          })}
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
            <tr key={`${item.tipoConfiguracao}-${item.dataHora}-${index}`}><td>{item.tipoConfiguracao}</td><td>{item.valorAnterior}</td><td>{item.valorNovo}</td><td>{formatDisplayName(item.usuarioAlteracao)}</td><td>{item.justificativa}</td></tr>
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
          Snapshot atual: {preValidacao.snapshotExistenteId || '-'} {preValidacao.snapshotExistenteTitulo || ''}<br />
          Aprovação necessária: campo {preValidacao.aprovacaoNecessariaCampo || '-'} / bruto {preValidacao.aprovacaoNecessariaValorBruto || '-'} / normalizado {preValidacao.aprovacaoNecessariaNormalizada || '-'}<br />
          Valor analisado: {preValidacao.valorAnalisado ? formatCurrency(preValidacao.valorAnalisado) : '-'}<br />
          Regra/aprovadores: {preValidacao.regraInternaId || '-'} / {preValidacao.aprovadorBaseNome || '-'} / {preValidacao.aprovadorEfetivoNome || '-'}<br />
          Aprovacao compra: previsto {preValidacao.aprovadorPrevistoNome || '-'} / efetivo {preValidacao.aprovadorEfetivoOperacionalNome || '-'} / tipo {preValidacao.tipoAprovacaoCompra || '-'}<br />
          Diagnostico aprovacao: {preValidacao.diagnosticoAprovacaoCompra || '-'}<br />
          Justificativa prevista: {preValidacao.justificativaAprovacaoPrevista || '-'}<br />
          Pedido previsto: {preValidacao.pedidoTituloPrevisto || '-'} / vinculo {preValidacao.pedidoVinculoTextual || '-'}<br />
          Pedido fornecedor: {preValidacao.pedidoFornecedorId || '-'} / {preValidacao.pedidoFornecedorLookup || preValidacao.pedidoFornecedorTitulo || '-'}<br />
          Pedido status inicial: {preValidacao.pedidoStatusInicial || '-'} / existente {preValidacao.pedidoExistenteId || '-'} {preValidacao.pedidoExistenteTitulo || ''}<br />
          Diagnostico pedido: {preValidacao.diagnosticoPedidoCompra && preValidacao.diagnosticoPedidoCompra.length > 0 ? preValidacao.diagnosticoPedidoCompra.join(' | ') : '-'}<br />
          NF prevista: {preValidacao.notaFiscalTituloPrevisto || '-'} / numero {preValidacao.notaFiscalNumeroPrevisto || '-'}<br />
          NF pedido/vinculo: {preValidacao.notaFiscalPedidoId || '-'} / {preValidacao.notaFiscalPedidoTitulo || preValidacao.notaFiscalVinculoPedido || '-'}<br />
          NF fornecedor/obra: {preValidacao.notaFiscalFornecedorId || '-'} / {preValidacao.notaFiscalFornecedorTitulo || '-'} / obra {preValidacao.notaFiscalObraId || '-'}<br />
          NF status/tipo/contabilidade: {preValidacao.notaFiscalStatusInicial || '-'} / {preValidacao.notaFiscalTipo || '-'} / {preValidacao.notaFiscalEnviadaContabilidade || '-'}<br />
          NF existente: {preValidacao.notaFiscalExistenteId || '-'} {preValidacao.notaFiscalExistenteTitulo || ''}<br />
          Diagnostico NF: {preValidacao.diagnosticoNotaFiscal && preValidacao.diagnosticoNotaFiscal.length > 0 ? preValidacao.diagnosticoNotaFiscal.join(' | ') : '-'}<br />
          Pagamento previsto: {preValidacao.pagamentoTituloPrevisto || '-'} / NF {preValidacao.pagamentoNotaFiscalId || '-'} {preValidacao.pagamentoNotaFiscalNumero || '-'}<br />
          Pagamento vinculo NF: {preValidacao.pagamentoVinculoNf || '-'}<br />
          Pagamento fornecedor/obra: {preValidacao.pagamentoFornecedorId || '-'} / {preValidacao.pagamentoFornecedorTitulo || '-'} / obra {preValidacao.pagamentoObraId || '-'}<br />
          Pagamento valores: bruto {preValidacao.pagamentoValorBruto ? formatCurrency(preValidacao.pagamentoValorBruto) : '-'} / liquido {preValidacao.pagamentoValorLiquido ? formatCurrency(preValidacao.pagamentoValorLiquido) : '-'}<br />
          Pagamento datas: vencimento {preValidacao.pagamentoVencimento || '-'} / programada {preValidacao.pagamentoDataProgramada || '-'}<br />
          Pagamento status/forma/conta: {preValidacao.pagamentoStatusInicial || '-'} / {preValidacao.pagamentoForma || '-'} / {preValidacao.pagamentoConta || '-'}<br />
          Pagamento categoria/origem: {preValidacao.pagamentoCategoria || '-'} / {preValidacao.pagamentoOrigem || '-'}<br />
          Pagamento existente: {preValidacao.pagamentoExistenteId || '-'} {preValidacao.pagamentoExistenteTitulo || ''}<br />
          Diagnostico pagamento: {preValidacao.diagnosticoPagamento && preValidacao.diagnosticoPagamento.length > 0 ? preValidacao.diagnosticoPagamento.join(' | ') : '-'}<br />
          Snapshot previsto: {preValidacao.snapshotPrevistoTitulo || '-'}<br />
          Acoes previstas: snapshot {preValidacao.criaraSnapshot ? 'sim' : 'nao'}, vinculo {preValidacao.vincularaSnapshotAprovacaoCompra ? 'sim' : 'nao'}, historico {preValidacao.registraraHistorico ? 'sim' : 'nao'}<br />
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
      {resultado && (
        <span>
          Item: {resultado.itemId || '-'} / campo {resultado.campoAlterado || '-'}<br />
          Snapshot: {resultado.snapshotItemId || '-'} / {resultado.snapshotTitle || '-'}<br />
          Snapshot antes: {resultado.snapshotAntesId || '-'} / {resultado.snapshotAntesTitulo || '-'}<br />
          Snapshot depois: {resultado.snapshotDepoisId || '-'} / {resultado.snapshotDepoisTitulo || '-'}<br />
          Snapshot preservado: {resultado.snapshotPreservado === undefined ? '-' : resultado.snapshotPreservado ? 'sim' : 'nao'}<br />
          Status: {resultado.statusAnterior || '-'} {'->'} {resultado.statusNovo || '-'}<br />
          Historico criado: {resultado.historicoRegistrado ? 'sim' : 'nao'} / HTTP escrita {resultado.statusHttpEscrita || '-'}<br />
          Alertas execucao: {resultado.alertas.length > 0 ? resultado.alertas.map((alerta) => alerta.codigo).join(', ') : '-'}
        </span>
      )}
    </div>
  );
}

function PainelAdministrativoV29B({ preValidacao }: { preValidacao: PreValidacaoAdministrativaV29BResultado | null }): JSX.Element {
  return (
    <div className={styles.row}>
      <strong>V2.9B - escrita administrativa controlada</strong>
      <span>Pré-validação de usuário/perfil/alçada. Nenhuma escrita administrativa é executada nesta versão pelo painel.</span>
      {!preValidacao && <span>Flags administrativas desligadas ou configuração ausente.</span>}
      {preValidacao && (
        <>
          <span>
            Ação: {preValidacao.acao}<br />
            Administrador ativo: {preValidacao.perfilAdministradorAtivo ? 'sim' : 'não'}<br />
            Flags válidas: {preValidacao.flagsValidas ? 'sim' : 'não'}<br />
            Pode prosseguir em etapa futura: {preValidacao.sucesso ? 'sim, após autorização específica' : 'não'}<br />
            Alertas: {preValidacao.alertas.length > 0 ? preValidacao.alertas.map((alerta) => alerta.codigo).join(', ') : '-'}
          </span>
          <label>Payload previsto<textarea readOnly value={JSON.stringify(preValidacao.payloadPrevisto || {}, null, 2)} /></label>
          <label>Histórico previsto<textarea readOnly value={JSON.stringify(preValidacao.historicoPrevisto || {}, null, 2)} /></label>
          <button type="button" disabled>Execução real bloqueada na V2.9B</button>
        </>
      )}
    </div>
  );
}

function Alcadas({
  alcadas,
  usuarios,
  origemDados,
  repository,
  flags,
  usuarioAtual,
  perfilAdministradorAtivo
}: {
  alcadas: IAlcadaEnac[];
  usuarios: IUsuarioPerfilEnac[];
  origemDados: OrigemDadosEnac;
  repository?: SharePointEnacRepository;
  flags?: FlagsEscritaAdministrativaV29C;
  usuarioAtual?: IUsuarioPerfilEnac;
  perfilAdministradorAtivo: boolean;
}): JSX.Element {
  const [alcadaId, setAlcadaId] = React.useState<string>(alcadas[0]?.id || '');
  const alcadaSelecionada = alcadas.find((item) => item.id === alcadaId) || alcadas[0];
  const [titulo, setTitulo] = React.useState<string>(alcadaSelecionada?.regraInternaId || '');
  const [regraInternaId, setRegraInternaId] = React.useState<string>(alcadaSelecionada?.regraInternaId || '');
  const [processo, setProcesso] = React.useState<AlcadaAdministrativaV29CPayload['processo']>('Compra');
  const [tipoSolicitacao, setTipoSolicitacao] = React.useState<string>(alcadaSelecionada?.tipoSolicitacao || 'Todos');
  const [valorMinimo, setValorMinimo] = React.useState<string>(String(alcadaSelecionada?.valorMinimo || 0));
  const [valorMaximo, setValorMaximo] = React.useState<string>(alcadaSelecionada?.valorMaximo ? String(alcadaSelecionada.valorMaximo) : '');
  const [ilimitado, setIlimitado] = React.useState<boolean>(alcadaSelecionada?.ilimitado === true);
  const [aprovadorPrincipalId, setAprovadorPrincipalId] = React.useState<string>(String(alcadaSelecionada?.aprovadorPrincipalId || ''));
  const [aprovadorAdicionalId, setAprovadorAdicionalId] = React.useState<string>(String(alcadaSelecionada?.aprovadorAdicionalId || ''));
  const [exigeAprovacaoAdicional, setExigeAprovacaoAdicional] = React.useState<boolean>(alcadaSelecionada?.exigeAprovacaoAdicional === true);
  const [ativa, setAtiva] = React.useState<boolean>(alcadaSelecionada?.ativa !== false);
  const [vigenciaInicial, setVigenciaInicial] = React.useState<string>(alcadaSelecionada?.vigenciaInicial || '');
  const [vigenciaFinal, setVigenciaFinal] = React.useState<string>(alcadaSelecionada?.vigenciaFinal || '');
  const [observacoes, setObservacoes] = React.useState<string>(alcadaSelecionada?.observacoes || '');
  const [justificativa, setJustificativa] = React.useState<string>(`${MARCADOR_ADMINISTRATIVO_V29C} - ajuste de alcada controlado`);
  const [confirmacaoFinal, setConfirmacaoFinal] = React.useState<string>('');
  const [resultado, setResultado] = React.useState<ResultadoAdministrativoV29C | null>(null);
  const [executando, setExecutando] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!alcadaSelecionada) {
      return;
    }

    setTitulo(alcadaSelecionada.regraInternaId || '');
    setRegraInternaId(alcadaSelecionada.regraInternaId || '');
    setProcesso(alcadaSelecionada.processo === 'LiberacaoBancaria' ? 'Liberação Bancária' : alcadaSelecionada.processo as AlcadaAdministrativaV29CPayload['processo']);
    setTipoSolicitacao(alcadaSelecionada.tipoSolicitacao || 'Todos');
    setValorMinimo(String(alcadaSelecionada.valorMinimo || 0));
    setValorMaximo(alcadaSelecionada.valorMaximo ? String(alcadaSelecionada.valorMaximo) : '');
    setIlimitado(alcadaSelecionada.ilimitado === true);
    setAprovadorPrincipalId(String(alcadaSelecionada.aprovadorPrincipalId || ''));
    setAprovadorAdicionalId(String(alcadaSelecionada.aprovadorAdicionalId || ''));
    setExigeAprovacaoAdicional(alcadaSelecionada.exigeAprovacaoAdicional === true);
    setAtiva(alcadaSelecionada.ativa !== false);
    setVigenciaInicial(alcadaSelecionada.vigenciaInicial || '');
    setVigenciaFinal(alcadaSelecionada.vigenciaFinal || '');
    setObservacoes(alcadaSelecionada.observacoes || '');
  }, [alcadaSelecionada?.id]);

  const payloadAlcada: AlcadaAdministrativaV29CPayload = {
    itemId: Number(alcadaSelecionada?.id || 0) || undefined,
    titulo,
    regraInternaId,
    processo,
    tipoSolicitacao,
    valorMinimo: parseNumberField(valorMinimo) || 0,
    valorMaximo: ilimitado ? undefined : parseNumberField(valorMaximo),
    ilimitado,
    aprovadorPrincipalId: Number(aprovadorPrincipalId || 0),
    aprovadorAdicionalId: Number(aprovadorAdicionalId || 0) || undefined,
    exigeAprovacaoAdicional,
    ativa,
    vigenciaInicial,
    vigenciaFinal,
    observacoes
  };
  const preValidacao = buildPreValidacaoAdministrativaV29C('AtualizarAlcadaUsuario', flags, usuarioAtual, perfilAdministradorAtivo, usuarios, alcadas, undefined, payloadAlcada, justificativa);
  const podeSalvar = Boolean(repository && origemDados === 'sharepoint' && preValidacao.sucesso && !preValidacao.bloqueado && confirmacaoFinal === CONFIRMACAO_ADMINISTRATIVA_V29C);

  async function executar(): Promise<void> {
    if (!repository || !usuarioAtual || !flags || !podeSalvar) {
      setResultado({
        sucesso: false,
        bloqueado: true,
        acao: 'AtualizarAlcadaUsuario',
        mensagem: 'Escrita administrativa V2.9C bloqueada: pre-validacao, origem SharePoint ou confirmacao final ausente.',
        alertas: preValidacao.alertas
      });
      return;
    }

    setExecutando(true);
    try {
      setResultado(await repository.executarAdministracaoV29C({
        acao: 'AtualizarAlcadaUsuario',
        flags,
        usuarioExecutor: usuarioAtual,
        payloadAlcada,
        justificativa,
        confirmacaoFinal,
        preValidacao,
        valorAnterior: alcadaSelecionada ? { ...alcadaSelecionada } : undefined
      }));
    } catch (error) {
      setResultado({
        sucesso: false,
        bloqueado: true,
        acao: 'AtualizarAlcadaUsuario',
        mensagem: error instanceof Error ? error.message : String(error),
        alertas: [{ codigo: 'ERRO_EXECUCAO_ALCADA_V29C', mensagem: error instanceof Error ? error.message : String(error) }]
      });
    } finally {
      setExecutando(false);
    }
  }

  return (
    <>
      <p>Fonte: {origemDados === 'sharepoint' ? 'SharePoint' : 'Fallback local'}</p>
      <div className={styles.adminNotice}>
        Alteração de alçadas V2.9C não retroage snapshots já criados e sempre registra histórico administrativo.
      </div>
      <form className={styles.adminForm} onSubmit={(event) => event.preventDefault()}>
        <h2>AtualizarAlcadaUsuario</h2>
        <label>Regra alvo<select value={alcadaId} onChange={(event) => setAlcadaId(event.currentTarget.value)}>{alcadas.map((item) => <option key={item.id} value={item.id}>{item.regraInternaId || item.id}</option>)}</select></label>
        <label>Título<input value={titulo} onChange={(event) => setTitulo(event.currentTarget.value)} /></label>
        <label>RegraInternaId<input value={regraInternaId} onChange={(event) => setRegraInternaId(event.currentTarget.value)} /></label>
        <label>Processo<select value={processo} onChange={(event) => setProcesso(event.currentTarget.value as AlcadaAdministrativaV29CPayload['processo'])}><option>Compra</option><option>Liberação Bancária</option><option>Medição</option><option>Pagamento</option><option>Outro</option></select></label>
        <label>TipoSolicitacao<input value={tipoSolicitacao} onChange={(event) => setTipoSolicitacao(event.currentTarget.value)} /></label>
        <label>ValorMinimo<input value={valorMinimo} onChange={(event) => setValorMinimo(event.currentTarget.value)} /></label>
        <label>ValorMaximo<input value={valorMaximo} disabled={ilimitado} onChange={(event) => setValorMaximo(event.currentTarget.value)} /></label>
        <label><input type="checkbox" checked={ilimitado} onChange={(event) => setIlimitado(event.currentTarget.checked)} />Ilimitado</label>
        <label>AprovadorPrincipal<select value={aprovadorPrincipalId} onChange={(event) => setAprovadorPrincipalId(event.currentTarget.value)}><option value="">Selecione</option>{usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{formatDisplayName(usuario.nome)} {usuario.usuarioAtivo ? '' : '(inativo)'}</option>)}</select></label>
        <label>AprovadorAdicional<select value={aprovadorAdicionalId} onChange={(event) => setAprovadorAdicionalId(event.currentTarget.value)}><option value="">Nenhum</option>{usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{formatDisplayName(usuario.nome)} {usuario.usuarioAtivo ? '' : '(inativo)'}</option>)}</select></label>
        <label><input type="checkbox" checked={exigeAprovacaoAdicional} onChange={(event) => setExigeAprovacaoAdicional(event.currentTarget.checked)} />Exige aprovação adicional</label>
        <label><input type="checkbox" checked={ativa} onChange={(event) => setAtiva(event.currentTarget.checked)} />Regra ativa</label>
        <label>VigenciaInicial<input type="date" value={vigenciaInicial ? vigenciaInicial.substring(0, 10) : ''} onChange={(event) => setVigenciaInicial(event.currentTarget.value)} /></label>
        <label>VigenciaFinal<input type="date" value={vigenciaFinal ? vigenciaFinal.substring(0, 10) : ''} onChange={(event) => setVigenciaFinal(event.currentTarget.value)} /></label>
        <label>Observações<textarea value={observacoes} onChange={(event) => setObservacoes(event.currentTarget.value)} /></label>
        <label>Justificativa<textarea value={justificativa} onChange={(event) => setJustificativa(event.currentTarget.value)} /></label>
        <label>Confirmação final<input value={confirmacaoFinal} onChange={(event) => setConfirmacaoFinal(event.currentTarget.value)} /></label>
        <label>Pré-validação<textarea readOnly value={`${preValidacao.mensagem}\nAlertas: ${preValidacao.alertas.map((alerta) => alerta.codigo).join(', ') || '-'}`} /></label>
        <label>Payload previsto<textarea readOnly value={JSON.stringify(preValidacao.payloadPrevisto || {}, null, 2)} /></label>
        <button type="button" disabled={!podeSalvar || executando} onClick={executar}>Salvar alçada V2.9C</button>
        {resultado && <span>{resultado.bloqueado ? 'Bloqueada' : 'Executada'}: {resultado.mensagem}</span>}
      </form>
      <table>
        <thead><tr><th>Regra</th><th>Processo</th><th>Tipo</th><th>Faixa</th><th>Aprovador</th><th>Prévia de limite</th><th>Status</th></tr></thead>
        <tbody>
          {alcadas.map((item) => (
            <tr key={item.id}>
              <td>{item.regraInternaId || item.id}</td>
              <td>{item.processo}</td>
              <td>{item.tipoSolicitacao}</td>
              <td>{formatCurrency(item.valorMinimo)}<br />{item.ilimitado ? 'Ilimitado' : formatCurrency(item.valorMaximo)}</td>
              <td>{formatDisplayName(item.aprovadorPrincipalNome || item.aprovadorPrincipalId || '-')}</td>
              <td>
                <input value={item.ilimitado ? 'Ilimitado' : String(item.valorMaximo || '')} disabled aria-label={`Limite técnico de ${item.regraInternaId || item.id}`} />
              </td>
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
      <h2>Histórico do processo</h2>
      <p>{selected.id} - {selected.titulo}</p>
      {selected.historico.map((evento, index) => (
        <div className={styles.row} key={index}>
          <strong>{evento.descricao}</strong>
          <span>{formatDisplayName(evento.autor)} - {evento.statusNovo}</span>
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
            <td><StatusChip status={item.status} /></td>
            <td>{formatCurrency(item.cotacao?.valorRecomendado)}</td>
            <td><button onClick={() => onSelect(item.id)}>Abrir</button></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StatusChip({ status }: { status: string }): JSX.Element {
  return <span className={`${styles.statusChip} ${statusClassName(status)}`}>{status}</span>;
}

function statusClassName(status: string): string {
  const normalizado = normalizarStatusReadonly(status);

  if (['aprovadaparacompra', 'aprovado', 'aprovadoparapagamento', 'pago', 'pagoconcluido', 'entreguetotal'].indexOf(normalizado) >= 0) {
    return styles.statusSuccess;
  }

  if (['aguardandoaprovacao', 'aguardandocotacao', 'emcotacao', 'emelaboracao', 'recebida', 'programado', 'aguardandoentrega', 'aguardandoliberacaobancaria'].indexOf(normalizado) >= 0) {
    return styles.statusWarning;
  }

  if (['reprovada', 'cancelada', 'cancelado', 'vencido', 'suspenso'].indexOf(normalizado) >= 0) {
    return styles.statusDanger;
  }

  return styles.statusNeutral;
}

function calcularRegra(alcadas: IAlcadaEnac[], valor: number): IAlcadaEnac {
  return alcadas.find((item) => item.processo === 'Compra' && item.ativa && valor >= item.valorMinimo && (item.ilimitado || !item.valorMaximo || valor <= item.valorMaximo)) || alcadas[0];
}
