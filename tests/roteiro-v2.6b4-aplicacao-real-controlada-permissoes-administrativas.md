# Roteiro V2.6B.4 - Aplicacao Real Controlada de Permissoes Administrativas

Data: 2026-06-08

## Checklist antes do dry-run

- Confirmar `git status --short` limpo.
- Confirmar grupos ENAC criados.
- Confirmar membros funcionais revisados.
- Confirmar que script 11 foi revisado.
- Confirmar que Power Automate nao sera iniciado.
- Confirmar que listas operacionais estao fora do escopo.

## Dry-run

Executar sem `-Apply`:

```powershell
cd "C:\Users\leon\OneDrive - enac.com.br\Documentos\Sistema ENAC"

pwsh -File ".\scripts\sharepoint\11-permissoes-finas-v2.6b-apply.ps1" `
  -SiteUrl "https://enaccombr.sharepoint.com/sites/Equipe.Obras" `
  -Tenant "enaccombr.onmicrosoft.com" `
  -ClientId "8994fd01-5b9b-4e8b-bc11-41c58aa91043" `
  -AuthMode "DeviceLogin" `
  -Ambiente "V2.6B.4"
```

Confirmar que o dry-run:

- nao conecta ao SharePoint;
- nao aplica permissoes;
- imprime somente as quatro listas administrativas;
- nao menciona aplicacao em listas operacionais;
- nao cria grupos;
- nao adiciona/remover membros.

## Apply controlado

Executar somente apos revisar o dry-run:

```powershell
cd "C:\Users\leon\OneDrive - enac.com.br\Documentos\Sistema ENAC"

pwsh -File ".\scripts\sharepoint\11-permissoes-finas-v2.6b-apply.ps1" `
  -SiteUrl "https://enaccombr.sharepoint.com/sites/Equipe.Obras" `
  -Tenant "enaccombr.onmicrosoft.com" `
  -ClientId "8994fd01-5b9b-4e8b-bc11-41c58aa91043" `
  -AuthMode "DeviceLogin" `
  -Ambiente "V2.6B.4" `
  -Apply `
  -ConfirmPermissoes "APLICAR-PERMISSOES-V2.6B-ENAC"
```

## Validacoes apos Apply

- Confirmar `ENAC Usuarios Perfis` com permissao unica.
- Confirmar `ENAC Alcadas` com permissao unica.
- Confirmar `ENAC Historico Configuracoes` com permissao unica.
- Confirmar `ENAC Snapshots Regras` com permissao unica.
- Confirmar `Obras em Andamento Owners` com `Controle Total`.
- Confirmar grupos ENAC aplicados conforme matriz.
- Confirmar listas operacionais inalteradas.
- Confirmar Power Automate nao iniciado.

## Criterios de parada

- Grupo ENAC ausente.
- Lista administrativa ausente.
- Dry-run menciona lista operacional no escopo de aplicacao.
- Script tenta criar/excluir grupo.
- Script tenta adicionar/remover membro.
- Script tenta remover Owners.
- Erro de autenticacao.
- Erro de permissao inesperado.
- Qualquer referencia a Power Automate como acao.

## Relatorio

Preencher `sharepoint/auditoria-pos-aplicacao-permissoes-v2.6b4.template.md` apos a execucao, se `-Apply` for autorizado e concluido.
