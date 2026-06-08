# Roteiro V2.6B.4C - Finalizacao Manual de Permissoes Administrativas

Data: 2026-06-08

## Objetivo

Guiar Leon na finalizacao manual da matriz de permissoes das quatro listas administrativas, uma lista por vez, sem uso do script `11-permissoes-finas-v2.6b-apply.ps1`.

## Regras gerais

- Nao usar script durante esta finalizacao.
- Nao mexer em listas operacionais.
- Nao iniciar Power Automate.
- Nunca remover `Obras em Andamento Owners`.
- Nunca clicar em `Excluir permissoes exclusivas`.
- Primeiro adicionar/conferir os grupos ENAC.
- Somente depois remover `Obras em Andamento Members` e `Obras em Andamento Visitors`.
- Registrar evidencia de cada lista antes de passar para a proxima.

## Lista 1 - ENAC Usuarios Perfis

1. Abrir a lista `ENAC Usuarios Perfis`.
2. Acessar `Configuracoes da lista` > `Permissoes desta lista`.
3. Confirmar que a lista possui permissoes exclusivas.
4. Confirmar `Obras em Andamento Owners` com `Controle Total`.
5. Adicionar/conferir:
   - `ENAC Sistema Admin`: `Controle Total`;
   - `ENAC Diretoria`: `Editar`;
   - `ENAC Planejamento`: `Leitura`;
   - `ENAC Leitura Auditoria`: `Leitura`.
6. Confirmar que nao foram adicionados:
   - `ENAC Compras Financeiro`;
   - `ENAC Cotacoes Contratos`;
   - `ENAC Campo Engenharia`.
7. Remover somente depois da conferencia:
   - `Obras em Andamento Members`;
   - `Obras em Andamento Visitors`.
8. Registrar print/status.

## Lista 2 - ENAC Alcadas

1. Abrir a lista `ENAC Alcadas`.
2. Acessar `Configuracoes da lista` > `Permissoes desta lista`.
3. Confirmar que a lista possui permissoes exclusivas.
4. Confirmar `Obras em Andamento Owners` com `Controle Total`.
5. Adicionar/conferir:
   - `ENAC Sistema Admin`: `Controle Total`;
   - `ENAC Diretoria`: `Editar`;
   - `ENAC Planejamento`: `Leitura`;
   - `ENAC Compras Financeiro`: `Leitura`;
   - `ENAC Leitura Auditoria`: `Leitura`.
6. Confirmar que nao foram adicionados:
   - `ENAC Cotacoes Contratos`;
   - `ENAC Campo Engenharia`.
7. Remover somente depois da conferencia:
   - `Obras em Andamento Members`;
   - `Obras em Andamento Visitors`.
8. Registrar print/status.

## Lista 3 - ENAC Historico Configuracoes

1. Abrir a lista `ENAC Historico Configuracoes`.
2. Acessar `Configuracoes da lista` > `Permissoes desta lista`.
3. Confirmar que a lista possui permissoes exclusivas.
4. Confirmar `Obras em Andamento Owners` com `Controle Total`.
5. Adicionar/conferir:
   - `ENAC Sistema Admin`: `Controle Total`;
   - `ENAC Diretoria`: `Leitura`;
   - `ENAC Planejamento`: `Leitura`;
   - `ENAC Compras Financeiro`: `Leitura`;
   - `ENAC Cotacoes Contratos`: `Leitura`;
   - `ENAC Leitura Auditoria`: `Leitura`.
6. Confirmar que nao foi adicionado:
   - `ENAC Campo Engenharia`.
7. Remover somente depois da conferencia:
   - `Obras em Andamento Members`;
   - `Obras em Andamento Visitors`.
8. Registrar print/status.

## Lista 4 - ENAC Snapshots Regras

1. Abrir a lista `ENAC Snapshots Regras`.
2. Acessar `Configuracoes da lista` > `Permissoes desta lista`.
3. Confirmar que a lista possui permissoes exclusivas.
4. Confirmar `Obras em Andamento Owners` com `Controle Total`.
5. Adicionar/conferir:
   - `ENAC Sistema Admin`: `Controle Total`;
   - `ENAC Diretoria`: `Leitura`;
   - `ENAC Planejamento`: `Leitura`;
   - `ENAC Compras Financeiro`: `Leitura`;
   - `ENAC Leitura Auditoria`: `Leitura`.
6. Confirmar que nao foram adicionados:
   - `ENAC Cotacoes Contratos`;
   - `ENAC Campo Engenharia`.
7. Remover somente depois da conferencia:
   - `Obras em Andamento Members`;
   - `Obras em Andamento Visitors`.
8. Registrar print/status.

## Encerramento

Ao final, confirmar:

- as quatro listas continuam com permissoes exclusivas;
- `Obras em Andamento Owners` continua com `Controle Total`;
- `Members` e `Visitors` foram removidos das quatro listas;
- os grupos ENAC estao aplicados conforme matriz;
- nenhuma lista operacional foi alterada;
- Power Automate nao foi iniciado.
