const STORAGE_KEYS = {
  users: "enac.users.v2",
  approvalRules: "enac.approvalRules.v2",
  adminAudit: "enac.adminAudit.v2"
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value || 0));

const statuses = {
  created: "Solicitação criada",
  awaitingQuote: "Aguardando cotação",
  quoting: "Em cotação",
  awaitingApproval: "Aguardando aprovação",
  approved: "Aprovada para compra",
  orderIssued: "Pedido emitido",
  awaitingInvoice: "Compra realizada / Aguardando NF",
  invoiceLinked: "NF vinculada",
  paymentScheduled: "Pagamento programado no banco",
  awaitingBankRelease: "Aguardando liberação bancária",
  paymentReleased: "Pagamento liberado",
  completed: "Pago / Concluído",
  rejected: "Reprovada",
  cancelled: "Cancelada",
  divergence: "Divergência identificada"
};

const profileOptions = [
  "Campo / Engenheiro",
  "Cotações e Contratos",
  "Compras e Financeiro Operacional",
  "Planejamento",
  "Diretoria",
  "Administrador do Sistema"
];

const profiles = {
  campo: { label: "Campo / Engenheiro", userId: "usr-campo", modules: ["dashboard", "new", "mine", "detail", "history"] },
  kemilly: { label: "Cotações e Contratos / Kemilly", userId: "usr-kemilly", modules: ["dashboard", "mine", "quotes", "detail", "history"] },
  matheus: { label: "Compras e Financeiro Operacional / Matheus", userId: "usr-matheus", modules: ["dashboard", "mine", "purchaseOrder", "execution", "invoice", "bankSchedule", "detail", "history"] },
  gustavo: { label: "Planejamento / Gustavo", userId: "usr-gustavo", modules: ["dashboard", "mine", "approvals", "detail", "history"] },
  leon: { label: "Diretoria / Leon", userId: "usr-leon", modules: ["dashboard", "mine", "approvals", "bankRelease", "detail", "history"] },
  administrador: { label: "Administrador do Sistema / Leon", userId: "usr-leon", modules: ["dashboard", "adminUsers", "adminApprovals", "adminSpecialRules", "adminParameters", "adminHistory"] }
};

const navItems = [
  ["dashboard", "Dashboard inicial"],
  ["new", "Nova solicitação"],
  ["mine", "Minhas solicitações"],
  ["quotes", "Cotações"],
  ["approvals", "Aprovações pendentes"],
  ["purchaseOrder", "Pedido de compra"],
  ["execution", "Execução da compra"],
  ["invoice", "Nota fiscal"],
  ["bankSchedule", "Programação bancária"],
  ["bankRelease", "Liberação bancária"],
  ["detail", "Detalhe do processo"],
  ["history", "Histórico"],
  ["adminUsers", "Administração / Usuários e Perfis"],
  ["adminApprovals", "Administração / Alçadas"],
  ["adminSpecialRules", "Administração / Regras Especiais"],
  ["adminParameters", "Administração / Parâmetros Gerais"],
  ["adminHistory", "Administração / Histórico"]
];

const obras = [
  { nome: "Obra Alpha", codigo: "OBR-001", cliente: "Cliente Alpha", centro: "CC-1101", entrega: "Canteiro Alpha - Portaria 2" },
  { nome: "Retrofit Galpão Sul", codigo: "OBR-014", cliente: "Indústria Sul", centro: "CC-2214", entrega: "Galpão Sul - Docas" },
  { nome: "Ampliação Unidade Norte", codigo: "OBR-022", cliente: "Grupo Norte", centro: "CC-3022", entrega: "Unidade Norte - Almoxarifado" }
];

const defaultUsers = [
  userRecord("usr-leon", "Leon", "leon@enac.com.br", "Diretor", "Diretoria", ["Administrador do Sistema"], { approve: true, release: true, finalStatus: true, admin: true }),
  userRecord("usr-gustavo", "Gustavo", "gustavo@enac.com.br", "Planejamento", "Planejamento", [], { approve: true }),
  userRecord("usr-matheus", "Matheus", "matheus@enac.com.br", "Compras e financeiro operacional", "Compras e Financeiro Operacional", [], { order: true, nf: true, schedule: true }),
  userRecord("usr-kemilly", "Kemilly", "kemilly@enac.com.br", "Cotações e contratos", "Cotações e Contratos", [], { quotes: true }),
  userRecord("usr-campo", "Engenheiro Teste", "campo@enac.com.br", "Engenheiro de campo", "Campo / Engenheiro", [], { create: true })
];

const defaultApprovalRules = [
  approvalRule("alc-compra-gustavo", "Compra", "Todos", "Todas", 0, 20000, "usr-gustavo", "", false, "", "2026-06-02", "", true, "Parâmetro inicial editável."),
  approvalRule("alc-compra-leon", "Compra", "Todos", "Todas", 20000.01, null, "usr-leon", "", false, "", "2026-06-02", "", true, "Parâmetro inicial editável."),
  approvalRule("alc-liberacao-leon", "Liberação Bancária", "Todos", "Todas", 0, null, "usr-leon", "", false, "", "2026-06-02", "", true, "Liberação bancária exclusiva de Leon.")
];

let users = loadStored(STORAGE_KEYS.users, defaultUsers);
let approvalRules = loadStored(STORAGE_KEYS.approvalRules, defaultApprovalRules);
let adminAudit = loadStored(STORAGE_KEYS.adminAudit, [
  auditRecord("Alçada", "Carga inicial", "Configuração inicial", "Compra até R$ 20.000,00 com Gustavo; acima com Leon", "Parâmetro beta editável do MVP."),
  auditRecord("Usuário", "Carga inicial", "-", "Usuários simulados iniciais cadastrados", "Base local do protótipo.")
]);

let specialRules = [
  { key: "Quantidade padrão de cotações", value: "3", route: "Kemilly", block: false },
  { key: "Permitir menos de 3 cotações", value: "Sim, apenas com justificativa obrigatória", route: "Kemilly", block: false },
  { key: "Compra emergencial", value: "Exigir justificativa e encaminhar para Leon", route: "Leon", block: false },
  { key: "Alteração de fornecedor após aprovação", value: "Gerar divergência e encaminhar para Leon", route: "Leon", block: false },
  { key: "Alteração de valor após aprovação", value: "Gerar divergência e encaminhar para Leon", route: "Leon", block: false },
  { key: "NF divergente do pedido aprovado", value: "Bloquear continuidade normal e encaminhar para Leon", route: "Leon", block: true },
  { key: "Liberação bancária de qualquer valor", value: "Exclusiva de Leon", route: "Leon", block: false },
  { key: "Matheus aprovar a própria compra", value: "Bloqueado", route: "Sistema", block: true }
];

let generalParameters = {
  types: ["Material", "Serviço", "Locação", "Equipamento"],
  priorities: ["Normal", "Alta", "Emergencial"],
  units: ["un", "m", "m²", "m³", "kg", "serviço", "diária"],
  statuses: Object.values(statuses),
  defaultQuotes: 3,
  attachments: "Solicitação: foto/projeto/referência. Cotação: proposta/e-mail. NF: arquivo da NF e boleto/dados de pagamento."
};

let currentProfile = "campo";
let currentView = "dashboard";
let selectedId = "REQ-1002";
let selectedUserId = users[0]?.id || "";
let selectedRuleId = approvalRules[0]?.id || "";

let requests = [
  demoApprovedSnapshotRequest(),
  {
    id: "REQ-1002",
    title: "Locação de martelete",
    obra: obras[1],
    type: "Locação",
    description: "Locação por dois dias para demolição controlada.",
    specification: "Martelete rompedor SDS Max, energia mínima 15J, com ponteiros.",
    quantity: 2,
    unit: "diária",
    serviceFront: "Demolição controlada - doca 3",
    needDate: "2026-06-05",
    priority: "Normal",
    urgencyReason: "",
    attachment: "",
    notes: "Enviar com EPI e cabo em bom estado.",
    requester: "Engenheiro Teste",
    requesterId: "usr-campo",
    createdAt: now(),
    status: statuses.awaitingQuote,
    quotes: [],
    recommendedSupplier: "",
    recommendedValue: 0,
    recommendedDeadline: "",
    recommendedPaymentTerms: "",
    recommendationReason: "",
    incompleteQuoteReason: "",
    approvedBy: "",
    approvedById: "",
    purchaseOrderNumber: "",
    purchaseOrderDate: "",
    supplierCnpj: "",
    confirmedDelivery: "",
    deliveryAddress: obras[1].entrega,
    supplierContact: "",
    purchaseOrderAttachment: "",
    purchaseNotes: "",
    invoice: blankInvoice(),
    bankSchedule: blankBankSchedule(),
    divergences: [],
    ruleSnapshot: null,
    history: [
      event("Solicitação criada", "Engenheiro Teste", statuses.created, "Dados internos preenchidos automaticamente."),
      event("Entrada na fila de cotações", "Sistema", statuses.awaitingQuote, "Aguardando Kemilly.")
    ]
  },
  {
    id: "REQ-1003",
    title: "Quadro elétrico provisório",
    obra: obras[2],
    type: "Equipamento",
    description: "Quadro elétrico provisório para frente de serviço norte.",
    specification: "Quadro trifásico 63A com disjuntores e barramento conforme NR-10.",
    quantity: 1,
    unit: "un",
    serviceFront: "Frente Norte",
    needDate: "2026-06-10",
    priority: "Normal",
    urgencyReason: "",
    attachment: "croqui-eletrico.pdf",
    notes: "Compatibilizar com entrada provisória.",
    requester: "Engenheiro Teste",
    requesterId: "usr-campo",
    createdAt: now(),
    status: statuses.awaitingApproval,
    quotes: [quote("Elétrica Norte", 21450, "2026-06-09", "R$ 300,00", "30 dias boleto", "proposta-eletrica.pdf")],
    recommendedSupplier: "Elétrica Norte",
    recommendedValue: 21450,
    recommendedDeadline: "2026-06-09",
    recommendedPaymentTerms: "30 dias boleto",
    recommendationReason: "Fornecedor disponível e equipamento compatível.",
    incompleteQuoteReason: "Item específico com disponibilidade limitada no prazo da obra.",
    approvedBy: "",
    approvedById: "",
    purchaseOrderNumber: "",
    purchaseOrderDate: "",
    supplierCnpj: "98.765.432/0001-10",
    confirmedDelivery: "",
    deliveryAddress: obras[2].entrega,
    supplierContact: "",
    purchaseOrderAttachment: "",
    purchaseNotes: "",
    invoice: blankInvoice(),
    bankSchedule: blankBankSchedule(),
    divergences: [],
    ruleSnapshot: createSnapshot(21450, defaultApprovalRules[1], ""),
    history: [
      event("Solicitação criada", "Engenheiro Teste", statuses.created, "Solicitação técnica registrada."),
      event("Cotação incompleta justificada", "Kemilly", statuses.quoting, "Fornecedor único disponível no prazo."),
      event("Snapshot da regra aplicado", "Sistema", statuses.awaitingApproval, "Compra acima do limite inicial encaminhada para Leon.")
    ]
  }
];

function userRecord(id, name, email, role, mainProfile, extraProfiles, permissions = {}) {
  return {
    id,
    name,
    email,
    role,
    mainProfile,
    extraProfiles,
    create: Boolean(permissions.create),
    quotes: Boolean(permissions.quotes),
    approve: Boolean(permissions.approve),
    order: Boolean(permissions.order),
    nf: Boolean(permissions.nf),
    schedule: Boolean(permissions.schedule),
    release: Boolean(permissions.release),
    finalStatus: Boolean(permissions.finalStatus),
    admin: Boolean(permissions.admin),
    active: true,
    substituteId: "",
    substituteStart: "",
    substituteEnd: "",
    notes: "",
    createdBy: "Leon",
    createdAt: now(),
    updatedBy: "Leon",
    updatedAt: now()
  };
}

function approvalRule(id, process, type, obra, min, max, approverId, substituteId, additional, additionalApproverId, start, end, active, notes) {
  return {
    id,
    process,
    type,
    obra,
    min,
    max,
    approverId,
    substituteId,
    additional,
    additionalApproverId,
    start,
    end,
    active,
    notes,
    updatedBy: "Leon",
    updatedAt: now()
  };
}

function demoApprovedSnapshotRequest() {
  const rule = defaultApprovalRules[0];
  const snapshot = createSnapshot(6720, rule, "");
  return {
    id: "REQ-1001",
    title: "Telas para proteção de periferia",
    obra: obras[0],
    type: "Material",
    description: "Tela de proteção para periferia da laje.",
    specification: "Tela fachadeira reforçada, malha 3x3 mm, com amarração.",
    quantity: 120,
    unit: "m²",
    serviceFront: "Laje bloco A",
    needDate: "2026-06-08",
    priority: "Normal",
    urgencyReason: "",
    attachment: "referencia-tela.pdf",
    notes: "Compra demonstrativa para validar snapshot não retroativo.",
    requester: "Engenheiro Teste",
    requesterId: "usr-campo",
    createdAt: now(),
    status: statuses.approved,
    quotes: [
      quote("Protege Obra", 6720, "2026-06-07", "CIF incluso", "28 dias boleto", "proposta-protege.pdf"),
      quote("Seg Lajes", 6980, "2026-06-08", "R$ 180,00", "30 dias boleto", "proposta-seg.pdf"),
      quote("Rede Forte", 7250, "2026-06-07", "CIF incluso", "21 dias boleto", "proposta-rede.pdf")
    ],
    recommendedSupplier: "Protege Obra",
    recommendedValue: 6720,
    recommendedDeadline: "2026-06-07",
    recommendedPaymentTerms: "28 dias boleto",
    recommendationReason: "Menor valor com entrega dentro da necessidade da obra.",
    incompleteQuoteReason: "",
    approvedBy: "Gustavo",
    approvedById: "usr-gustavo",
    purchaseOrderNumber: "",
    purchaseOrderDate: "",
    supplierCnpj: "11.111.111/0001-11",
    confirmedDelivery: "",
    deliveryAddress: obras[0].entrega,
    supplierContact: "",
    purchaseOrderAttachment: "",
    purchaseNotes: "",
    invoice: blankInvoice(),
    bankSchedule: blankBankSchedule(),
    divergences: [],
    ruleSnapshot: snapshot,
    history: [
      event("Solicitação criada", "Engenheiro Teste", statuses.created, "Dados técnicos registrados pela obra."),
      event("Propostas registradas", "Kemilly", statuses.quoting, "Três propostas registradas."),
      event("Snapshot da regra aplicado", "Sistema", statuses.awaitingApproval, `${snapshot.summary}; aprovador ${snapshot.approverName}; valor ${formatCurrency(snapshot.value)}.`),
      event("Compra aprovada", "Gustavo", statuses.approved, "Aprovação mantida mesmo se a alçada for alterada depois.")
    ]
  };
}

function loadStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveStored(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function persistAdminData() {
  saveStored(STORAGE_KEYS.users, users);
  saveStored(STORAGE_KEYS.approvalRules, approvalRules);
  saveStored(STORAGE_KEYS.adminAudit, adminAudit);
}

function auditRecord(type, action, before, after, reason = "") {
  return {
    type,
    action,
    before,
    after,
    user: "Leon",
    date: now(),
    reason
  };
}

function now() {
  return new Date().toLocaleString("pt-BR");
}

function formatDate(value) {
  if (!value) return "-";
  const datePart = String(value).includes("T") ? String(value).slice(0, 10) : String(value).split(",")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const [year, month, day] = datePart.split("-");
    return `${day}/${month}/${year}`;
  }
  return String(value);
}

function quote(supplier, value, deadline, freight, paymentTerms, attachment) {
  return { supplier, value, deadline, freight, paymentTerms, attachment };
}

function blankInvoice() {
  return { number: "", series: "", issueDate: "", dueDate: "", gross: 0, deductions: 0, net: 0, attachment: "", paymentDoc: "", divergenceNote: "" };
}

function blankBankSchedule() {
  return { account: "", method: "", date: "", value: 0, receipt: "", notes: "" };
}

function event(description, author, status, observation = "") {
  return { description, author, status, observation, date: now() };
}

function userById(id) {
  return users.find((user) => user.id === id);
}

function activeUsers() {
  return users.filter((user) => user.active);
}

function currentUser() {
  return userById(profiles[currentProfile].userId) || users[0];
}

function canSee(view) {
  return profiles[currentProfile].modules.includes(view);
}

function applicableRules(process = "Compra") {
  return approvalRules.filter((rule) => rule.active && rule.process === process && hasValidVigency(rule));
}

function hasValidVigency(rule) {
  if (!rule.start) return false;
  return !rule.end || rule.end >= rule.start;
}

function findApprovalRule(value, process = "Compra", exception = "") {
  const rules = applicableRules(process);
  if (exception) {
    const leon = users.find((user) => user.name === "Leon" && user.active);
    return rules.find((rule) => rule.approverId === leon?.id) || null;
  }
  return rules.find((rule) => value >= Number(rule.min || 0) && (rule.max === null || rule.max === "" || value <= Number(rule.max))) || null;
}

function createSnapshot(value, rule, exceptionReason) {
  const approver = userById(rule.approverId) || {};
  const range = `${formatCurrency(rule.min)} até ${rule.max === null || rule.max === "" ? "ilimitado" : formatCurrency(rule.max)}`;
  return {
    ruleId: rule.id,
    summary: `${rule.process} / ${rule.type} / ${rule.obra} / ${range}`,
    process: rule.process,
    range,
    value,
    approverId: approver.id || rule.approverId,
    approverName: approver.name || "Aprovador não localizado",
    approverEmail: approver.email || "",
    exceptionReason,
    submittedAt: now()
  };
}

function statusClass(status) {
  if (status.includes("Concluído") || status.includes("liberado") || status.includes("Aprovada")) return "ok";
  if (status.includes("Reprovada") || status.includes("Cancelada") || status.includes("Divergência")) return "danger";
  if (status.includes("Aguardando") || status.includes("cotação") || status.includes("programado")) return "warn";
  return "";
}

function pill(status) {
  return `<span class="status ${statusClass(status)}">${status}</span>`;
}

function selected() {
  return requests.find((item) => item.id === selectedId) || requests[0];
}

function currencyInput(id, value, attrs = "") {
  return `<div class="currency-field"><span>R$</span><input id="${id}" type="number" min="0" step="0.01" value="${Number(value || 0)}" ${attrs}></div>`;
}

function dataCurrencyInput(dataAttrs, value, attrs = "") {
  return `<div class="currency-field"><span>R$</span><input ${dataAttrs} type="number" min="0" step="0.01" value="${value || ""}" ${attrs}></div>`;
}

function userOptions(selectedIdValue = "", includeEmpty = true) {
  const empty = includeEmpty ? `<option value="">-</option>` : "";
  return `${empty}${activeUsers().map((user) => `<option value="${user.id}" ${user.id === selectedIdValue ? "selected" : ""}>${user.name} (${user.email})</option>`).join("")}`;
}

function setView(view) {
  currentView = canSee(view) ? view : "dashboard";
  const nav = navItems.find(([key]) => key === currentView) || navItems[0];
  document.querySelector("#page-title").textContent = nav[1];
  document.querySelectorAll(".nav-button").forEach((button) => button.classList.toggle("active", button.dataset.view === currentView));
  const renderers = { dashboard, new: newRequest, mine, quotes, approvals, purchaseOrder, execution, invoice, bankSchedule, bankRelease, detail, history, adminUsers, adminApprovals, adminSpecialRules, adminParameters, adminHistory };
  document.querySelector("#view").innerHTML = renderers[currentView]();
  bindView();
}

function dashboard() {
  const cardsByProfile = {
    campo: [
      ["Minhas solicitações", requests.filter((item) => item.requesterId === currentUser().id).length],
      ["Aguardando cotação", count(statuses.awaitingQuote)],
      ["Aprovadas", count(statuses.approved)],
      ["Reprovadas", count(statuses.rejected)]
    ],
    kemilly: [
      ["Aguardando cotação", count(statuses.awaitingQuote)],
      ["Cotações em elaboração", count(statuses.quoting)],
      ["Pendentes de justificativa", requests.filter((item) => item.quotes.length > 0 && item.quotes.length < generalParameters.defaultQuotes && !item.incompleteQuoteReason).length],
      ["Contratos futuros", "Backlog"]
    ],
    matheus: [
      ["Aguardando pedido", count(statuses.approved)],
      ["Pedidos aguardando NF", count(statuses.awaitingInvoice)],
      ["NFs aguardando programação", count(statuses.invoiceLinked)],
      ["Aguardando liberação", count(statuses.awaitingBankRelease)]
    ],
    gustavo: [
      ["Aprovações atribuídas", assignedApprovals("usr-gustavo").length],
      ["Análise técnica", requests.filter((item) => item.priority === "Emergencial").length],
      ["Cotações aguardando aprovação", count(statuses.awaitingApproval)],
      ["Valor em análise", formatCurrency(totalAssigned("usr-gustavo"))]
    ],
    leon: [
      ["Aprovações atribuídas", assignedApprovals("usr-leon").length],
      ["Exceções e divergências", requests.filter((item) => item.divergences.length || item.ruleSnapshot?.exceptionReason).length],
      ["Pagamentos aguardando liberação", count(statuses.awaitingBankRelease)],
      ["Pago / Concluído", formatCurrency(requests.filter((item) => item.status === statuses.completed).reduce((sum, item) => sum + (item.invoice.net || 0), 0))]
    ],
    administrador: [
      ["Usuários ativos", users.filter((user) => user.active).length],
      ["Alçadas ativas", approvalRules.filter((rule) => rule.active).length],
      ["Regras especiais", specialRules.length],
      ["Auditorias", adminAudit.length]
    ]
  };
  const cards = cardsByProfile[currentProfile] || cardsByProfile.campo;
  const audit = currentProfile === "leon" ? `<div class="card"><h2>Últimas alterações administrativas</h2>${adminAuditTable(adminAudit.slice(0, 3))}</div>` : "";
  return `
    <div class="grid cols-4">${cards.map(([label, value]) => `<div class="card metric"><span>${label}</span><strong>${value}</strong></div>`).join("")}</div>
    <div class="card">
      <h2>Ações do perfil</h2>
      <div class="actions">
        ${canSee("new") ? '<button class="button" data-go="new">Nova solicitação</button>' : ""}
        ${canSee("quotes") ? '<button class="button secondary" data-go="quotes">Abrir cotações</button>' : ""}
        ${canSee("approvals") ? '<button class="button secondary" data-go="approvals">Ver aprovações</button>' : ""}
        ${canSee("purchaseOrder") ? '<button class="button secondary" data-go="purchaseOrder">Emitir pedido</button>' : ""}
        ${canSee("bankRelease") ? '<button class="button secondary" data-go="bankRelease">Liberar pagamentos</button>' : ""}
        ${currentProfile === "leon" ? '<button class="button secondary" data-profile="administrador">Administração</button>' : ""}
      </div>
    </div>
    ${audit}
    <div class="card"><h2>Fluxo oficial do MVP</h2><p class="hint">Solicitação da obra -> cotação -> aprovação -> pedido -> compra -> NF -> programação bancária -> liberação -> conclusão.</p>${requestTable(requests)}</div>
  `;
}

function count(status) {
  return requests.filter((item) => item.status === status).length;
}

function assignedApprovals(userId) {
  return requests.filter((item) => item.status === statuses.awaitingApproval && item.ruleSnapshot?.approverId === userId);
}

function totalAssigned(userId) {
  return assignedApprovals(userId).reduce((sum, item) => sum + item.recommendedValue, 0);
}

function newRequest() {
  return `
    <div class="card"><form id="request-form">
      <div class="grid cols-2">
        <div class="field"><label for="obra">Obra</label><select id="obra" required>${obras.map((obra) => `<option value="${obra.codigo}">${obra.nome}</option>`).join("")}</select></div>
        <div class="field"><label for="type">Tipo de solicitação</label><select id="type">${generalParameters.types.map((item) => `<option>${item}</option>`).join("")}</select></div>
      </div>
      <div class="grid cols-3">
        <div class="field"><label>Código da obra<input id="codigo" class="readonly" readonly></label></div>
        <div class="field"><label>Cliente<input id="cliente" class="readonly" readonly></label></div>
        <div class="field"><label>Centro de custo<input id="centro" class="readonly" readonly></label></div>
      </div>
      <div class="field"><label for="title">Descrição do item/serviço<input id="title" required placeholder="Ex.: Perfil metálico para contenção"></label></div>
      <div class="field"><label for="specification">Especificação técnica<textarea id="specification" required placeholder="Modelo, norma, dimensão, desempenho esperado ou referência técnica."></textarea></label></div>
      <div class="grid cols-3">
        <div class="field"><label for="quantity">Quantidade<input id="quantity" type="number" min="0" step="0.01"></label></div>
        <div class="field"><label for="unit">Unidade<select id="unit">${generalParameters.units.map((item) => `<option>${item}</option>`).join("")}</select></label></div>
        <div class="field"><label for="needDate">Data necessária na obra<input id="needDate" type="date" required></label></div>
      </div>
      <div class="grid cols-2">
        <div class="field"><label for="serviceFront">Frente de serviço/local de aplicação<input id="serviceFront" required></label></div>
        <div class="field"><label for="priority">Prioridade<select id="priority">${generalParameters.priorities.map((item) => `<option>${item}</option>`).join("")}</select></label></div>
      </div>
      <div class="field"><label for="urgencyReason">Justificativa da urgência<textarea id="urgencyReason" placeholder="Obrigatória para prioridade alta ou emergencial."></textarea></label></div>
      <div class="field"><label for="attachment">Anexo/foto/projeto/referência<input id="attachment" placeholder="Nome ou link do anexo"></label></div>
      <div class="field"><label for="notes">Observações<textarea id="notes"></textarea></label></div>
      <div class="grid cols-2">
        <div class="field"><label>Solicitante<input class="readonly" value="${currentUser().name}" readonly></label></div>
        <div class="field"><label>Data/hora<input class="readonly" value="${now()}" readonly></label></div>
      </div>
      <button class="button" type="submit">Enviar para cotação</button>
    </form></div>
  `;
}

function mine() {
  const items = currentProfile === "campo" ? requests.filter((item) => item.requesterId === currentUser().id) : requests;
  return `<div class="card"><h2>Processos do perfil</h2>${requestTable(items)}</div>`;
}

function quotes() {
  const items = requests.filter((item) => [statuses.awaitingQuote, statuses.quoting].includes(item.status));
  return `<div class="grid cols-2"><div class="card"><h2>Fila de cotações</h2>${requestTable(items)}</div>${quoteForm()}</div>`;
}

function quoteForm() {
  const item = selected();
  const quoteRows = [0, 1, 2].map((index) => {
    const q = item.quotes[index] || quote("", 0, "", "", "", "");
    return `<fieldset class="panel-fieldset"><legend>Proposta ${index + 1}</legend>
      <div class="grid cols-2"><div class="field"><label>Fornecedor<input data-quote="${index}" data-field="supplier" value="${q.supplier}"></label></div><div class="field"><label>Valor${dataCurrencyInput(`data-quote="${index}" data-field="value"`, q.value)}</label></div></div>
      <div class="grid cols-3"><div class="field"><label>Prazo<input data-quote="${index}" data-field="deadline" type="date" value="${q.deadline}"></label></div><div class="field"><label>Frete<input data-quote="${index}" data-field="freight" value="${q.freight}"></label></div><div class="field"><label>Condição de pagamento<input data-quote="${index}" data-field="paymentTerms" value="${q.paymentTerms}"></label></div></div>
      <div class="field"><label>Anexo/link da proposta<input data-quote="${index}" data-field="attachment" value="${q.attachment}"></label></div>
    </fieldset>`;
  }).join("");
  return `
    <div class="card"><h2>Cotação por Kemilly</h2><form id="quote-form">
      ${readonlyRequest(item)}
      ${quoteRows}
      <div class="grid cols-2">
        <div class="field"><label>Fornecedor recomendado<input id="recommendedSupplier" value="${item.recommendedSupplier}" required></label></div>
        <div class="field"><label>Valor recomendado${currencyInput("recommendedValue", item.recommendedValue, "required")}</label></div>
      </div>
      <div class="grid cols-2">
        <div class="field"><label>Prazo recomendado<input id="recommendedDeadline" type="date" value="${item.recommendedDeadline}"></label></div>
        <div class="field"><label>Condição recomendada<input id="recommendedPaymentTerms" value="${item.recommendedPaymentTerms}"></label></div>
      </div>
      <div class="field"><label>Justificativa da recomendação<textarea id="recommendationReason" required>${item.recommendationReason}</textarea></label></div>
      <div class="field"><label>Justificativa para menos de três propostas<textarea id="incompleteQuoteReason">${item.incompleteQuoteReason}</textarea></label></div>
      <button class="button" type="submit">Encaminhar para aprovação</button>
    </form></div>
  `;
}

function approvals() {
  const visible = currentProfile === "gustavo" ? assignedApprovals("usr-gustavo") : currentProfile === "leon" ? assignedApprovals("usr-leon").concat(requests.filter((item) => item.status === statuses.divergence)) : requests.filter((item) => item.status === statuses.awaitingApproval);
  return `<div class="card"><h2>Aprovações pendentes</h2>${approvalTable(visible)}</div>`;
}

function purchaseOrder() {
  const items = requests.filter((item) => item.status === statuses.approved || item.status === statuses.orderIssued);
  return `<div class="grid cols-2"><div class="card"><h2>Compras aprovadas aguardando pedido</h2>${requestTable(items)}</div>${purchaseOrderForm()}</div>`;
}

function purchaseOrderForm() {
  const item = selected();
  return `<div class="card"><h2>Pedido de compra por Matheus</h2><form id="order-form">
    ${readonlyApproved(item)}
    <div class="grid cols-2"><div class="field"><label>Número do pedido<input id="purchaseOrderNumber" value="${item.purchaseOrderNumber}" required></label></div><div class="field"><label>Data do pedido<input id="purchaseOrderDate" type="date" value="${item.purchaseOrderDate}" required></label></div></div>
    <div class="grid cols-2"><div class="field"><label>Prazo de entrega confirmado<input id="confirmedDelivery" type="date" value="${item.confirmedDelivery}" required></label></div><div class="field"><label>Valor do pedido${currencyInput("purchaseOrderValue", item.recommendedValue, "required")}</label></div></div>
    <div class="field"><label>Endereço/local de entrega<input id="deliveryAddress" value="${item.deliveryAddress}" required></label></div>
    <div class="grid cols-2"><div class="field"><label>Contato do fornecedor<input id="supplierContact" value="${item.supplierContact}"></label></div><div class="field"><label>Anexo/link do pedido enviado<input id="purchaseOrderAttachment" value="${item.purchaseOrderAttachment}"></label></div></div>
    <div class="field"><label>Observações<textarea id="purchaseNotes">${item.purchaseNotes}</textarea></label></div>
    <button class="button" type="submit">Emitir pedido de compra</button>
  </form></div>`;
}

function execution() {
  const item = selected();
  return `<div class="card"><h2>Execução da compra por Matheus</h2>${readonlyApproved(item)}<div class="actions"><button class="button" data-execute="${item.id}">Registrar compra realizada</button><button class="button warning" data-divergence="${item.id}">Registrar divergência</button></div></div>`;
}

function invoice() {
  const item = selected();
  const net = Math.max(0, Number(item.invoice.gross || item.recommendedValue || 0) - Number(item.invoice.deductions || 0));
  return `<div class="card"><h2>Nota fiscal por Matheus</h2><form id="invoice-form">
    ${readonlyApproved(item)}
    <div class="grid cols-3"><div class="field"><label>Número da NF<input id="invoiceNumber" value="${item.invoice.number}" required></label></div><div class="field"><label>Série<input id="invoiceSeries" value="${item.invoice.series}"></label></div><div class="field"><label>Data de emissão<input id="invoiceIssueDate" type="date" value="${item.invoice.issueDate}" required></label></div></div>
    <div class="grid cols-3"><div class="field"><label>Data de vencimento<input id="invoiceDueDate" type="date" value="${item.invoice.dueDate}" required></label></div><div class="field"><label>Valor bruto${currencyInput("invoiceGross", item.invoice.gross || item.recommendedValue, "required")}</label></div><div class="field"><label>Retenções/descontos${currencyInput("invoiceDeductions", item.invoice.deductions || 0)}</label></div></div>
    <div class="grid cols-2"><div class="field"><label>Valor líquido calculado<input class="readonly" value="${formatCurrency(item.invoice.net || net)}" readonly></label></div><div class="field"><label>Anexar NF<input id="invoiceAttachment" value="${item.invoice.attachment}" placeholder="Nome ou link"></label></div></div>
    <div class="field"><label>Boleto ou dados de pagamento<input id="paymentDoc" value="${item.invoice.paymentDoc}" placeholder="Nome, link ou dados bancários"></label></div>
    <div class="field"><label>Observação de divergência<textarea id="divergenceNote">${item.invoice.divergenceNote}</textarea></label></div>
    <button class="button" type="submit">Vincular NF</button>
  </form></div>`;
}

function bankSchedule() {
  const item = selected();
  return `<div class="card"><h2>Programação bancária por Matheus</h2><form id="bank-form">
    <p><strong>NF vinculada:</strong> ${item.invoice.number || "-"}</p>
    ${readonlyFinancial(item)}
    <div class="grid cols-2"><div class="field"><label>Banco/conta de pagamento<input id="bankAccount" value="${item.bankSchedule.account}" required></label></div><div class="field"><label>Forma de pagamento<input id="paymentMethod" value="${item.bankSchedule.method || "Boleto"}" required></label></div></div>
    <div class="grid cols-2"><div class="field"><label>Data programada<input id="scheduledDate" type="date" value="${item.bankSchedule.date}" required></label></div><div class="field"><label>Valor programado${currencyInput("scheduledValue", item.bankSchedule.value || item.invoice.net, "required")}</label></div></div>
    <div class="field"><label>Comprovante de agendamento<input id="scheduleReceipt" value="${item.bankSchedule.receipt}"></label></div>
    <div class="field"><label>Observações<textarea id="scheduleNotes">${item.bankSchedule.notes}</textarea></label></div>
    <button class="button" type="submit">Programar pagamento no banco</button>
  </form></div>`;
}

function bankRelease() {
  const items = requests.filter((item) => [statuses.awaitingBankRelease, statuses.paymentReleased, statuses.divergence].includes(item.status));
  return `<div class="grid cols-2"><div class="card"><h2>Pagamentos aguardando liberação</h2>${requestTable(items)}</div>${bankReleasePanel()}</div>`;
}

function bankReleasePanel() {
  const item = selected();
  return `<div class="card"><h2>Liberação bancária por Leon</h2>
    ${readonlyFinancial(item)}
    <p><strong>Pedido aprovado por:</strong> ${item.approvedBy || "-"}</p>
    <p><strong>NF:</strong> ${item.invoice.number || "-"} / <strong>Vencimento:</strong> ${formatDate(item.invoice.dueDate)}</p>
    <p><strong>Data programada:</strong> ${formatDate(item.bankSchedule.date)} / <strong>Divergências:</strong> ${item.divergences.join("; ") || "-"}</p>
    <div class="actions">
      <button class="button" data-release="${item.id}">Liberar pagamento</button>
      <button class="button warning" data-correction="${item.id}">Solicitar correção</button>
      <button class="button danger" data-block="${item.id}">Bloquear pagamento</button>
      <button class="button secondary" data-confirm-paid="${item.id}">Confirmar pagamento realizado</button>
    </div>
  </div>`;
}

function detail() {
  const item = selected();
  return `<div class="grid cols-2"><div class="card"><h2>${item.id} - ${item.title}</h2>${processSummary(item)}</div><div class="card"><h2>Comercial e financeiro</h2>${commercialSummary(item)}${financialSummary(item)}</div></div>`;
}

function history() {
  const item = selected();
  return `<div class="grid cols-2">${detail()}<div class="card"><h2>Histórico completo</h2><div class="timeline">${item.history.map((entry) => `<div class="event"><strong>${entry.description}</strong><small>${entry.date} - ${entry.author} - ${entry.status}</small>${entry.observation ? `<p>${entry.observation}</p>` : ""}</div>`).join("")}</div></div></div>`;
}

function adminUsers() {
  const selectedUser = userById(selectedUserId) || users[0] || userRecord("", "", "", "", profileOptions[0], [], {});
  selectedUserId = selectedUser.id;
  const substituteOptions = userOptions(selectedUser.substituteId);
  return `<div class="grid cols-2">
    <div class="card"><h2>Usuários cadastrados</h2>${usersTable()}</div>
    <div class="card"><h2>Cadastro e manutenção</h2><form id="admin-user-form">
      <div class="grid cols-2"><div class="field"><label>ID interno<input id="userId" value="${selectedUser.id}" placeholder="gerado ao cadastrar novo"></label></div><div class="field"><label>Usuário ativo?<select id="userActive"><option value="true" ${selectedUser.active ? "selected" : ""}>Sim</option><option value="false" ${!selectedUser.active ? "selected" : ""}>Não</option></select></label></div></div>
      <div class="grid cols-2"><div class="field"><label>Nome completo<input id="userName" value="${selectedUser.name}" required></label></div><div class="field"><label>E-mail corporativo<input id="userEmail" type="email" value="${selectedUser.email}" required></label></div></div>
      <div class="field"><label>Cargo/função<input id="userRole" value="${selectedUser.role || ""}"></label></div>
      <div class="grid cols-2"><div class="field"><label>Perfil principal<select id="userMainProfile">${profileOptions.map((profile) => `<option value="${profile}" ${profile === selectedUser.mainProfile ? "selected" : ""}>${profile}</option>`).join("")}</select></label></div><div class="field"><label>Perfis adicionais<input id="userExtraProfiles" value="${(selectedUser.extraProfiles || []).join(", ")}" placeholder="separar por vírgula"></label></div></div>
      <fieldset class="panel-fieldset"><legend>Permissões</legend>
        <div class="check-grid">
          ${permissionCheckbox("create", "Pode criar solicitações?", selectedUser.create)}
          ${permissionCheckbox("approve", "Pode aprovar compras?", selectedUser.approve)}
          ${permissionCheckbox("quotes", "Pode registrar cotações?", selectedUser.quotes)}
          ${permissionCheckbox("order", "Pode emitir pedido de compra?", selectedUser.order)}
          ${permissionCheckbox("nf", "Pode vincular nota fiscal?", selectedUser.nf)}
          ${permissionCheckbox("schedule", "Pode programar pagamento?", selectedUser.schedule)}
          ${permissionCheckbox("release", "Pode liberar pagamento bancário?", selectedUser.release)}
          ${permissionCheckbox("admin", "Pode administrar configurações?", selectedUser.admin)}
        </div>
      </fieldset>
      <div class="grid cols-3"><div class="field"><label>Substituto temporário<select id="userSubstitute">${substituteOptions}</select></label></div><div class="field"><label>Início da substituição<input id="userSubstituteStart" type="date" value="${selectedUser.substituteStart || ""}"></label></div><div class="field"><label>Fim da substituição<input id="userSubstituteEnd" type="date" value="${selectedUser.substituteEnd || ""}"></label></div></div>
      <div class="field"><label>Observações<textarea id="userNotes">${selectedUser.notes || ""}</textarea></label></div>
      <p class="hint">Criado por ${selectedUser.createdBy || "-"} em ${selectedUser.createdAt || "-"}; alterado por ${selectedUser.updatedBy || "-"} em ${selectedUser.updatedAt || "-"}.</p>
      <div class="actions"><button class="button" type="submit">Salvar usuário</button><button class="button secondary" type="button" id="new-user">Novo usuário</button><button class="button warning" type="button" id="toggle-user">${selectedUser.active ? "Desativar" : "Ativar"} usuário</button></div>
    </form></div>
  </div>`;
}

function permissionCheckbox(id, label, checked) {
  return `<label class="checkbox-line"><input id="perm-${id}" type="checkbox" ${checked ? "checked" : ""}> ${label}</label>`;
}

function usersTable() {
  return `<div class="table-wrap"><table><thead><tr><th>Usuário</th><th>Perfil</th><th>Permissões</th><th>Substituto</th><th>Status</th><th></th></tr></thead><tbody>${users.map((user) => `<tr><td><strong>${user.name}</strong><br><small>${user.id} / ${user.email}</small></td><td>${user.mainProfile}<br><small>${(user.extraProfiles || []).join(", ") || "-"}</small></td><td>${permissions(user)}</td><td>${userById(user.substituteId)?.name || "-"}<br><small>${formatDate(user.substituteStart)} até ${formatDate(user.substituteEnd)}</small></td><td>${pill(user.active ? "Ativo" : "Inativo")}</td><td><button class="button secondary" data-edit-user="${user.id}">Editar</button></td></tr>`).join("")}</tbody></table></div>`;
}

function adminApprovals() {
  const selectedRule = approvalRules.find((rule) => rule.id === selectedRuleId) || approvalRules[0] || approvalRule("", "Compra", "Todos", "Todas", 0, null, "", "", false, "", "", "", true, "");
  selectedRuleId = selectedRule.id;
  return `<div class="grid cols-2">
    <div class="card"><h2>Lista/Matriz de Alçadas</h2>${approvalRulesTable()}${conflictPanel()}</div>
    <div class="card"><h2>Cadastro de alçada</h2><form id="admin-approval-form">
      <div class="grid cols-2"><div class="field"><label>ID/código da regra<input id="ruleId" value="${selectedRule.id}" placeholder="gerado ao cadastrar nova"></label></div><div class="field"><label>Regra ativa?<select id="ruleActive"><option value="true" ${selectedRule.active ? "selected" : ""}>Sim</option><option value="false" ${!selectedRule.active ? "selected" : ""}>Não</option></select></label></div></div>
      <div class="grid cols-3"><div class="field"><label>Processo<select id="ruleProcess">${["Compra", "Liberação Bancária", "Medição", "Pagamento", "Outro"].map((value) => `<option ${value === selectedRule.process ? "selected" : ""}>${value}</option>`).join("")}</select></label></div><div class="field"><label>Tipo<select id="ruleType">${["Todos", ...generalParameters.types].map((value) => `<option ${value === selectedRule.type ? "selected" : ""}>${value}</option>`).join("")}</select></label></div><div class="field"><label>Obra<select id="ruleObra"><option ${selectedRule.obra === "Todas" ? "selected" : ""}>Todas</option>${obras.map((obra) => `<option value="${obra.nome}" ${selectedRule.obra === obra.nome ? "selected" : ""}>${obra.nome}</option>`).join("")}</select></label></div></div>
      <div class="grid cols-2"><div class="field"><label>Valor inicial${currencyInput("ruleMin", selectedRule.min, "required")}</label></div><div class="field"><label>Valor final${currencyInput("ruleMax", selectedRule.max ?? "", "")}<small class="hint">Deixe vazio para ilimitado.</small></label></div></div>
      <div class="grid cols-2"><div class="field"><label>Aprovador principal<select id="ruleApprover" required>${userOptions(selectedRule.approverId, false)}</select></label></div><div class="field"><label>Aprovador substituto<select id="ruleSubstitute">${userOptions(selectedRule.substituteId)}</select></label></div></div>
      <div class="grid cols-2"><div class="field"><label>Exige aprovação adicional?<select id="ruleAdditional"><option value="false" ${!selectedRule.additional ? "selected" : ""}>Não</option><option value="true" ${selectedRule.additional ? "selected" : ""}>Sim</option></select></label></div><div class="field"><label>Aprovador adicional<select id="ruleAdditionalApprover">${userOptions(selectedRule.additionalApproverId)}</select></label></div></div>
      <div class="grid cols-2"><div class="field"><label>Vigência inicial<input id="ruleStart" type="date" value="${selectedRule.start || ""}" required></label></div><div class="field"><label>Vigência final<input id="ruleEnd" type="date" value="${selectedRule.end || ""}"></label></div></div>
      <div class="field"><label>Observações<textarea id="ruleNotes">${selectedRule.notes || ""}</textarea></label></div>
      <div class="field"><label>Justificativa da alteração<textarea id="ruleReason">Ajuste administrativo no protótipo.</textarea></label></div>
      <p class="hint">Alterado por ${selectedRule.updatedBy || "-"} em ${selectedRule.updatedAt || "-"}.</p>
      <div class="actions"><button class="button" type="submit">Salvar alçada</button><button class="button secondary" type="button" id="new-rule">Nova regra</button><button class="button warning" type="button" id="toggle-rule">${selectedRule.active ? "Desativar" : "Ativar"} regra</button></div>
    </form></div>
  </div>`;
}

function approvalRulesTable() {
  return `<div class="table-wrap"><table><thead><tr><th>Regra</th><th>Faixa</th><th>Aprovadores</th><th>Vigência</th><th>Status</th><th></th></tr></thead><tbody>${approvalRules.map((rule) => `<tr><td><strong>${rule.id}</strong><br>${rule.process} / ${rule.type} / ${rule.obra}</td><td>${formatCurrency(rule.min)} até ${rule.max === null || rule.max === "" ? "ilimitado" : formatCurrency(rule.max)}</td><td>${userById(rule.approverId)?.name || "Usuário não localizado"}<br><small>Subst.: ${userById(rule.substituteId)?.name || "-"} / Adic.: ${userById(rule.additionalApproverId)?.name || "-"}</small></td><td>${formatDate(rule.start)} até ${formatDate(rule.end)}</td><td>${pill(rule.active ? "Ativa" : "Inativa")}</td><td><button class="button secondary" data-edit-rule="${rule.id}">Editar</button></td></tr>`).join("")}</tbody></table></div>`;
}

function conflictPanel() {
  const conflicts = findRuleConflicts(approvalRules);
  return conflicts.length ? `<div class="alert-box"><strong>Conflitos de faixa</strong><p>${conflicts.join("<br>")}</p></div>` : `<p class="hint">Nenhum conflito ativo de faixa identificado.</p>`;
}

function findRuleConflicts(rules) {
  const active = rules.filter((rule) => rule.active && rule.process !== "Liberação Bancária");
  const conflicts = [];
  active.forEach((rule, index) => {
    active.slice(index + 1).forEach((other) => {
      const sameScope = rule.process === other.process && rule.type === other.type && rule.obra === other.obra;
      if (!sameScope) return;
      const ruleMax = rule.max === null || rule.max === "" ? Number.POSITIVE_INFINITY : Number(rule.max);
      const otherMax = other.max === null || other.max === "" ? Number.POSITIVE_INFINITY : Number(other.max);
      const overlaps = Number(rule.min) <= otherMax && Number(other.min) <= ruleMax;
      if (overlaps) conflicts.push(`${rule.id} sobrepõe ${other.id}`);
    });
  });
  return conflicts;
}

function adminSpecialRules() {
  return `<div class="card"><h2>Regras Especiais</h2><div class="grid cols-2">${specialRules.map((rule) => `<section class="config-block"><strong>${rule.key}</strong><p>${rule.value}</p><small>Encaminhar para: ${rule.route} ${rule.block ? "- bloqueia fluxo normal" : ""}</small></section>`).join("")}</div></div>`;
}

function adminParameters() {
  return `<div class="grid cols-2"><div class="card"><h2>Tipos de solicitação</h2><p>${generalParameters.types.join(", ")}</p></div><div class="card"><h2>Prioridades</h2><p>${generalParameters.priorities.join(", ")}</p></div><div class="card"><h2>Status oficiais</h2><p>${generalParameters.statuses.join(", ")}</p></div><div class="card"><h2>Cotações e anexos</h2><p>Quantidade padrão: ${generalParameters.defaultQuotes}</p><p>${generalParameters.attachments}</p></div></div>`;
}

function adminHistory() {
  return `<div class="card"><h2>Histórico de Configurações</h2>${adminAuditTable(adminAudit)}</div>`;
}

function readonlyRequest(item) {
  return `<section class="readonly-block"><strong>${item.id} - ${item.title}</strong><p>${item.obra.nome} / ${item.obra.codigo} / ${item.obra.centro}</p><p>${item.description}</p><p><strong>Especificação:</strong> ${item.specification}</p><p><strong>Quantidade:</strong> ${item.quantity || "-"} ${item.unit || ""} / <strong>Frente:</strong> ${item.serviceFront}</p><p><strong>Necessidade:</strong> ${formatDate(item.needDate)} / <strong>Prioridade:</strong> ${item.priority}</p>${item.urgencyReason ? `<p><strong>Urgência:</strong> ${item.urgencyReason}</p>` : ""}</section>`;
}

function readonlyApproved(item) {
  return `<section class="readonly-block">${readonlyRequest(item)}<p><strong>Fornecedor aprovado:</strong> ${item.recommendedSupplier || "-"} / <strong>CNPJ:</strong> ${item.supplierCnpj || "-"}</p><p><strong>Valor aprovado:</strong> ${formatCurrency(item.recommendedValue)} / <strong>Condição:</strong> ${item.recommendedPaymentTerms || "-"}</p></section>`;
}

function readonlyFinancial(item) {
  return `<section class="readonly-block"><p><strong>Obra:</strong> ${item.obra.nome} / ${item.obra.centro}</p><p><strong>Fornecedor:</strong> ${item.recommendedSupplier || "-"} / <strong>Pedido:</strong> ${item.purchaseOrderNumber || "-"}</p><p><strong>Valor líquido:</strong> ${formatCurrency(item.invoice.net)} / <strong>Status:</strong> ${item.status}</p><p><strong>Anexos:</strong> ${[item.purchaseOrderAttachment, item.invoice.attachment, item.invoice.paymentDoc, item.bankSchedule.receipt].filter(Boolean).join(", ") || "-"}</p></section>`;
}

function processSummary(item) {
  return `${pill(item.status)}<p><strong>Obra:</strong> ${item.obra.nome}</p><p><strong>Código:</strong> ${item.obra.codigo}</p><p><strong>Cliente:</strong> ${item.obra.cliente}</p><p><strong>Centro de custo:</strong> ${item.obra.centro}</p><p><strong>Solicitante:</strong> ${item.requester}</p><p><strong>Data necessária:</strong> ${formatDate(item.needDate)}</p><p><strong>Descrição:</strong> ${item.description}</p><p><strong>Especificação:</strong> ${item.specification}</p><p><strong>Quantidade:</strong> ${item.quantity || "-"} ${item.unit || ""}</p><p><strong>Frente:</strong> ${item.serviceFront}</p>`;
}

function commercialSummary(item) {
  const snapshot = item.ruleSnapshot ? `${item.ruleSnapshot.summary}; aprovador ${item.ruleSnapshot.approverName} (${item.ruleSnapshot.approverEmail}); valor ${formatCurrency(item.ruleSnapshot.value)}; aplicado em ${item.ruleSnapshot.submittedAt}` : "-";
  return `<p><strong>Fornecedor recomendado:</strong> ${item.recommendedSupplier || "-"}</p><p><strong>Valor recomendado:</strong> ${formatCurrency(item.recommendedValue)}</p><p><strong>Prazo recomendado:</strong> ${formatDate(item.recommendedDeadline)}</p><p><strong>Motivo:</strong> ${item.recommendationReason || "-"}</p><p><strong>Justificativa cotação incompleta:</strong> ${item.incompleteQuoteReason || "-"}</p><p><strong>Snapshot da regra:</strong> ${snapshot}</p>`;
}

function financialSummary(item) {
  return `<p><strong>Pedido:</strong> ${item.purchaseOrderNumber || "-"} / <strong>Data:</strong> ${formatDate(item.purchaseOrderDate)}</p><p><strong>NF:</strong> ${item.invoice.number || "-"}</p><p><strong>Valor bruto:</strong> ${formatCurrency(item.invoice.gross)} / <strong>Retenções:</strong> ${formatCurrency(item.invoice.deductions)}</p><p><strong>Valor líquido:</strong> ${formatCurrency(item.invoice.net)}</p><p><strong>Programação bancária:</strong> ${formatDate(item.bankSchedule.date)} / ${formatCurrency(item.bankSchedule.value)}</p><p><strong>Divergências:</strong> ${item.divergences.join("; ") || "-"}</p>`;
}

function requestTable(items) {
  return `<div class="table-wrap"><table><thead><tr><th>Processo</th><th>Obra</th><th>Responsável atual</th><th>Valor</th><th>Status</th><th></th></tr></thead><tbody>${items.map((item) => `<tr><td><strong>${item.id}</strong><br>${item.title}</td><td>${item.obra.nome}<br><small>${item.obra.codigo} - ${item.obra.centro}</small></td><td>${responsibleFor(item)}</td><td>${formatCurrency(item.recommendedValue || item.invoice.net)}</td><td>${pill(item.status)}</td><td><button class="button secondary" data-select="${item.id}" data-go="detail">Abrir</button></td></tr>`).join("")}</tbody></table></div>`;
}

function responsibleFor(item) {
  if ([statuses.awaitingQuote, statuses.quoting].includes(item.status)) return "Kemilly";
  if (item.status === statuses.awaitingApproval) return item.ruleSnapshot?.approverName || "Aprovador parametrizado";
  if ([statuses.approved, statuses.orderIssued, statuses.awaitingInvoice, statuses.invoiceLinked, statuses.paymentScheduled].includes(item.status)) return "Matheus";
  if ([statuses.awaitingBankRelease, statuses.paymentReleased, statuses.divergence].includes(item.status)) return "Leon";
  return item.requester;
}

function approvalTable(items) {
  return `<div class="table-wrap"><table><thead><tr><th>Processo</th><th>Aprovador exigido</th><th>Valor</th><th>Comparativo</th><th>Regra</th><th>Ação</th></tr></thead><tbody>${items.map((item) => `<tr><td><strong>${item.id}</strong><br>${item.title}<br><small>${item.specification}</small></td><td>${item.ruleSnapshot?.approverName || "-"}</td><td>${formatCurrency(item.recommendedValue)}</td><td>${item.quotes.map((q) => `${q.supplier}: ${formatCurrency(q.value)} / ${formatDate(q.deadline)}`).join("<br>") || "-"}</td><td>${item.ruleSnapshot ? `${item.ruleSnapshot.summary}<br>${item.ruleSnapshot.exceptionReason || ""}` : "-"}</td><td><button class="button" data-approve="${item.id}">Aprovar</button> <button class="button danger" data-reject="${item.id}">Reprovar</button> <button class="button warning" data-adjust="${item.id}">Solicitar ajuste</button> <button class="button secondary" data-new-quote="${item.id}">Nova cotação</button></td></tr>`).join("")}</tbody></table></div>`;
}

function adminAuditTable(items) {
  return `<div class="table-wrap"><table><thead><tr><th>Configuração</th><th>Ação</th><th>Valor anterior</th><th>Valor novo</th><th>Usuário</th><th>Data/hora</th><th>Justificativa</th></tr></thead><tbody>${items.map((item) => `<tr><td>${item.type}</td><td>${item.action || "-"}</td><td>${item.before}</td><td>${item.after}</td><td>${item.user}</td><td>${item.date}</td><td>${item.reason}</td></tr>`).join("")}</tbody></table></div>`;
}

function permissions(user) {
  return [["cria solicitação", user.create], ["cotações", user.quotes], ["aprova compras", user.approve], ["emite pedido", user.order], ["vincula NF", user.nf], ["programa pagamento", user.schedule], ["libera banco", user.release], ["status final", user.finalStatus], ["administra", user.admin]].filter(([, enabled]) => enabled).map(([label]) => label).join(", ") || "-";
}

function updateObraReadonly() {
  const select = document.querySelector("#obra");
  if (!select) return;
  const obra = obras.find((item) => item.codigo === select.value) || obras[0];
  document.querySelector("#codigo").value = obra.codigo;
  document.querySelector("#cliente").value = obra.cliente;
  document.querySelector("#centro").value = obra.centro;
}

function bindView() {
  document.querySelectorAll("[data-go]").forEach((button) => button.addEventListener("click", () => {
    if (button.dataset.select) selectedId = button.dataset.select;
    setView(button.dataset.go);
  }));
  document.querySelectorAll("[data-profile]").forEach((button) => button.addEventListener("click", () => {
    currentProfile = button.dataset.profile;
    document.querySelector("#profile").value = currentProfile;
    renderNav();
    setView("dashboard");
  }));

  document.querySelectorAll("[data-edit-user]").forEach((button) => button.addEventListener("click", () => {
    selectedUserId = button.dataset.editUser;
    setView("adminUsers");
  }));
  document.querySelectorAll("[data-edit-rule]").forEach((button) => button.addEventListener("click", () => {
    selectedRuleId = button.dataset.editRule;
    setView("adminApprovals");
  }));

  const obraSelect = document.querySelector("#obra");
  if (obraSelect) {
    obraSelect.addEventListener("change", updateObraReadonly);
    updateObraReadonly();
  }

  bindOperationalForms();
  bindAdminForms();
}

function bindOperationalForms() {
  const requestForm = document.querySelector("#request-form");
  if (requestForm) requestForm.addEventListener("submit", (eventArgs) => {
    eventArgs.preventDefault();
    const priority = document.querySelector("#priority").value;
    const urgencyReason = document.querySelector("#urgencyReason").value.trim();
    if ((priority === "Alta" || priority === "Emergencial") && !urgencyReason) {
      window.alert("Justificativa da urgência é obrigatória para prioridade alta ou emergencial.");
      return;
    }
    const obra = obras.find((item) => item.codigo === document.querySelector("#obra").value) || obras[0];
    const id = `REQ-${1001 + requests.length}`;
    requests.unshift({
      id,
      title: document.querySelector("#title").value,
      obra,
      type: document.querySelector("#type").value,
      description: document.querySelector("#title").value,
      specification: document.querySelector("#specification").value,
      quantity: Number(document.querySelector("#quantity").value || 0),
      unit: document.querySelector("#unit").value,
      serviceFront: document.querySelector("#serviceFront").value,
      needDate: document.querySelector("#needDate").value,
      priority,
      urgencyReason,
      attachment: document.querySelector("#attachment").value,
      notes: document.querySelector("#notes").value,
      requester: currentUser().name,
      requesterId: currentUser().id,
      createdAt: now(),
      status: statuses.awaitingQuote,
      quotes: [],
      recommendedSupplier: "",
      recommendedValue: 0,
      recommendedDeadline: "",
      recommendedPaymentTerms: "",
      recommendationReason: "",
      incompleteQuoteReason: "",
      approvedBy: "",
      approvedById: "",
      purchaseOrderNumber: "",
      purchaseOrderDate: "",
      supplierCnpj: "",
      confirmedDelivery: "",
      deliveryAddress: obra.entrega,
      supplierContact: "",
      purchaseOrderAttachment: "",
      purchaseNotes: "",
      invoice: blankInvoice(),
      bankSchedule: blankBankSchedule(),
      divergences: [],
      ruleSnapshot: null,
      history: [event("Solicitação criada", currentUser().name, statuses.created, "Dados técnicos registrados."), event(`Dados internos preenchidos: ${obra.codigo}, ${obra.cliente}, ${obra.centro}`, "Sistema", statuses.created), event("Enviada para cotação", "Sistema", statuses.awaitingQuote, "Responsável: Kemilly.")]
    });
    selectedId = id;
    setView("mine");
  });

  const quoteFormElement = document.querySelector("#quote-form");
  if (quoteFormElement) quoteFormElement.addEventListener("submit", (eventArgs) => {
    eventArgs.preventDefault();
    const item = selected();
    const nextQuotes = [0, 1, 2].map((index) => {
      const supplier = document.querySelector(`[data-quote="${index}"][data-field="supplier"]`).value.trim();
      if (!supplier) return null;
      return quote(
        supplier,
        Number(document.querySelector(`[data-quote="${index}"][data-field="value"]`).value || 0),
        document.querySelector(`[data-quote="${index}"][data-field="deadline"]`).value,
        document.querySelector(`[data-quote="${index}"][data-field="freight"]`).value,
        document.querySelector(`[data-quote="${index}"][data-field="paymentTerms"]`).value,
        document.querySelector(`[data-quote="${index}"][data-field="attachment"]`).value
      );
    }).filter(Boolean);
    const incompleteReason = document.querySelector("#incompleteQuoteReason").value.trim();
    if (nextQuotes.length < generalParameters.defaultQuotes && !incompleteReason) {
      window.alert("Justificativa obrigatória para menos de três propostas.");
      return;
    }
    item.quotes = nextQuotes;
    item.recommendedSupplier = document.querySelector("#recommendedSupplier").value;
    item.recommendedValue = Number(document.querySelector("#recommendedValue").value);
    item.recommendedDeadline = document.querySelector("#recommendedDeadline").value;
    item.recommendedPaymentTerms = document.querySelector("#recommendedPaymentTerms").value;
    item.recommendationReason = document.querySelector("#recommendationReason").value;
    item.incompleteQuoteReason = incompleteReason;
    const exception = item.priority === "Emergencial" ? "Compra emergencial" : "";
    const rule = findApprovalRule(item.recommendedValue, "Compra", exception);
    if (!rule) {
      window.alert("Não há regra de alçada aplicável para esta submissão.");
      return;
    }
    item.ruleSnapshot = createSnapshot(item.recommendedValue, rule, exception);
    item.status = statuses.awaitingApproval;
    item.history.push(event("Propostas registradas", currentUser().name, statuses.quoting, `${nextQuotes.length} proposta(s) registradas.`));
    item.history.push(event("Fornecedor recomendado", currentUser().name, statuses.awaitingApproval, `${item.recommendedSupplier} por ${formatCurrency(item.recommendedValue)}.`));
    item.history.push(event("Snapshot da regra aplicado", "Sistema", statuses.awaitingApproval, `${item.ruleSnapshot.summary}; aprovador ${item.ruleSnapshot.approverName}; valor ${formatCurrency(item.ruleSnapshot.value)}.`));
    setView("detail");
  });

  document.querySelectorAll("[data-approve]").forEach((button) => button.addEventListener("click", () => {
    const item = requests.find((request) => request.id === button.dataset.approve);
    item.status = statuses.approved;
    item.approvedBy = currentUser().name;
    item.approvedById = currentUser().id;
    item.history.push(event("Compra aprovada", currentUser().name, statuses.approved, "Encaminhada para Matheus emitir pedido."));
    selectedId = item.id;
    setView("detail");
  }));

  document.querySelectorAll("[data-reject]").forEach((button) => button.addEventListener("click", () => {
    const item = requests.find((request) => request.id === button.dataset.reject);
    item.status = statuses.rejected;
    item.history.push(event("Compra reprovada", currentUser().name, statuses.rejected));
    setView("approvals");
  }));

  document.querySelectorAll("[data-adjust], [data-new-quote]").forEach((button) => button.addEventListener("click", () => {
    const item = requests.find((request) => request.id === (button.dataset.adjust || button.dataset.newQuote));
    item.status = statuses.awaitingQuote;
    item.history.push(event(button.dataset.adjust ? "Solicitado ajuste" : "Solicitada nova cotação", currentUser().name, statuses.awaitingQuote));
    selectedId = item.id;
    setView("detail");
  }));

  const orderForm = document.querySelector("#order-form");
  if (orderForm) orderForm.addEventListener("submit", (eventArgs) => {
    eventArgs.preventDefault();
    const item = selected();
    const orderValue = Number(document.querySelector("#purchaseOrderValue").value || 0);
    if (Math.abs(orderValue - item.recommendedValue) > 0.01) {
      markDivergence(item.id, "Valor do pedido diferente do valor aprovado.");
      return;
    }
    item.purchaseOrderNumber = document.querySelector("#purchaseOrderNumber").value;
    item.purchaseOrderDate = document.querySelector("#purchaseOrderDate").value;
    item.confirmedDelivery = document.querySelector("#confirmedDelivery").value;
    item.deliveryAddress = document.querySelector("#deliveryAddress").value;
    item.supplierContact = document.querySelector("#supplierContact").value;
    item.purchaseOrderAttachment = document.querySelector("#purchaseOrderAttachment").value;
    item.purchaseNotes = document.querySelector("#purchaseNotes").value;
    item.status = statuses.orderIssued;
    item.history.push(event("Pedido emitido", currentUser().name, statuses.orderIssued, `Pedido ${item.purchaseOrderNumber} em ${formatDate(item.purchaseOrderDate)} no valor de ${formatCurrency(orderValue)}.`));
    setView("execution");
  });

  document.querySelectorAll("[data-execute]").forEach((button) => button.addEventListener("click", () => {
    const item = requests.find((request) => request.id === button.dataset.execute);
    item.status = statuses.awaitingInvoice;
    item.history.push(event("Compra realizada", currentUser().name, statuses.awaitingInvoice, "Aguardando vinculação da NF."));
    selectedId = item.id;
    setView("invoice");
  }));

  document.querySelectorAll("[data-divergence]").forEach((button) => button.addEventListener("click", () => markDivergence(button.dataset.divergence, "Divergência operacional registrada por Matheus.")));

  const invoiceForm = document.querySelector("#invoice-form");
  if (invoiceForm) invoiceForm.addEventListener("submit", (eventArgs) => {
    eventArgs.preventDefault();
    const item = selected();
    const gross = Number(document.querySelector("#invoiceGross").value || 0);
    const deductions = Number(document.querySelector("#invoiceDeductions").value || 0);
    item.invoice = {
      number: document.querySelector("#invoiceNumber").value,
      series: document.querySelector("#invoiceSeries").value,
      issueDate: document.querySelector("#invoiceIssueDate").value,
      dueDate: document.querySelector("#invoiceDueDate").value,
      gross,
      deductions,
      net: Math.max(0, gross - deductions),
      attachment: document.querySelector("#invoiceAttachment").value,
      paymentDoc: document.querySelector("#paymentDoc").value,
      divergenceNote: document.querySelector("#divergenceNote").value
    };
    const divergent = Math.abs(item.invoice.gross - item.recommendedValue) > 0.01 || item.invoice.divergenceNote.trim();
    if (divergent) {
      markDivergence(item.id, item.invoice.divergenceNote || "NF divergente do valor aprovado.");
      return;
    }
    item.status = statuses.invoiceLinked;
    item.history.push(event("NF vinculada", currentUser().name, statuses.invoiceLinked, `NF ${item.invoice.number}, líquido ${formatCurrency(item.invoice.net)}, vencimento ${formatDate(item.invoice.dueDate)}.`));
    setView("bankSchedule");
  });

  const bankForm = document.querySelector("#bank-form");
  if (bankForm) bankForm.addEventListener("submit", (eventArgs) => {
    eventArgs.preventDefault();
    const item = selected();
    item.bankSchedule = {
      account: document.querySelector("#bankAccount").value,
      method: document.querySelector("#paymentMethod").value,
      date: document.querySelector("#scheduledDate").value,
      value: Number(document.querySelector("#scheduledValue").value),
      receipt: document.querySelector("#scheduleReceipt").value,
      notes: document.querySelector("#scheduleNotes").value
    };
    item.status = statuses.awaitingBankRelease;
    item.history.push(event("Pagamento programado no banco", currentUser().name, statuses.awaitingBankRelease, `${formatCurrency(item.bankSchedule.value)} programados para ${formatDate(item.bankSchedule.date)}.`));
    setView("history");
  });

  document.querySelectorAll("[data-release]").forEach((button) => button.addEventListener("click", () => {
    const item = requests.find((request) => request.id === button.dataset.release);
    item.status = statuses.paymentReleased;
    item.history.push(event("Pagamento liberado", currentUser().name, statuses.paymentReleased, "Liberação bancária realizada por Leon."));
    selectedId = item.id;
    setView("bankRelease");
  }));
  document.querySelectorAll("[data-block], [data-correction]").forEach((button) => button.addEventListener("click", () => {
    const id = button.dataset.block || button.dataset.correction;
    const item = requests.find((request) => request.id === id);
    item.status = statuses.divergence;
    item.divergences.push(button.dataset.block ? "Pagamento bloqueado por Leon." : "Correção solicitada por Leon.");
    item.history.push(event(button.dataset.block ? "Pagamento bloqueado" : "Correção solicitada", currentUser().name, statuses.divergence));
    selectedId = item.id;
    setView("bankRelease");
  }));
  document.querySelectorAll("[data-confirm-paid]").forEach((button) => button.addEventListener("click", () => {
    const item = requests.find((request) => request.id === button.dataset.confirmPaid);
    item.status = statuses.completed;
    item.history.push(event("Pagamento realizado e status final atualizado", currentUser().name, statuses.completed, "Processo concluído por Leon."));
    selectedId = item.id;
    setView("history");
  }));
}

function bindAdminForms() {
  const newUser = document.querySelector("#new-user");
  if (newUser) newUser.addEventListener("click", () => {
    selectedUserId = "";
    users.push(userRecord(`usr-${Date.now()}`, "", "", "", profileOptions[0], [], {}));
    selectedUserId = users[users.length - 1].id;
    setView("adminUsers");
  });

  const toggleUser = document.querySelector("#toggle-user");
  if (toggleUser) toggleUser.addEventListener("click", () => {
    const user = userById(selectedUserId);
    if (!user) return;
    const before = JSON.stringify(user);
    user.active = !user.active;
    user.updatedBy = "Leon";
    user.updatedAt = now();
    adminAudit.unshift(auditRecord("Usuário", user.active ? "Ativação" : "Desativação", before, JSON.stringify(user), "Alteração de status no cadastro."));
    persistAdminData();
    setView("adminUsers");
  });

  const userForm = document.querySelector("#admin-user-form");
  if (userForm) userForm.addEventListener("submit", (eventArgs) => {
    eventArgs.preventDefault();
    const id = document.querySelector("#userId").value.trim() || `usr-${Date.now()}`;
    const existingIndex = users.findIndex((user) => user.id === selectedUserId);
    const before = existingIndex >= 0 ? JSON.stringify(users[existingIndex]) : "-";
    const next = {
      id,
      name: document.querySelector("#userName").value,
      email: document.querySelector("#userEmail").value,
      role: document.querySelector("#userRole").value,
      mainProfile: document.querySelector("#userMainProfile").value,
      extraProfiles: document.querySelector("#userExtraProfiles").value.split(",").map((item) => item.trim()).filter(Boolean),
      create: document.querySelector("#perm-create").checked,
      quotes: document.querySelector("#perm-quotes").checked,
      approve: document.querySelector("#perm-approve").checked,
      order: document.querySelector("#perm-order").checked,
      nf: document.querySelector("#perm-nf").checked,
      schedule: document.querySelector("#perm-schedule").checked,
      release: document.querySelector("#perm-release").checked,
      finalStatus: document.querySelector("#perm-release").checked,
      admin: document.querySelector("#perm-admin").checked,
      active: document.querySelector("#userActive").value === "true",
      substituteId: document.querySelector("#userSubstitute").value,
      substituteStart: document.querySelector("#userSubstituteStart").value,
      substituteEnd: document.querySelector("#userSubstituteEnd").value,
      notes: document.querySelector("#userNotes").value,
      createdBy: existingIndex >= 0 ? users[existingIndex].createdBy : "Leon",
      createdAt: existingIndex >= 0 ? users[existingIndex].createdAt : now(),
      updatedBy: "Leon",
      updatedAt: now()
    };
    if (existingIndex >= 0) users[existingIndex] = next;
    else users.push(next);
    selectedUserId = next.id;
    adminAudit.unshift(auditRecord("Usuário", existingIndex >= 0 ? "Edição" : "Inclusão", before, JSON.stringify(next), next.notes));
    persistAdminData();
    setView("adminUsers");
  });

  const newRule = document.querySelector("#new-rule");
  if (newRule) newRule.addEventListener("click", () => {
    selectedRuleId = `alc-${Date.now()}`;
    approvalRules.push(approvalRule(selectedRuleId, "Compra", "Todos", "Todas", 0, null, activeUsers()[0]?.id || "", "", false, "", new Date().toISOString().slice(0, 10), "", true, ""));
    setView("adminApprovals");
  });

  const toggleRule = document.querySelector("#toggle-rule");
  if (toggleRule) toggleRule.addEventListener("click", () => {
    const rule = approvalRules.find((item) => item.id === selectedRuleId);
    if (!rule) return;
    const before = JSON.stringify(rule);
    rule.active = !rule.active;
    rule.updatedBy = "Leon";
    rule.updatedAt = now();
    adminAudit.unshift(auditRecord("Alçada", rule.active ? "Ativação" : "Desativação", before, JSON.stringify(rule), "Alteração de status da regra."));
    persistAdminData();
    setView("adminApprovals");
  });

  const approvalForm = document.querySelector("#admin-approval-form");
  if (approvalForm) approvalForm.addEventListener("submit", (eventArgs) => {
    eventArgs.preventDefault();
    const id = document.querySelector("#ruleId").value.trim() || `alc-${Date.now()}`;
    const existingIndex = approvalRules.findIndex((rule) => rule.id === selectedRuleId);
    const before = existingIndex >= 0 ? JSON.stringify(approvalRules[existingIndex]) : "-";
    const next = approvalRule(
      id,
      document.querySelector("#ruleProcess").value,
      document.querySelector("#ruleType").value,
      document.querySelector("#ruleObra").value,
      Number(document.querySelector("#ruleMin").value || 0),
      document.querySelector("#ruleMax").value === "" ? null : Number(document.querySelector("#ruleMax").value),
      document.querySelector("#ruleApprover").value,
      document.querySelector("#ruleSubstitute").value,
      document.querySelector("#ruleAdditional").value === "true",
      document.querySelector("#ruleAdditionalApprover").value,
      document.querySelector("#ruleStart").value,
      document.querySelector("#ruleEnd").value,
      document.querySelector("#ruleActive").value === "true",
      document.querySelector("#ruleNotes").value
    );
    const validation = validateRule(next, existingIndex);
    if (validation.length) {
      window.alert(validation.join("\n"));
      return;
    }
    if (existingIndex >= 0) approvalRules[existingIndex] = next;
    else approvalRules.push(next);
    alignLeonCompraRule(next);
    selectedRuleId = next.id;
    adminAudit.unshift(auditRecord("Alçada", existingIndex >= 0 ? "Edição" : "Inclusão", before, JSON.stringify(next), document.querySelector("#ruleReason").value));
    persistAdminData();
    setView("adminApprovals");
  });
}

function alignLeonCompraRule(changedRule) {
  const changedApprover = userById(changedRule.approverId);
  if (changedRule.process !== "Compra" || changedApprover?.name !== "Gustavo" || changedRule.max === null || changedRule.max === "") return;
  const leon = users.find((user) => user.name === "Leon" && user.active);
  const leonRule = approvalRules.find((rule) => rule.process === "Compra" && rule.approverId === leon?.id && rule.active);
  if (!leonRule) return;
  const before = JSON.stringify(leonRule);
  leonRule.min = Number(changedRule.max) + 0.01;
  leonRule.updatedBy = "Leon";
  leonRule.updatedAt = now();
  adminAudit.unshift(auditRecord("Alçada", "Ajuste vinculado", before, JSON.stringify(leonRule), "Faixa de Leon ajustada para evitar ausência de regra após alteração da alçada de Gustavo."));
}

function validateRule(rule, existingIndex) {
  const errors = [];
  const approver = userById(rule.approverId);
  const substitute = userById(rule.substituteId);
  const additionalApprover = userById(rule.additionalApproverId);
  if (rule.max !== null && rule.max !== "" && Number(rule.max) < Number(rule.min)) errors.push("Valor final não pode ser inferior ao valor inicial.");
  if (!rule.start || (rule.end && rule.end < rule.start)) errors.push("Regra sem vigência válida.");
  if (!approver || !approver.active) errors.push("Aprovador principal precisa ser um usuário ativo cadastrado.");
  if (substitute && !substitute.active) errors.push("Aprovador substituto não pode estar inativo.");
  if (additionalApprover && !additionalApprover.active) errors.push("Aprovador adicional não pode estar inativo.");
  if (rule.active && rule.process === "Compra" && approver?.id === "usr-matheus") errors.push("Matheus não pode ser aprovador de compra operacional executada por ele.");
  const simulated = approvalRules.map((item, index) => index === existingIndex ? rule : item);
  const conflicts = findRuleConflicts(simulated);
  if (rule.active && conflicts.some((item) => item.includes(rule.id))) errors.push(`Regra possui faixa sobreposta: ${conflicts.join("; ")}`);
  return errors;
}

function markDivergence(id, reason) {
  const item = requests.find((request) => request.id === id);
  const rule = findApprovalRule(item.recommendedValue || item.invoice.gross, "Compra", reason);
  if (!rule) {
    window.alert("Não há regra aplicável para encaminhar a divergência.");
    return;
  }
  item.status = statuses.divergence;
  item.divergences.push(reason);
  item.ruleSnapshot = createSnapshot(item.recommendedValue || item.invoice.gross, rule, reason);
  item.history.push(event("Divergência identificada", "Sistema", statuses.divergence, `${reason} Encaminhado para ${item.ruleSnapshot.approverName}.`));
  selectedId = item.id;
  setView("detail");
}

function renderNav() {
  document.querySelector("#nav").innerHTML = navItems.filter(([key]) => canSee(key)).map(([key, label]) => `<button class="nav-button ${key.startsWith("admin") ? "admin-nav" : ""}" data-view="${key}">${label}</button>`).join("");
  document.querySelectorAll(".nav-button").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
}

function renderProfiles() {
  document.querySelector("#profile").innerHTML = Object.entries(profiles).map(([key, profile]) => `<option value="${key}" ${key === currentProfile ? "selected" : ""}>${profile.label}</option>`).join("");
  document.querySelector("#profile").addEventListener("change", (eventArgs) => {
    currentProfile = eventArgs.target.value;
    if (!canSee(currentView)) currentView = "dashboard";
    renderNav();
    setView(currentView);
  });
}

function init() {
  persistAdminData();
  renderProfiles();
  renderNav();
  setView("dashboard");
}

init();
