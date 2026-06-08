# Roteiro V2.6B.1 - Dry-run de Permissoes Finas

Data: 2026-06-08

## Objetivo

Validar localmente o script e a documentacao de auditoria de permissoes finas, sem conexao SharePoint e sem aplicacao real.

## Checklist local

- Confirmar working tree limpa antes do inicio.
- Executar `scripts/sharepoint/10-permissoes-finas-v2.6b-dryrun.ps1`.
- Confirmar que a saida inicia com `DRY-RUN V2.6B.1 — nenhuma permissao sera aplicada.`
- Confirmar que a saida informa que nenhuma conexao SharePoint sera executada.
- Confirmar que o script lista grupos sugeridos.
- Confirmar que o script lista listas afetadas e permissoes pretendidas.
- Confirmar que o script lista riscos.
- Confirmar que o script lista acoes nao executadas.
- Confirmar que o script nao possui parametro de aplicacao real.
- Confirmar que o script nao contem conexao PnP.
- Confirmar que o script nao contem comandos PnP de escrita.
- Confirmar que o script nao usa Graph.
- Revisar grupos sugeridos com Leon.
- Revisar permissao pretendida por lista.
- Revisar riscos e rollback.
- Decidir se a proxima rodada podera preparar script real protegido ou se o dry-run deve ser ajustado.

## Comandos sugeridos

```powershell
.\scripts\sharepoint\10-permissoes-finas-v2.6b-dryrun.ps1 -Ambiente "local"
```

```powershell
Select-String -Path .\scripts\sharepoint\10-permissoes-finas-v2.6b-dryrun.ps1 -Pattern "Connect-PnPOnline","Set-PnP","Add-PnP","New-PnP","Remove-PnP","Grant-PnP","BreakRoleInheritance","RoleAssignment","Graph","-Apply","spHttpClient.post","MERGE","PATCH","DELETE"
```

## Resultado esperado

- O script executa localmente.
- Nenhuma conexao e aberta.
- Nenhuma permissao e aplicada.
- Nenhuma lista, item, grupo, usuario ou dado e alterado.
- Power Automate permanece nao iniciado.
- A V2.6B.1 permanece como preparacao, nao homologacao de permissao real.
