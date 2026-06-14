# Checklist V3.0b - validador do app write

## Configuracao esperada

- `web/.env` existe localmente e nao e versionado.
- `VITE_ENAC_ENTRA_CLIENT_ID` usa `0df147e7-ab5c-407d-b1b1-bb350661bebf`.
- `VITE_ENAC_ENTRA_TENANT_ID` usa `f491ce32-b420-49c1-bca5-a9ed0607c3f2`.
- `VITE_ENAC_SHAREPOINT_SCOPE` usa `https://enaccombr.sharepoint.com/AllSites.Write`.
- `VITE_ENAC_HABILITAR_ESCRITA_REQUISICAO_V30B=true`.
- `VITE_ENAC_MODO_TESTE_WEB_V30B=true`.
- `VITE_ENAC_CONFIRMACAO_MANUAL_V30B=CONFIRMAR-ESCRITA-WEB-V3.0B-ENAC`.

## Comando

```powershell
pwsh -File ".\scripts\web\validar-config-v3.0b.ps1"
```

## Resultado esperado

- `Status = OK`
- `ClientIdReadonly = false`
- `ClientIdWrite = true`
- `ScopeWrite = true`
- `EscritaSolicitada = true`
- `ModoTeste = true`
- `ConfirmacaoValida = true`
- `Issues = []`

## Bloqueios esperados

- App readonly deve retornar `ClientIdReadonly = true` e bloquear escrita se a flag estiver ligada.
- Escopo `AllSites.Read` deve bloquear escrita se a flag estiver ligada.
- Confirmacao ausente deve bloquear escrita.
- `web/.env` nao deve aparecer no commit.

## Pendencia Entra

Se o login retornar `AADSTS500113`, cadastrar `http://localhost:5173/` como Redirect URI de `Single-page application` no app `ENAC Sistema - Write V3.0b`.
