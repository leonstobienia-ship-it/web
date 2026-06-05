# Roteiro técnico V2.4B - Webpart readonly

## Pré-condições

- Scaffold SPFx V2.4A com build local aprovado.
- V2.3C aprovada e vínculo requisição/snapshot/alçada validado.
- Nenhum Power Automate iniciado.
- Nenhuma alteração de lista, permissão ou dado SharePoint nesta rodada.

## Validação local

1. Executar `npx gulp clean`.
2. Executar `npx gulp build`.
3. Confirmar que não há erro TypeScript.
4. Confirmar que `src/prototype/app.js` não foi alterado.
5. Confirmar que o backup V2.2 não foi alterado.
6. Confirmar que `node_modules` não está versionado.

## Validação manual futura em tenant

Executar apenas quando Leon autorizar teste manual da webpart:

1. Abrir a webpart em página SharePoint de teste.
2. Abrir console do navegador.
3. Confirmar log `[ENAC][V2.4B] Diagnostico readonly SharePoint`.
4. Confirmar `origemDados=sharepoint`.
5. Confirmar contagem de usuários/perfis.
6. Confirmar contagem de alçadas ativas.
7. Confirmar contagem de requisições resumo.
8. Confirmar diagnóstico da requisição de teste `ItemId=7`, quando ainda existir.
9. Confirmar ausência de chamadas POST/MERGE/DELETE.
10. Confirmar que a interface visual permanece equivalente à versão homologada.

## Critério de saída

- Build local aprovado.
- Diagnóstico readonly preparado.
- Nenhuma escrita implementada ou chamada pela webpart.
- Próxima etapa definida para consumir dados readonly no estado da webpart, com fallback local.
