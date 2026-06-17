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
const SITE_IMAGE = "/images/site/";
const defaultTitle = "ENAC Empreendimentos | Construção comercial, industrial e logística";
const defaultDescription =
  "Engenharia e construção para obras comerciais, industriais, logísticas, hoteleiras e corporativas com escopo, prazo e fornecedores coordenados.";
const privacyTitle = "Política de Privacidade | ENAC Empreendimentos";
const privacyDescription =
  "Política de Privacidade da ENAC Empreendimentos para tratamento de dados enviados por formulários de contato comercial.";
const privacyUrl = "/politica-de-privacidade/";
const whatsappMessage =
  "Olá, gostaria de falar com a ENAC sobre uma demanda de obra.\nEmpresa:\nCidade:\nSegmento:\nTipo de obra:\nPrazo desejado:";
const whatsappUrl = `https://wa.me/5519983310333?text=${encodeURIComponent(whatsappMessage)}`;
const legacyHashRedirects = {
  "#fale-conosco": "#contato",
};

const navItems = [
  { label: "Quem somos", href: "#quem-somos" },
  { label: "Método", href: "#metodo" },
  { label: "Atuação", href: "#atuacao" },
  { label: "Obras", href: "#obras" },
  { label: "Clientes", href: "#clientes" },
  { label: "Contato", href: "#contato" },
];

const heroSlides = [
  {
    name: "Fulwood Bandeirantes Business Park",
    image: `${SITE_IMAGE}hero/hero-fulwood-bandeirantes-business-park.webp`,
    alt: "Vista aérea de condomínio de galpões logísticos, com implantação de grande escala e áreas operacionais.",
    position: "center center",
  },
  {
    name: "Empreendimento logístico próximo a Viracopos",
    image: `${SITE_IMAGE}obras/bresco-viracopos/bresco-viracopos-capa-aerea.webp`,
    alt: "Vista aérea de empreendimento logístico próximo ao Aeroporto de Viracopos, com galpões, áreas administrativas e acesso rodoviário.",
    position: "center center",
  },
  {
    name: "Unidade industrial em Sorocaba",
    image: `${SITE_IMAGE}obras/cnh-sorocaba/cnh-sorocaba-fachada-corporativa.webp`,
    alt: "Fachada corporativa envidraçada de unidade industrial com áreas de operação.",
    position: "center center",
  },
  {
    name: "Varejo alimentar e atacarejo",
    image: `${SITE_IMAGE}obras/varejo-alimentar/varejo-makro-capa-aerea.webp`,
    alt: "Vista aérea de unidade de atacarejo com estacionamento, acessos e implantação operacional.",
    position: "center center",
  },
  {
    name: "Empreendimento hoteleiro em Campinas",
    image: `${SITE_IMAGE}obras/royal-palm-plaza/royal-palm-plaza-capa-fachada.webp`,
    alt: "Fachada principal de empreendimento hoteleiro em Campinas, com arquitetura de alto padrão, acesso e paisagismo.",
    position: "center center",
  },
];

const method = [
  {
    icon: ClipboardList,
    title: "Diagnóstico de viabilidade",
    text: "Leitura técnica do terreno, da operação, do prazo e das restrições antes da obra avançar.",
  },
  {
    icon: Layers3,
    title: "Projeto executivo coordenado",
    text: "Compatibilização das disciplinas para reduzir improviso, retrabalho e ruído no canteiro.",
  },
  {
    icon: CalendarCheck,
    title: "Execução com ritmo controlado",
    text: "Cronograma, suprimentos, fornecedores e canteiro acompanhados com governança objetiva.",
  },
  {
    icon: CheckCircle2,
    title: "Entrega pronta para uso",
    text: "Finalização orientada ao funcionamento, à segurança, à documentação e à transição operacional.",
  },
];

const differentiators = [
  {
    icon: Target,
    title: "Escopo definido antes da execução",
    text: "Briefing, prioridades, restrições e critérios de entrega alinhados antes da obra avançar.",
  },
  {
    icon: Building2,
    title: "Coordenação técnica e operacional",
    text: "Projetos, fornecedores e campo conduzidos com uma visão integrada do empreendimento.",
  },
  {
    icon: ShieldCheck,
    title: "Entrega pensada para uso real",
    text: "Finalização considerando funcionamento, segurança, documentação e operação.",
  },
];

const sectors = [
  {
    key: "logistica",
    name: "Logística e distribuição",
    icon: Warehouse,
    image: `${SITE_IMAGE}obras/bresco-viracopos/bresco-viracopos-capa-aerea.webp`,
    alt: "Vista aérea de empreendimento logístico próximo ao Aeroporto de Viracopos, com galpões, áreas administrativas e acesso rodoviário.",
    lead: "Galpões, centros de distribuição, parques logísticos e estruturas frigorificadas com operação planejada desde o início.",
    evidence: ["Galpões logísticos", "Centros de distribuição", "Pátios operacionais", "Acesso rodoviário"],
    needs: ["Fluxo de docas", "Pé-direito e piso industrial", "Expansão futura"],
  },
  {
    key: "industria",
    name: "Indústrias",
    icon: Factory,
    image: `${SITE_IMAGE}obras/cnh-sorocaba/cnh-sorocaba-fachada-corporativa.webp`,
    alt: "Fachada corporativa envidraçada de unidade industrial com áreas de operação.",
    lead: "Obras de alta complexidade que exigem integração entre produção, infraestrutura, segurança e continuidade operacional.",
    evidence: ["Unidades industriais", "Áreas corporativas", "Infraestrutura crítica", "Ambientes de apoio"],
    needs: ["Continuidade operacional", "Infraestrutura crítica", "Segurança de canteiro"],
  },
  {
    key: "varejo",
    name: "Varejo alimentar e atacarejo",
    icon: ShoppingCart,
    image: `${SITE_IMAGE}obras/varejo-alimentar/varejo-makro-capa-aerea.webp`,
    alt: "Vista aérea de unidade de atacarejo com estacionamento, acessos e implantação operacional.",
    lead: "Obras para supermercados, atacarejos e operações de varejo alimentar, com atenção a fluxo de clientes, áreas de atendimento, infraestrutura operacional e prazos de implantação.",
    evidence: ["Supermercados", "Atacarejos", "Áreas de atendimento", "Implantação operacional"],
    needs: ["Abertura rápida", "Adequação de loja", "Obra em área urbana"],
  },
  {
    key: "concessionarias",
    name: "Concessionárias",
    icon: Car,
    image: `${SITE_IMAGE}obras/concessionarias-tempo/tempo-valinhos-fachada-principal.webp`,
    alt: "Fachada de concessionária com showroom, área externa e identidade visual corporativa.",
    lead: "Showrooms e oficinas com padrão de marca, exposição, circulação e operação de pós-venda.",
    evidence: ["Showrooms", "Oficinas", "Padrão de montadora", "Fluxo de atendimento"],
    needs: ["Padrão de montadora", "Oficina e showroom", "Fluxo de atendimento"],
  },
  {
    key: "hospitalidade",
    name: "Hotelaria",
    icon: Hotel,
    image: `${SITE_IMAGE}obras/royal-palm-plaza/royal-palm-plaza-capa-fachada.webp`,
    alt: "Fachada principal de empreendimento hoteleiro em Campinas, com arquitetura de alto padrão, acesso e paisagismo.",
    lead: "Hotéis, resorts e torres corporativas com exigência de acabamento, conforto e experiência de uso.",
    evidence: ["Resorts", "Hotéis urbanos", "Áreas de lazer", "Ambientes de alto padrão"],
    needs: ["Acabamento técnico", "Conforto do usuário", "Entrega por etapas"],
  },
  {
    key: "saude",
    name: "Saúde e corporativo",
    icon: Building2,
    image: `${SITE_IMAGE}obras/centro-medico-campinas/centro-medico-campinas-capa-fachada.webp`,
    alt: "Fachada do Centro Médico Campinas com acesso de recepção e comunicação visual.",
    lead: "Ambientes de atendimento, áreas corporativas e interiores técnicos com organização de fluxo, acabamento e entrega pronta para uso.",
    evidence: ["Centros médicos", "Interiores corporativos", "Recepção e atendimento", "Controle de acesso"],
    needs: ["Fluxo de usuários", "Acabamento interno", "Operação pronta para uso"],
  },
];

const projects = [
  {
    name: "Fulwood Bandeirantes Business Park",
    segment: "Logística e galpões",
    description:
      "Conjunto de galpões logísticos com implantação de grande escala, áreas operacionais, acessos e infraestrutura voltada à operação empresarial.",
    image: `${SITE_IMAGE}obras/fulwood-bandeirantes/fulwood-bandeirantes-capa-aerea.webp`,
    alt: "Vista aérea do Fulwood Bandeirantes Business Park com galpões logísticos e infraestrutura operacional.",
  },
  {
    name: "Unidade industrial em Sorocaba",
    segment: "Indústria",
    description:
      "Obra industrial com áreas corporativas, fachada técnica, ambientes internos e infraestrutura voltada à operação de grande porte.",
    image: `${SITE_IMAGE}obras/cnh-sorocaba/cnh-sorocaba-fachada-corporativa.webp`,
    alt: "Fachada corporativa envidraçada de unidade industrial com intervenção executada pela ENAC.",
  },
  {
    name: "Empreendimento logístico próximo a Viracopos",
    segment: "Logística e galpões",
    description:
      "Empreendimento logístico com galpões, áreas administrativas, pátios operacionais e acesso rodoviário próximo ao Aeroporto de Viracopos.",
    image: `${SITE_IMAGE}obras/bresco-viracopos/bresco-viracopos-capa-aerea.webp`,
    alt: "Vista aérea de empreendimento logístico próximo ao Aeroporto de Viracopos, com galpões, áreas administrativas e acesso rodoviário.",
  },
  {
    name: "Empreendimento logístico em Sorocaba",
    segment: "Indústria e logística",
    description:
      "Empreendimento industrial/logístico em Sorocaba, com áreas operacionais, infraestrutura externa e implantação voltada ao uso corporativo.",
    image: `${SITE_IMAGE}obras/aedi-aurora-sorocaba/aedi-aurora-capa-aerea.webp`,
    alt: "Vista aérea de empreendimento logístico com galpões, pátio operacional e acesso rodoviário.",
  },
  {
    name: "Varejo alimentar e atacarejo",
    segment: "Varejo alimentar",
    description:
      "Obras para supermercados, atacarejos e operações de varejo alimentar, com atenção a fluxo de clientes, áreas de atendimento, infraestrutura operacional e prazos de implantação.",
    image: `${SITE_IMAGE}obras/varejo-alimentar/varejo-makro-capa-aerea.webp`,
    alt: "Vista aérea de unidade de atacarejo com estacionamento, acessos e implantação operacional.",
  },
  {
    name: "Concessionárias automotivas",
    segment: "Concessionárias e showrooms automotivos",
    description:
      "Empreendimentos automotivos com showroom, áreas técnicas, fachada comercial e operação voltada ao atendimento ao público.",
    image: `${SITE_IMAGE}obras/concessionarias-tempo/tempo-valinhos-fachada-principal.webp`,
    alt: "Fachada de concessionária executada pela ENAC, com showroom, área externa e identidade visual corporativa.",
  },
  {
    name: "Empreendimento hoteleiro em Campinas",
    segment: "Hotelaria e resorts",
    description:
      "Empreendimento hoteleiro com múltiplas edificações, áreas de lazer, auditório, acessos e infraestrutura externa.",
    image: `${SITE_IMAGE}obras/royal-palm-plaza/royal-palm-plaza-capa-fachada.webp`,
    alt: "Fachada principal de empreendimento hoteleiro em Campinas, com arquitetura de alto padrão, acesso e paisagismo.",
  },
  {
    name: "Centro médico em Campinas",
    segment: "Saúde e interiores corporativos",
    description:
      "Ambiente de recepção e atendimento com acabamento interno, controle de acesso, organização de fluxo e entrega pronta para operação.",
    image: `${SITE_IMAGE}obras/centro-medico-campinas/centro-medico-campinas-capa-fachada.webp`,
    alt: "Fachada do Centro Médico Campinas com acesso de recepção e comunicação visual.",
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
  { name: "Cobasi", logo: `${SITE_IMAGE}clientes/logo-cobasi.png`, alt: "Logo Cobasi." },
  { name: "Ecopátio", logo: `${SITE_IMAGE}clientes/logo-ecopatio.png`, alt: "Logo Ecopátio." },
  {
    name: "Centro Médico Campinas",
    logo: `${SITE_IMAGE}clientes/logo-centro-medico-campinas.png`,
    alt: "Logo Centro Médico Campinas.",
  },
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
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [formMode, setFormMode] = useState(formModes[0].id);
  const [submitState, setSubmitState] = useState("idle");
  const isPrivacyPage = window.location.pathname.replace(/\/+$/, "") === "/politica-de-privacidade";

  useEffect(() => {
    function redirectLegacyHash() {
      const mappedHash = legacyHashRedirects[window.location.hash];

      if (mappedHash) {
        window.history.replaceState(null, "", mappedHash);
        window.requestAnimationFrame(() => {
          document.querySelector(mappedHash)?.scrollIntoView();
        });
      }
    }

    redirectLegacyHash();
    window.addEventListener("hashchange", redirectLegacyHash);

    return () => window.removeEventListener("hashchange", redirectLegacyHash);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReducedMotion(mediaQuery.matches);

    updateMotionPreference();
    mediaQuery.addEventListener?.("change", updateMotionPreference);

    return () => mediaQuery.removeEventListener?.("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    if (isPrivacyPage || heroPaused || reducedMotion) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setHeroIndex((index) => (index + 1) % heroSlides.length);
    }, 5500);

    return () => window.clearInterval(interval);
  }, [heroPaused, isPrivacyPage, reducedMotion]);

  useEffect(() => {
    if (isPrivacyPage || reducedMotion || !("IntersectionObserver" in window)) {
      return undefined;
    }

    const revealItems = document.querySelectorAll("[data-reveal]");
    document.body.classList.add("reveal-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 },
    );

    revealItems.forEach((item) => observer.observe(item));

    return () => {
      observer.disconnect();
      document.body.classList.remove("reveal-ready");
    };
  }, [isPrivacyPage, reducedMotion]);

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
        <section
          className="hero"
          aria-label="Destaque institucional da ENAC"
          onMouseEnter={() => setHeroPaused(true)}
          onMouseLeave={() => setHeroPaused(false)}
          onFocus={() => setHeroPaused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setHeroPaused(false);
            }
          }}
        >
          <div className="hero-media">
            {heroSlides.map((slide, index) => (
              <img
                key={slide.image}
                className={`hero-slide${heroIndex === index ? " is-active" : ""}`}
                src={slide.image}
                alt={heroIndex === index ? slide.alt : ""}
                aria-hidden={heroIndex !== index}
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
                style={{ objectPosition: slide.position }}
              />
            ))}
          </div>
          <div className="hero-content">
            <span className="kicker">
              <span>Engenharia para obras complexas</span>
            </span>
            <h1>Da decisão à operação, a obra sob controle.</h1>
            <p>
              A ENAC estrutura, coordena e executa obras comerciais, industriais, logísticas e
              hoteleiras com planejamento técnico, controle de fornecedores e foco na entrega
              operacional.
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
            <div className="hero-dots" aria-label="Imagens em destaque no início">
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.name}
                  className={heroIndex === index ? "is-active" : ""}
                  type="button"
                  aria-label={`Mostrar imagem: ${slide.name}`}
                  aria-pressed={heroIndex === index}
                  onClick={() => setHeroIndex(index)}
                >
                  <span />
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="section about" id="quem-somos" data-reveal>
          <div className="about-copy">
            <span className="kicker">Quem somos</span>
            <h2>Uma construtora para empreendimentos que precisam sair do projeto e entrar em operação.</h2>
            <p>
              A ENAC atua na construção de empreendimentos comerciais, industriais, logísticos,
              hoteleiros e corporativos. Mais do que executar obra, coordena escopo, projetos,
              fornecedores e canteiro para reduzir improvisos e conduzir cada etapa com
              previsibilidade. A trajetória reúne mais de 300 empreendimentos e +1.000.000 m²
              executados em diferentes segmentos.
            </p>
          </div>
        </section>

        <section className="section differentiators" id="diferenciais" data-reveal>
          <div className="section-heading narrow">
            <span className="kicker">Diferenciais</span>
            <h2>O resultado da obra começa antes do canteiro.</h2>
          </div>
          <div className="differentiator-grid">
            {differentiators.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} data-reveal>
                  <Icon size={30} aria-hidden="true" />
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="section method" id="metodo" data-reveal>
          <div className="section-heading">
            <span className="kicker">Método</span>
            <h2>Um processo claro para reduzir risco, retrabalho e urgência.</h2>
            <p>
              Cada obra começa com diagnóstico técnico, definição de escopo e coordenação das
              disciplinas envolvidas. A ENAC organiza o processo para controlar fornecedores,
              reduzir interferências e conduzir a execução até a entrega pronta para uso.
            </p>
          </div>
          <div className="method-rail">
            {method.map((step, index) => {
              const Icon = step.icon;
              return (
                <article className="method-step" key={step.title} data-reveal>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <Icon size={28} aria-hidden="true" />
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="section sectors" id="atuacao" data-reveal>
          <div className="section-heading narrow">
            <span className="kicker">Atuação</span>
            <h2>Cada segmento exige uma resposta técnica diferente.</h2>
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
                    aria-controls="sector-panel"
                    onMouseEnter={() => setActiveSector(sector.key)}
                    onFocus={() => setActiveSector(sector.key)}
                    onClick={() => setActiveSector(sector.key)}
                  >
                    <Icon size={20} aria-hidden="true" />
                    {sector.name}
                  </button>
                );
              })}
            </div>

            <article className="sector-detail" id="sector-panel">
              <img
                key={selectedSector.key}
                src={selectedSector.image}
                alt={selectedSector.alt}
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

        <section className="section projects" id="obras" data-reveal>
          <div className="section-heading">
            <span className="kicker">Obras</span>
            <h2>Obras que demonstram escala, prazo e capacidade de execução.</h2>
            <p>
              O portfólio reúne empreendimentos comerciais, logísticos, industriais e hoteleiros
              executados em diferentes níveis de complexidade, sempre com foco em entrega,
              operação e controle.
            </p>
          </div>
          <div className="project-table" aria-label="Obras em destaque">
            {projects.map((project) => (
              <article key={project.name} data-reveal>
                <figure>
                  <img src={project.image} alt={project.alt} loading="lazy" />
                </figure>
                <div className="project-body">
                  <h3>{project.name}</h3>
                  <p>{project.description}</p>
                  <span>{project.segment}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section esg" id="esg" data-reveal>
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
          <div className="section-heading narrow" data-reveal>
            <span className="kicker">Clientes</span>
            <h2>Empresas que precisam de obra com padrão, prazo e controle.</h2>
          </div>
          <div className="client-logo-grid" aria-label="Clientes atendidos">
            {clients.map((client) => (
              <figure key={client.name} data-reveal>
                <img src={client.logo} alt={client.alt ?? client.name} loading="lazy" />
              </figure>
            ))}
          </div>
        </section>

        <section className="section contact" id="contato" data-reveal>
          <div className="contact-panel">
            <span className="kicker">Campinas, SP</span>
            <h2>Vamos transformar sua demanda em um briefing técnico?</h2>
            <p>Envie os dados iniciais da obra para avaliarmos escopo, localização, prazo e próximos passos.</p>
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
        <p>Construção com método, controle e previsibilidade.</p>
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
