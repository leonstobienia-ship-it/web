# Roteiro tecnico V2.4C - Consumo readonly no estado da webpart

Data: 2026-06-05

## Escopo

Validar que a webpart SPFx consome dados readonly do SharePoint no estado interno, mantendo fallback local e sem executar escrita.

## Validacao local

1. Confirmar branch:

   ```powershell
   git branch --show-current
   ```

2. Executar build local:

   ```powershell
   npx gulp clean
   npx gulp build
   ```

3. Conferir que nao ha persistencia local na webpart:

   ```powershell
   rg -n "localStorage|sessionStorage" src/webparts/enacSistema
   ```

4. Conferir ausencia de chamadas efetivas de escrita:

   ```powershell
   rg -n "spHttpClient\.post|method:\s*[\"']POST|MERGE|PATCH|DELETE|persistirSnapshotAprovacaoCompra\(|criarSnapshot|vincularSnapshot" src/webparts/enacSistema
   ```

5. Confirmar que ocorrencias residuais sejam apenas declaracoes ou metodos bloqueados, sem chamada pelo componente.

   Ocorrencias esperadas nesta rodada:

   - `criarSnapshotAprovacaoCompra`: metodo local que apenas monta o objeto de snapshot em memoria;
   - `persistirSnapshotAprovacaoCompra`: metodo bloqueado explicitamente e nao chamado pela webpart.

## Validacao manual futura no tenant

1. Instalar/publicar a webpart em ambiente controlado, somente apos autorizacao.
2. Abrir a pagina com console do navegador em build debug.
3. Confirmar log `[ENAC][V2.4C] Dados readonly SharePoint carregados no estado`.
4. Confirmar contagens de usuarios/perfis, alcadas e requisicoes resumo.
5. Confirmar que `origemDadosEfetiva` muda para `sharepoint` quando as leituras passam.
6. Simular falha de leitura em ambiente controlado e confirmar fallback local, sem quebra visual.
7. Confirmar que nenhuma lista, coluna, item ou permissao foi alterada.

## Criterios de aceite

- Build SPFx local concluido.
- Interface visual homologada preservada.
- `src/prototype/app.js` preservado.
- Backup V2.2 preservado.
- Dados readonly mantidos em estado interno.
- Fallback local funcionando por erro controlado.
- Nenhum metodo de escrita chamado.
- Power Automate nao iniciado.
