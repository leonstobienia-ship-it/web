import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  Car,
  CheckCircle2,
  ClipboardList,
  Factory,
  FileText,
  Hotel,
  Layers3,
  Mail,
  MapPin,
  Menu,
  Phone,
  Send,
  ShieldCheck,
  ShoppingCart,
  Target,
  Warehouse,
  X,
} from "lucide-react";
import { SITE_ROBOTS, siteUrl } from "./config/site.js";
import "./styles.css";

const ASSET = "/assets/";
const defaultTitle = "ENAC Empreendimentos | Obras industriais, logísticas e comerciais";
const defaultDescription =
  "ENAC Empreendimentos: diagnóstico, projeto executivo, gestão de fornecedores e execução de obras industriais, logísticas, comerciais, hoteleiras e concessionárias.";
const privacyTitle = "Política de Privacidade | ENAC Empreendimentos";
const privacyDescription =
  "Política de Privacidade da ENAC Empreendimentos para tratamento de dados enviados por formulários de contato comercial.";
const privacyUrl = "/politica-de-privacidade/";
const whatsappMessage =
  "Olá, gostaria de falar com a ENAC sobre uma demanda de obra.\nEmpresa:\nCidade:\nSegmento:\nTipo de obra:\nPrazo desejado:";
const whatsappUrl = `https://wa.me/5519983310333?text=${encodeURIComponent(whatsappMessage)}`;

const navItems = [
  { label: "Quem somos", href: "#quem-somos" },
  { label: "Método", href: "#metodo" },
  { label: "Atuação", href: "#atuacao" },
  { label: "Obras", href: "#obras" },
  { label: "Clientes", href: "#clientes" },
  { label: "Contato", href: "#contato" },
];

const method = [
  {
    icon: ClipboardList,
    title: "Diagnóstico de viabilidade",
    text: "Leitura técnica do terreno, operação, prazo, restrições e prioridades do cliente.",
  },
  {
    icon: Layers3,
    title: "Projeto executivo coordenado",
    text: "Compatibilização de disciplinas para reduzir improviso, retrabalho e ruído em obra.",
  },
  {
    icon: CalendarCheck,
    title: "Obra com ritmo de operação",
    text: "Cronograma, suprimentos, fornecedores e canteiro acompanhados com governança objetiva.",
  },
  {
    icon: CheckCircle2,
    title: "Entrega pronta para uso",
    text: "Finalização orientada a funcionamento, segurança, documentação e transição operacional.",
  },
];

const differentiators = [
  {
    icon: Target,
    title: "Escopo claro antes do canteiro",
    text: "A tomada de decisão parte de briefing, restrições, prioridade de operação e critérios de entrega.",
  },
  {
    icon: Building2,
    title: "Execução orientada ao uso",
    text: "A obra é conduzida pensando no empreendimento funcionando, não apenas na etapa construtiva.",
  },
  {
    icon: ShieldCheck,
    title: "Gestão de risco e segurança",
    text: "Rotina de acompanhamento técnico para reduzir improvisos, impactos e paradas desnecessárias.",
  },
];

const sectors = [
  {
    key: "logistica",
    name: "Logística e distribuição",
    icon: Warehouse,
    image: `${ASSET}hero-distribuicao.webp`,
    lead: "Galpões, centros de distribuição, parques logísticos e estruturas frigorificadas.",
    evidence: ["Bandeirantes Business Park", "Libra Terminais", "Logimaster", "Pepsico"],
    needs: ["Fluxo de docas", "Pé-direito e piso industrial", "Expansão futura"],
  },
  {
    key: "industria",
    name: "Indústrias",
    icon: Factory,
    image: `${ASSET}hero-industrial.webp`,
    lead: "Obras de alta complexidade com integração entre produção, infraestrutura e segurança.",
    evidence: ["Heineken", "Honda", "JBS", "Quartzolit", "Takasago"],
    needs: ["Continuidade operacional", "Infraestrutura crítica", "Segurança de canteiro"],
  },
  {
    key: "varejo",
    name: "Varejo alimentar",
    icon: ShoppingCart,
    image: `${ASSET}segmento-supermercados.webp`,
    lead: "Supermercados e atacados que precisam abrir, ampliar ou reformar com prazo controlado.",
    evidence: ["Makro", "Mambo", "Stock Atacadista", "Swift", "Coop"],
    needs: ["Abertura rápida", "Adequação de loja", "Obra em área urbana"],
  },
  {
    key: "hospitalidade",
    name: "Hotelaria",
    icon: Hotel,
    image: `${ASSET}hero-hoteis.webp`,
    lead: "Hotéis, resorts e torres corporativas com exigência de acabamento e experiência de uso.",
    evidence: ["Royal Palm Plaza", "Royal Palm Tower", "Sheraton", "Euro Suit"],
    needs: ["Acabamento técnico", "Conforto do usuário", "Entrega por etapas"],
  },
  {
    key: "concessionarias",
    name: "Concessionárias",
    icon: Car,
    image: `${ASSET}segmento-concessionarias.webp`,
    lead: "Showrooms e oficinas com padrão de marca, exposição, circulação e pós-venda.",
    evidence: ["Tempo Volkswagen", "Ford Indaiatuba", "VW Valinhos"],
    needs: ["Padrão de montadora", "Oficina e showroom", "Fluxo de atendimento"],
  },
];

const projects = [
  {
    name: "Makro Campinas",
    scale: "11.000 m² construídos",
    type: "2 meses de construção",
    image: `${ASSET}segmento-supermercados.webp`,
  },
  {
    name: "Royal Palm Plaza Resort",
    scale: "110.000 m² construídos",
    type: "Hotelaria",
    image: `${ASSET}hero-hoteis.webp`,
  },
  {
    name: "Bandeirantes Business Park",
    scale: "34.000 m² construídos",
    type: "Logística",
    image: `${ASSET}hero-distribuicao.webp`,
  },
  {
    name: "Tempo Volkswagen",
    scale: "4.500 m² construídos",
    type: "Concessionária",
    image: `${ASSET}segmento-concessionarias.webp`,
  },
  {
    name: "Bresco Viracopos",
    scale: "9.240 m² construídos",
    type: "Indústria",
    image: `${ASSET}segmento-industrias.webp`,
  },
  {
    name: "The Royal Indaiatuba",
    scale: "12.000 m² construídos",
    type: "Hotelaria",
    image: `${ASSET}segmento-hoteis.webp`,
  },
];

const esg = [
  "Controle de impactos e riscos em todas as etapas",
  "Integridade física e bem-estar das equipes",
  "Redução de desperdícios e poluição",
  "Melhoria contínua do sistema de gestão",
];

const clients = [
  { name: "Heineken", logo: `${ASSET}clients/heineken.png` },
  { name: "Honda", logo: `${ASSET}clients/honda.png` },
  { name: "Royal Palm Plaza", logo: `${ASSET}clients/royal-palm-plaza.png` },
  { name: "Makro", logo: `${ASSET}clients/makro.png` },
  { name: "Pepsico", logo: `${ASSET}clients/pepsico.png` },
  { name: "Samsung", logo: `${ASSET}clients/samsung.png` },
  { name: "Mambo", logo: `${ASSET}clients/mambo.png` },
  { name: "Stock Atacadista", logo: `${ASSET}clients/stock.png` },
  { name: "Sheraton", logo: `${ASSET}clients/sheraton.png` },
  { name: "Swift", logo: `${ASSET}clients/swift.png` },
  { name: "Quartzolit", logo: `${ASSET}clients/quartzolit.png` },
  { name: "Takasago", logo: `${ASSET}clients/takasago.png` },
  { name: "Telhanorte", logo: `${ASSET}clients/telhanorte.png` },
  { name: "Carrefour", logo: `${ASSET}clients/carrefour.png` },
  { name: "Goodyear", logo: `${ASSET}clients/goodyear.png` },
  { name: "JBS", logo: `${ASSET}clients/jbs.png` },
  { name: "Unilever", logo: `${ASSET}clients/unilever.png` },
  { name: "Pirelli", logo: `${ASSET}clients/pirelli.png` },
  { name: "Eaton", logo: `${ASSET}clients/eaton.png` },
  { name: "DHL", logo: `${ASSET}clients/dhl.png` },
  { name: "Cobasi", logo: `${ASSET}clients/cobasi.png` },
  { name: "Coop", logo: `${ASSET}clients/coop.png` },
];

const formModes = [
  {
    id: "briefing-obra",
    label: "Construir ou ampliar",
    fields: ["nome", "email", "telefone", "cidade", "segmento", "mensagem"],
  },
  {
    id: "cadastro-fornecedor",
    label: "Fornecer para a ENAC",
    fields: ["nome", "email", "telefone", "empresa", "cnpj", "mensagem"],
  },
  {
    id: "trabalhe-conosco",
    label: "Trabalhar na ENAC",
    fields: ["nome", "email", "telefone", "area", "mensagem"],
  },
];

const fieldLabels = {
  nome: "Nome",
  email: "Email",
  telefone: "Telefone",
  cidade: "Cidade",
  segmento: "Segmento da obra",
  empresa: "Empresa",
  cnpj: "CNPJ",
  area: "Área de interesse",
  mensagem: "Mensagem",
};

function setMeta(selector, attribute, value) {
  let tag = document.querySelector(selector);

  if (!tag) {
    tag = document.createElement("meta");
    const match = selector.match(/meta\[(name|property)="([^"]+)"\]/);
    if (match) {
      tag.setAttribute(match[1], match[2]);
    }
    document.head.appendChild(tag);
  }

  tag.setAttribute(attribute, value);
}

function setCanonical(url) {
  let canonical = document.querySelector('link[rel="canonical"]');

  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }

  canonical.setAttribute("href", url);
}

function applySeo({ title, description, url }) {
  document.title = title;
  setMeta('meta[name="description"]', "content", description);
  setMeta('meta[name="robots"]', "content", SITE_ROBOTS);
  setMeta('meta[property="og:title"]', "content", title);
  setMeta('meta[property="og:description"]', "content", description);
  setMeta('meta[property="og:type"]', "content", "website");
  setMeta('meta[property="og:url"]', "content", url);
  setCanonical(url);
}

function PrivacyPage() {
  useEffect(() => {
    applySeo({
      title: privacyTitle,
      description: privacyDescription,
      url: siteUrl(privacyUrl),
    });
  }, []);

  return (
    <>
      <header className="site-header privacy-header">
        <a className="brand" href="/" aria-label="ENAC">
          <img src={`${ASSET}logo-enac.webp`} alt="ENAC Empreendimentos" />
        </a>
        <a className="header-call" href="/#contato">
          <Mail size={18} aria-hidden="true" />
          Contato
        </a>
      </header>

      <main className="privacy-page">
        <section className="privacy-shell">
          <span className="kicker">
            <span>LGPD</span>
          </span>
          <h1>Política de Privacidade</h1>
          <div className="privacy-card">
            <p>
              A ENAC Empreendimentos utiliza os dados enviados pelos formulários deste site para
              responder solicitações comerciais, avaliar briefings de obra, contatos de fornecedores
              e mensagens relacionadas a oportunidades profissionais.
            </p>

            <h2>Dados coletados</h2>
            <p>
              Podemos coletar nome, email, telefone, cidade, empresa, CNPJ, área de interesse,
              segmento da obra e mensagem enviada voluntariamente pelo usuário.
            </p>

            <h2>Finalidade</h2>
            <p>
              Os dados são utilizados para retorno comercial, qualificação da demanda, atendimento
              ao contato solicitado e registro administrativo da comunicação.
            </p>

            <h2>Compartilhamento</h2>
            <p>
              A ENAC não comercializa dados pessoais. As informações podem ser tratadas por
              ferramentas de hospedagem, formulário e comunicação necessárias para operar o site e
              responder ao contato.
            </p>

            <h2>Direitos do titular</h2>
            <p>
              O titular pode solicitar acesso, correção ou exclusão dos dados enviados pelo email{" "}
              <a href="mailto:contato@enac.com.br">contato@enac.com.br</a>.
            </p>

            <h2>Contato</h2>
            <p>R. Professor Moacyr Santos de Campos, 643, Campinas-SP.</p>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <img src={`${ASSET}logo-enac-footer.webp`} alt="ENAC" />
        <p>Prazo como prioridade. Construção como propósito.</p>
        <nav aria-label="Rodapé">
          <a href="/">Página inicial</a>
          <a href="/#contato">Contato</a>
        </nav>
      </footer>
    </>
  );
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSector, setActiveSector] = useState(sectors[0].key);
  const [formMode, setFormMode] = useState(formModes[0].id);
  const [submitState, setSubmitState] = useState("idle");
  const isPrivacyPage = window.location.pathname.replace(/\/+$/, "") === "/politica-de-privacidade";

  useEffect(() => {
    if (!isPrivacyPage) {
      applySeo({
        title: defaultTitle,
        description: defaultDescription,
        url: siteUrl("/"),
      });
    }
  }, [isPrivacyPage]);

  const selectedSector = useMemo(
    () => sectors.find((sector) => sector.key === activeSector) ?? sectors[0],
    [activeSector],
  );

  const selectedForm = useMemo(
    () => formModes.find((mode) => mode.id === formMode) ?? formModes[0],
    [formMode],
  );

  if (isPrivacyPage) {
    return <PrivacyPage />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitState("sending");
    const formData = new FormData(event.currentTarget);

    try {
      await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData).toString(),
      });
      event.currentTarget.reset();
      setSubmitState("sent");
    } catch {
      setSubmitState("error");
    }
  }

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="ENAC">
          <img src={`${ASSET}logo-enac.webp`} alt="ENAC Empreendimentos" />
        </a>

        <nav className="desktop-nav" aria-label="Navegação principal">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <a className="header-call" href="#contato">
          <FileText size={18} aria-hidden="true" />
          Briefing de obra
        </a>

        <button
          className="menu-button"
          type="button"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={23} aria-hidden="true" /> : <Menu size={23} aria-hidden="true" />}
        </button>
      </header>

      {menuOpen && (
        <nav className="mobile-nav" aria-label="Navegação mobile">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
              {item.label}
            </a>
          ))}
        </nav>
      )}

      <main id="inicio">
        <section className="hero">
          <div className="hero-media">
            <img src={`${ASSET}hero-distribuicao.webp`} alt="Centro de distribuição construído pela ENAC" />
          </div>
          <div className="hero-content">
            <span className="kicker">
              <span>Engenharia para empreendimentos em operação</span>
            </span>
            <h1>Da decisão de construir à obra pronta para uso.</h1>
            <p>
              A ENAC combina projeto executivo, gestão de fornecedores e execução de campo para
              entregar obras comerciais, industriais e logísticas com previsibilidade.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#contato">
                Enviar briefing
                <ArrowRight size={18} aria-hidden="true" />
              </a>
              <a className="button secondary" href="#metodo">
                Ver método
              </a>
            </div>
          </div>
        </section>

        <section className="section about" id="quem-somos">
          <div className="about-copy">
            <span className="kicker">Quem somos</span>
            <h2>Uma construtora para empreendimentos que precisam sair do papel e operar.</h2>
            <p>
              A ENAC atua no mercado construtor oferecendo uma gama completa de serviços para
              entregar obras prontas para uso. A empresa coordena parceiros, fornecedores e
              execução técnica para que cada etapa avance com prazo, segurança e previsibilidade.
              A trajetória reúne mais de 300 empreendimentos e +1.000.000 m² executados em
              diferentes segmentos.
            </p>
          </div>
        </section>

        <section className="section differentiators" id="diferenciais">
          <div className="section-heading narrow">
            <span className="kicker">Diferenciais</span>
            <h2>O valor está em organizar a obra antes que ela vire urgência.</h2>
          </div>
          <div className="differentiator-grid">
            {differentiators.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title}>
                  <Icon size={30} aria-hidden="true" />
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="section method" id="metodo">
          <div className="section-heading">
            <span className="kicker">Método</span>
            <h2>Um fluxo de obra pensado para reduzir incerteza.</h2>
            <p>
              Cada obra começa com diagnóstico técnico, definição clara de escopo e coordenação
              das disciplinas envolvidas. A ENAC estrutura o processo para reduzir improvisos,
              controlar fornecedores e conduzir a execução com previsibilidade até a entrega
              operacional.
            </p>
          </div>
          <div className="method-rail">
            {method.map((step, index) => {
              const Icon = step.icon;
              return (
                <article className="method-step" key={step.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <Icon size={28} aria-hidden="true" />
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="section sectors" id="atuacao">
          <div className="section-heading narrow">
            <span className="kicker">Atuação</span>
            <h2>Cada segmento começa por uma necessidade diferente.</h2>
          </div>
          <div className="sector-layout">
            <div className="sector-tabs" role="tablist" aria-label="Segmentos de atuação">
              {sectors.map((sector) => {
                const Icon = sector.icon;
                return (
                  <button
                    key={sector.key}
                    className={activeSector === sector.key ? "is-active" : ""}
                    type="button"
                    role="tab"
                    aria-selected={activeSector === sector.key}
                    onClick={() => setActiveSector(sector.key)}
                  >
                    <Icon size={20} aria-hidden="true" />
                    {sector.name}
                  </button>
                );
              })}
            </div>

            <article className="sector-detail">
              <img
                src={selectedSector.image}
                alt={`Empreendimento de ${selectedSector.name.toLowerCase()} executado pela ENAC`}
                loading="lazy"
              />
              <div className="sector-copy">
                <span className="kicker">Segmento selecionado</span>
                <h3>{selectedSector.name}</h3>
                <p>{selectedSector.lead}</p>
                <div className="need-list" aria-label="Demandas comuns">
                  {selectedSector.needs.map((need) => (
                    <span key={need}>{need}</span>
                  ))}
                </div>
                <div className="evidence">
                  <strong>Experiência relacionada</strong>
                  <p>{selectedSector.evidence.join(" · ")}</p>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="section projects" id="obras">
          <div className="section-heading">
            <span className="kicker">Obras</span>
            <h2>Obras executadas que demonstram escala, prazo e complexidade.</h2>
            <p>
              As obras em destaque combinam escala, segmento e referência visual para facilitar a
              leitura do tipo de empreendimento executado.
            </p>
          </div>
          <div className="project-table" aria-label="Obras em destaque">
            {projects.map((project) => (
              <article key={project.name}>
                <figure>
                  <img src={project.image} alt={`Imagem da obra ${project.name}`} loading="lazy" />
                </figure>
                <div className="project-body">
                  <h3>{project.name}</h3>
                  <p>{project.scale}</p>
                  <span>{project.type}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section esg" id="esg">
          <div className="esg-copy">
            <span className="kicker">ESG em obra</span>
            <h2>Responsabilidade aplicada ao canteiro, à equipe e ao resultado.</h2>
          </div>
          <div className="esg-list">
            {esg.map((item) => (
              <div key={item}>
                <ShieldCheck size={22} aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="section clients" id="clientes">
          <div className="section-heading narrow">
            <span className="kicker">Clientes</span>
            <h2>Empresas que exigem obra com padrão, prazo e controle.</h2>
          </div>
          <div className="client-logo-grid" aria-label="Clientes atendidos">
            {clients.map((client) => (
              <figure key={client.name}>
                <img src={client.logo} alt={client.name} loading="lazy" />
              </figure>
            ))}
          </div>
        </section>

        <section className="section contact" id="contato">
          <div className="contact-panel">
            <span className="kicker">Campinas, SP</span>
            <h2>Vamos transformar a demanda em um briefing técnico.</h2>
            <p>R. Professor Moacyr Santos de Campos, 643, Campinas-SP.</p>
            <div className="contact-links">
              <a href="tel:+551932387185">
                <Phone size={18} aria-hidden="true" />
                (19) 3238-7185
              </a>
              <a href="mailto:contato@enac.com.br">
                <Mail size={18} aria-hidden="true" />
                contato@enac.com.br
              </a>
              <span>
                <MapPin size={18} aria-hidden="true" />
                R. Professor Moacyr Santos de Campos, 643, Campinas-SP.
              </span>
            </div>
          </div>

          <form
            className="briefing-form"
            name={selectedForm.id}
            method="POST"
            data-netlify="true"
            data-netlify-honeypot="bot-field"
            onSubmit={handleSubmit}
          >
            <input type="hidden" name="form-name" value={selectedForm.id} />
            <input type="hidden" name="assunto" value={selectedForm.label} />
            <input type="hidden" name="identificacao" value={selectedForm.id} />
            <p className="honeypot" aria-hidden="true">
              <label>
                Não preencha este campo
                <input name="bot-field" tabIndex="-1" autoComplete="off" />
              </label>
            </p>

            <div className="form-modes" role="tablist" aria-label="Tipo de contato">
              {formModes.map((mode) => (
                <button
                  key={mode.id}
                  className={formMode === mode.id ? "is-active" : ""}
                  type="button"
                  role="tab"
                  aria-selected={formMode === mode.id}
                  onClick={() => {
                    setFormMode(mode.id);
                    setSubmitState("idle");
                  }}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="field-grid">
              {selectedForm.fields.map((field) => (
                <label key={field} className={field === "mensagem" ? "full" : ""}>
                  <span>{fieldLabels[field]}</span>
                  {field === "mensagem" ? (
                    <textarea name={field} rows="5" required />
                  ) : field === "segmento" ? (
                    <select name={field} required>
                      <option value="">Selecione</option>
                      {sectors.map((sector) => (
                        <option key={sector.name} value={sector.name}>
                          {sector.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name={field}
                      type={field === "email" ? "email" : field === "telefone" ? "tel" : "text"}
                      required={["nome", "email", "telefone"].includes(field)}
                    />
                  )}
                </label>
              ))}
              <label className="lgpd-consent">
                <input type="checkbox" name="lgpd" value="aceito" required />
                <span>
                  Concordo com o uso dos meus dados para contato comercial conforme a{" "}
                  <a href={privacyUrl}>Política de Privacidade</a>.
                </span>
              </label>
            </div>

            <button className="button primary submit" type="submit" disabled={submitState === "sending"}>
              {submitState === "sending" ? "Enviando..." : "Enviar briefing"}
              <Send size={18} aria-hidden="true" />
            </button>
            {submitState === "sent" && (
              <p className="form-note">Mensagem recebida. A equipe ENAC fará o retorno pelo contato informado.</p>
            )}
            {submitState === "error" && <p className="form-note error">Não foi possível enviar agora. Tente novamente.</p>}
          </form>
        </section>
      </main>

      <footer className="site-footer">
        <img src={`${ASSET}logo-enac-footer.webp`} alt="ENAC" />
        <p>Prazo como prioridade. Construção como propósito.</p>
        <nav aria-label="Rodapé">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
          <a href={privacyUrl}>Política de Privacidade</a>
        </nav>
      </footer>

      <a
        className="whatsapp"
        href={whatsappUrl}
        aria-label="Conversar pelo WhatsApp"
      >
        <Phone size={25} aria-hidden="true" />
      </a>
    </>
  );
}

const container = document.getElementById("root");
const root = window.__enacRoot ?? createRoot(container);
window.__enacRoot = root;

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
