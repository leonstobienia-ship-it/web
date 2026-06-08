# Auditoria manual de grupos e permissoes V2.6B.3C

Data: 2026-06-08
Executor: Leon

## Site auditado

- Site: `05 - Obras em Andamento`
- URL de permissoes visualizada: `https://enaccombr.sharepoint.com/sites/Equipe.Obras/_layouts/15/user.aspx`

## Permissoes do site

| Principal/Grupo | Tipo | Papel | Observacao |
| --- | --- | --- | --- |
| Obras em Andamento Owners | Grupo do SharePoint | Controle Total | Grupo padrao do site |
| Obras em Andamento Members | Grupo do SharePoint | Editar | Grupo padrao do site |
| Obras em Andamento Visitors | Grupo do SharePoint | Leitura | Grupo padrao do site |

Observacao da tela: parte do conteudo deste site tem permissoes diferentes do que e exibido na tela do site. Isso indica que algumas listas, bibliotecas ou itens podem ter permissoes proprias. As quatro listas administrativas conferidas nesta auditoria herdam permissoes do pai.

## Grupos planejados

| Grupo | Status | Qtde membros | Observacao |
| --- | --- | --- | --- |
| ENAC Sistema Admin | NAO_ENCONTRADO_NA_PERMISSAO_DO_SITE | NAO_VERIFICADO | Governanca por grupo ENAC ainda nao aplicada ao site |
| ENAC Diretoria | NAO_ENCONTRADO_NA_PERMISSAO_DO_SITE | NAO_VERIFICADO | Governanca por grupo ENAC ainda nao aplicada ao site |
| ENAC Planejamento | NAO_ENCONTRADO_NA_PERMISSAO_DO_SITE | NAO_VERIFICADO | Governanca por grupo ENAC ainda nao aplicada ao site |
| ENAC Compras Financeiro | NAO_ENCONTRADO_NA_PERMISSAO_DO_SITE | NAO_VERIFICADO | Governanca por grupo ENAC ainda nao aplicada ao site |
| ENAC Cotacoes Contratos | NAO_ENCONTRADO_NA_PERMISSAO_DO_SITE | NAO_VERIFICADO | Governanca por grupo ENAC ainda nao aplicada ao site |
| ENAC Campo Engenharia | NAO_ENCONTRADO_NA_PERMISSAO_DO_SITE | NAO_VERIFICADO | Governanca por grupo ENAC ainda nao aplicada ao site |
| ENAC Leitura Auditoria | NAO_ENCONTRADO_NA_PERMISSAO_DO_SITE | NAO_VERIFICADO | Governanca por grupo ENAC ainda nao aplicada ao site |

Interpretacao: os grupos ENAC planejados nao estao aplicados nas permissoes do site. Isso nao prova isoladamente que os grupos nao existem no tenant, mas confirma que a governanca por grupos ENAC ainda nao esta aplicada ao site.

## Listas administrativas

| Lista | Heranca | Grupos/Papeis visiveis | Observacao |
| --- | --- | --- | --- |
| ENAC Usuarios Perfis | HERDA | Modelo padrao do site | Permissoes finas ainda nao aplicadas |
| ENAC Alcadas | HERDA | Modelo padrao do site | Permissoes finas ainda nao aplicadas |
| ENAC Historico Configuracoes | HERDA | Modelo padrao do site | Permissoes finas ainda nao aplicadas |
| ENAC Snapshots Regras | HERDA | Modelo padrao do site | Permissoes finas ainda nao aplicadas |

## Usuarios individuais com acesso direto relevante

| Existe usuario individual direto? | Observacao |
| --- | --- |
| NAO_REGISTRADO | Auditoria registrou apenas grupos padrao do site e status dos grupos ENAC planejados |

## Conclusao

- Grupos prontos para aplicacao real: nao.
- Listas administrativas prontas para quebra de heranca: dependem de criacao/validacao previa dos grupos ENAC.
- Riscos antes da aplicacao: listas administrativas ainda herdam permissoes do site e grupos ENAC planejados nao estao aplicados ao site.
- Recomendacao: seguir para V2.6B.4 ou V2.6B.4-prep, com criacao/validacao dos grupos ENAC e aplicacao real controlada das permissoes administrativas.

## Confirmacao de seguranca

- Sem e-mails: sim.
- Sem tokens/codigos: sim.
- Sem dados de itens: sim.
- Sem dados operacionais: sim.
