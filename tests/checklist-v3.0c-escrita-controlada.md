# Checklist V3.0c - escrita controlada SharePoint

## Antes da escrita

- Validador executado.
- `Status = OK`.
- `ClientIdWrite = true`.
- `ScopeWrite = true`.
- `Issues = []`.
- `web/.env` ignorado pelo Git.
- Servidor Vite reiniciado apos configuracao local.
- Historico automatico V3.0b desligado para criar somente uma escrita real.

## Escrita unica

- Criar somente uma solicitacao.
- Titulo deve conter `TESTE_V3_0C_NAO_OPERACIONAL`.
- Descricao deve conter `TESTE_V3_0C_NAO_OPERACIONAL`.
- Usar quantidade simbolica `1.11`.
- Nao anexar arquivo.
- Nao criar pedido, NF, pagamento, aprovacao ou snapshot.
- Nao executar escrita em massa.
- Nao executar `DELETE`.

## Resultado validado

- Lista: `Lista 02 — Requisições de Compra`.
- Item criado: `13`.
- Titulo: `V3.0B-WEB-TESTE - TESTE_V3_0C_NAO_OPERACIONAL - validacao minima`.
- Status: `Recebida`.
- Quantidade: `1.11`.
- Unidade: `un`.
- Historico automatico: nao registrado.

## Confirmacao readonly

- Abrir `DispForm.aspx?ID=13`.
- Confirmar marcador no titulo/descricao/observacoes.
- Nao clicar em salvar ou editar.
- Nao apagar o item.

## Validacoes locais finais

- `node.exe .\node_modules\typescript\bin\tsc -p web\tsconfig.json --noEmit --pretty false`
- `node.exe .\node_modules\typescript\bin\tsc -p tsconfig.json --noEmit --pretty false`
- `npm run web:build`
- `node.exe .\node_modules\gulp\bin\gulp.js clean`
- `node.exe .\node_modules\gulp\bin\gulp.js build`
