# Checklist V2.8E - Validacao Pagina App Sistema ENAC

Data: 2026-06-09

## Pre-condicoes

- Pacote SPFx publicado manualmente por Leon/Admin.
- Webpart com `SharePointFullPage` no manifest.
- Pagina `Sistema ENAC - Homologação` criada.
- Pagina convertida para `SingleWebPartAppPage`.
- Power Automate nao iniciado.

## Validacao Administrador

- [ ] URL abre: `/sites/Equipe.Obras/SitePages/Sistema-ENAC-Homologacao.aspx`.
- [ ] Pagina mostra a webpart `Sistema ENAC`.
- [ ] Layout ocupa a pagina como experiencia principal.
- [ ] Webpart carrega dados conforme origem configurada.
- [ ] Administrador consegue editar pagina quando necessario.
- [ ] Configuracoes da webpart continuam acessiveis apenas a administradores.

## Validacao Usuario Final

- [ ] Usuario final abre a pagina pelo link direto.
- [ ] Usuario final nao ve opcao de editar pagina.
- [ ] Usuario final nao consegue configurar a webpart.
- [ ] Navegacao principal usada e a interface interna do Sistema ENAC.
- [ ] Menus/listas do SharePoint nao sao necessarios para operar o sistema.

## Validacao Tecnica

- [ ] `supportedHosts` contem `SharePointFullPage`.
- [ ] Pagina esta em layout `SingleWebPartAppPage`.
- [ ] Link direto via Teams funciona.
- [ ] Link direto via menu corporativo funciona, se configurado.
- [ ] `?env=WebView` foi testado apenas como opcao visual, sem dependencia oficial.

## Seguranca

- [ ] Usuarios finais sem permissao de edicao.
- [ ] `ENAC Sistema Admin` restrito a administradores.
- [ ] Permissoes internas continuam validadas por usuarios/perfis/alçadas.
- [ ] Nenhuma lista foi alterada durante a validacao.
- [ ] Nenhum dado operacional foi alterado durante a validacao.
- [ ] Power Automate nao foi iniciado.

## Evidencias

Registrar:

- URL validada;
- data/hora;
- usuario administrador testado;
- usuario final testado;
- print da pagina em modo usuario final;
- confirmacao de ausencia de botao de edicao para usuario final;
- observacoes de chrome SharePoint remanescente, se houver.
