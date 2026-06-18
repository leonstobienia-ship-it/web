# ERP ENAC - Homologacao Automatizada Assistida

## Objetivo

Este roteiro combina validacao automatizada por API com validacao visual assistida no Browser interno. Ele serve para confirmar que a equipe pode iniciar homologacao pratica com evidencias tecnicas reproduziveis.

## Preparacao

1. Confirmar Docker/PostgreSQL local healthy.
2. Subir API local em `http://127.0.0.1:3333`.
3. Rodar migrations.
4. Executar:

```powershell
cd "C:\Users\leon\OneDrive - enac.com.br\Documentos\Sistema ENAC\server"
npm.cmd run homologacao:e2e
```

5. Conferir relatorios em:

```text
reports/homologacao/v3.20/
```

## Roteiro Visual no Browser Interno

Iniciar Vite:

```powershell
cd "C:\Users\leon\OneDrive - enac.com.br\Documentos\Sistema ENAC"
npm.cmd run web:dev -- --host 127.0.0.1
```

Abrir:

```text
http://127.0.0.1:5173
```

## Desktop 1440x900

Validar:

- Dashboard Executivo;
- Solicitacoes;
- Cotacoes;
- Pedidos;
- Notas Fiscais de Entrada;
- Contas a Pagar;
- Programacoes de Pagamento;
- Medicoes e Faturamento;
- Relatorios Financeiros;
- Central de Tarefas;
- Riscos e Pendencias;
- Documentos e Anexos;
- Auditoria;
- Administracao de Acessos;
- Homologacao.

Critérios:

- app nao pode ficar em branco;
- nao pode haver overlay de erro Vite/React;
- console sem erro relevante;
- sem overflow horizontal;
- menu lateral com logo oficial e navegacao funcional;
- sem botoes de pagar, baixar, CNAB, banco, boleto, NFS-e, prefeitura ou upload externo real.

## Mobile 390x844

Validar:

- menu fechado por padrao;
- botao de menu abre drawer;
- clicar em item fecha drawer;
- Dashboard Executivo;
- Notas;
- Contas a Pagar;
- Programacoes;
- Central de Tarefas;
- Documentos.

Critérios:

- conteudo ocupa 100% da largura quando menu fechado;
- sem conteudo espremido ao lado da sidebar;
- sem overflow horizontal;
- cards empilham corretamente;
- tabelas usam rolagem controlada quando necessario;
- sem erro de console.

## Interacao Assistida

Criar uma tarefa manual pela Central de Tarefas:

1. Abrir `Central de Tarefas`.
2. Acessar aba `Nova tarefa`.
3. Preencher titulo com `DEV_LOCAL_E2E_V3_20 - tarefa visual`.
4. Salvar.
5. Confirmar toast de sucesso.
6. Confirmar que o formulario foi limpo.
7. Confirmar que a lista foi atualizada.

Esta etapa valida o padrao V3.19 de feedback de criacao e limpeza de formulario.

## Evidencias

Registrar no relatorio final:

- screenshots desktop e mobile, se geradas;
- telas navegadas;
- console sem erro relevante;
- ausencia de botoes proibidos;
- resultado do `homologacao:e2e`;
- caminho do relatorio Markdown/JSON.

## Limites de Seguranca

A homologacao V3.20 nao executa:

- pagamento real;
- baixa nova real;
- CNAB;
- banco real;
- NFS-e real;
- prefeitura;
- boleto real;
- cobranca real;
- SharePoint real;
- Microsoft Graph real;
- Entra real;
- Power Automate real;
- upload externo real;
- `DELETE` fisico.
