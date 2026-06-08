# Roteiro V2.6B.2 - Revisao do Script Protegido

Data: 2026-06-08

## Objetivo

Revisar localmente o script protegido de permissoes finas sem executar aplicacao real no SharePoint.

## Checklist

- Confirmar branch `dev/v2.3-sharepoint-integracao`.
- Confirmar working tree limpa antes da rodada.
- Validar sintaxe PowerShell do script 11.
- Executar o script 11 sem `-Apply` e confirmar que nao ha conexao.
- Confirmar que sem `-Apply` o script imprime apenas o plano.
- Confirmar que `-ConfirmPermissoes` exige `APLICAR-PERMISSOES-V2.6B-ENAC`.
- Confirmar bloqueio do ClientId readonly `0dab19b3-8e48-4f89-ad94-1446b08d3781`.
- Confirmar bloqueio de SiteUrl fora de `/sites/Equipe.Obras`.
- Confirmar que membros reais nao sao adicionados.
- Confirmar que listas operacionais nao recebem permissao real nesta versao.
- Confirmar ausencia de `Remove-PnP`.
- Confirmar ausencia de Graph.
- Confirmar ausencia de alteracao de itens.
- Confirmar que Power Automate nao e iniciado.

## Comando de revisao local permitido

```powershell
.\scripts\sharepoint\11-permissoes-finas-v2.6b-apply.ps1 `
  -SiteUrl "https://enaccombr.sharepoint.com/sites/Equipe.Obras" `
  -Tenant "enaccombr.onmicrosoft.com" `
  -ClientId "<CLIENT-ID-FUTURO-APP-PERMISSOES>" `
  -Ambiente "TesteControlado"
```

O comando acima nao deve usar `-Apply` nesta rodada.

## Comando proibido nesta rodada

```powershell
.\scripts\sharepoint\11-permissoes-finas-v2.6b-apply.ps1 -Apply
```

Qualquer execucao com `-Apply` fica reservada para rodada futura autorizada por Leon.

## Criterios para liberar rodada futura

- Leon revisar grupos e listas.
- Leon aprovar se a proxima etapa sera dry-run conectado/readonly ou aplicacao real controlada.
- Confirmar app Entra ID adequado para permissao.
- Registrar permissoes atuais antes de qualquer alteracao.
- Definir membros reais dos grupos em documento proprio.
