# Checklist V3.18A-D - Homologacao, Navegacao e Acessos

## Git e ambiente

- [ ] Branch criada a partir de `main`.
- [ ] Working tree limpo antes da implementacao.
- [ ] `.git/index.lock` ausente.
- [ ] Docker/PostgreSQL healthy.
- [ ] `/health` OK.
- [ ] `/health/db` OK.
- [ ] `b004592` nao e ancestral do HEAD.

## Interface

- [ ] Topbar exibe usuario.
- [ ] Topbar exibe perfil ativo.
- [ ] Topbar nao exibe `Modulo` como seletor principal.
- [ ] Seletor secundario `Navegar para tela` funciona.
- [ ] Menu lateral tem grupos recolhiveis.
- [ ] Grupo ativo inicia aberto.
- [ ] Demais grupos podem ser abertos por clique.
- [ ] `Administracao de Acessos` aparece em grupo proprio.
- [ ] Tela de acessos mostra Usuarios, Perfis, Escopos e Alcadas.
- [ ] `Sistema atual` nao aparece como item principal de navegacao.
- [ ] Legado aparece como `Legado - consulta`.

## Acessos

- [ ] Usuarios carregam.
- [ ] Perfis carregam.
- [ ] Escopos carregam.
- [ ] Alcadas carregam.
- [ ] Cards de resumo exibem contagens.
- [ ] Abas existentes seguem operacionais.
- [ ] Nenhuma regra de alcada foi alterada.

## Validacoes automatizadas

- [ ] `npm.cmd run build` em `server`.
- [ ] `npm.cmd run migrate`.
- [ ] `npm.cmd run smoke:cadastros`.
- [ ] `npm.cmd run smoke:acessos`.
- [ ] `npm.cmd run smoke:aprovacoes`.
- [ ] `npm.cmd run smoke:central-tarefas`.
- [ ] `npm.cmd run smoke:auditoria`.
- [ ] `npm.cmd run smoke:documentos`.
- [ ] `npm.cmd run smoke:homologacao`.
- [ ] `npm.cmd run web:build`.
- [ ] `npx.cmd tsc -p web/tsconfig.json --noEmit`.
- [ ] `npx.cmd tsc -p tsconfig.json --noEmit`.
- [ ] `git diff --check`.

## Travas

- [ ] Sem migration nova.
- [ ] Sem endpoint novo.
- [ ] Sem pagamento.
- [ ] Sem baixa nova.
- [ ] Sem CNAB.
- [ ] Sem integracao bancaria.
- [ ] Sem banco de producao.
- [ ] Sem NFS-e real.
- [ ] Sem prefeitura.
- [ ] Sem boleto.
- [ ] Sem SharePoint/Graph/Entra/Power Automate real.
- [ ] Sem upload externo.
- [ ] Sem `DELETE` fisico.
