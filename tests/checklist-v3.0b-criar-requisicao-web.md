# Checklist V3.0b - criar requisicao no portal web

## Pre-validacao local

- Build web concluido sem erro.
- Build TypeScript compartilhado concluido sem erro.
- `src/prototype/app.js` sem alteracao.
- `README-RoG_Leon.md` fora do commit.

## Teste manual sem escrita

- Abrir `http://localhost:5173/`.
- Entrar com Microsoft Entra.
- Abrir `Sistema`.
- Confirmar mensagem de leitura quando as flags V3.0b estiverem desligadas.
- Criar uma solicitacao e confirmar que a tela avisa que a persistencia esta desabilitada.

## Teste manual com escrita controlada

- Usar app Entra com permissao delegada de escrita aprovada.
- Confirmar que `VITE_ENAC_ENTRA_CLIENT_ID` nao e o ClientId readonly de inventario `0dab19b3-8e48-4f89-ad94-1446b08d3781`.
- Configurar `VITE_ENAC_SHAREPOINT_SCOPE` com escopo de escrita compatível.
- Configurar `VITE_ENAC_HABILITAR_ESCRITA_REQUISICAO_V30B=true`.
- Configurar `VITE_ENAC_MODO_TESTE_WEB_V30B=true`.
- Configurar `VITE_ENAC_CONFIRMACAO_MANUAL_V30B=CONFIRMAR-ESCRITA-WEB-V3.0B-ENAC`.
- Confirmar que a tela mostra `Escrita V3.0b liberada para teste controlado`.
- Criar uma solicitacao com obra real carregada da Lista 01.
- Confirmar item novo na Lista 02 com titulo contendo `V3.0B-WEB-TESTE`.
- Confirmar `ObraId`, `CentrodeCusto`, tipo, descricao, quantidade, unidade e status `Recebida`.
- Confirmar auditoria em `ENAC Historico Configuracoes`.

## Bloqueios esperados

- Usuario inativo deve ser bloqueado.
- Usuario sem permissao de criar solicitacao deve ser bloqueado.
- Obra local sem ID numerico real deve ser bloqueada.
- Ausencia da confirmacao manual deve bloquear a escrita.
- App readonly ou escopo readonly deve ser bloqueado na propria tela antes da tentativa de escrita.
