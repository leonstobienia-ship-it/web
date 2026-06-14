# Checklist V3.0D - leitura apos reload

## Validacoes locais

- [ ] `scripts/web/validar-config-v3.0b.ps1` retorna `Status = OK`.
- [ ] `ClientIdWrite = true`.
- [ ] `ScopeWrite = true`.
- [ ] `Issues = []`.
- [ ] `.env` permanece ignorado.
- [ ] `tsc` do host web passa.
- [ ] `tsc` da raiz passa.
- [ ] `npm run web:build` passa.
- [ ] `gulp clean` passa.
- [ ] `gulp build` passa.

## Validacao manual no portal

1. Abrir `http://localhost:5173/`.
2. Entrar com Microsoft Entra.
3. Abrir o Sistema ENAC.
4. Recarregar a pagina.
5. Validar `Clientes`:
   - clientes derivados das obras reais aparecem;
   - nao volta para somente dados mockados.
6. Validar `Obras`:
   - obras reais da Lista 01 aparecem;
   - a selecao de obra na nova solicitacao usa a base real.
7. Validar `Fornecedores`:
   - fornecedores reais da Lista 06 aparecem quando existirem;
   - dados bancarios e contatos sao exibidos quando preenchidos na lista.
8. Validar `Requisições`:
   - itens reais da Lista 02 aparecem apos reload;
   - itens de teste `TESTE_V3_0C_NAO_OPERACIONAL` continuam visiveis quando ainda existirem na lista.
9. Validar administracao:
   - usuarios/perfis continuam carregando;
   - alcadas continuam carregando;
   - historico continua carregando quando disponivel.

## Restricoes

- [ ] Nao executar escrita durante a validacao.
- [ ] Nao criar nova solicitacao.
- [ ] Nao alterar item real.
- [ ] Nao executar `DELETE`.
- [ ] Nao iniciar Power Automate.
- [ ] Nao alterar listas, colunas ou permissoes.

