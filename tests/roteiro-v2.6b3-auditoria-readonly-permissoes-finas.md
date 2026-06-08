# Roteiro V2.6B.3 - Auditoria Readonly de Permissoes Finas

Data: 2026-06-08

## Objetivo

Validar localmente que o script de auditoria de permissoes finas e somente leitura e preparar a execucao manual por Leon.

## Checklist local do Codex

- Confirmar branch `dev/v2.3-sharepoint-integracao`.
- Validar sintaxe PowerShell do script 12.
- Nao executar o script 12 pelo Codex, pois isso conectaria ao tenant.
- Confirmar que o script 12 nao possui parametro de aplicacao.
- Confirmar ausencia de comandos PnP de escrita.
- Confirmar ausencia de Graph.
- Confirmar ausencia de POST, MERGE, PATCH e DELETE.
- Confirmar `src/prototype/app.js` sem diff.
- Confirmar backup V2.2 sem diff.
- Confirmar artefatos locais ignorados pelo Git.

## Execucao manual por Leon

```powershell
cd "C:\Users\leon\OneDrive - enac.com.br\Documentos\Sistema ENAC"

pwsh -File ".\scripts\sharepoint\12-permissoes-finas-v2.6b-readonly-auditoria.ps1" `
  -SiteUrl "https://enaccombr.sharepoint.com/sites/Equipe.Obras" `
  -Tenant "enaccombr.onmicrosoft.com" `
  -ClientId "<CLIENT-ID-PROVISIONAMENTO-OU-READONLY>" `
  -AuthMode "DeviceLogin"
```

## Resultado esperado

- Relatorio gerado em `sharepoint/auditoria-permissoes-finas-v2.6b3.md`.
- Grupos planejados marcados como `EXISTE` ou `AUSENTE`.
- Listas administrativas marcadas como `EXISTE` ou `AUSENTE`.
- Heranca e papeis atuais listados quando a API permitir.
- Nenhum item de lista lido.
- Nenhum e-mail de membro exportado.
- Nenhuma permissao aplicada.

## O que Leon deve enviar ao Codex

- Saida do terminal.
- Conteudo do relatorio, se seguro.
- Confirmacao visual se ha e-mails ou dados sensiveis no relatorio.
- Eventual erro de permissao.
- Decisao sobre seguir para aplicacao controlada ou ajustar o plano.
