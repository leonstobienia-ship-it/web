# Perfis, Escopos e Alcadas ERP ENAC

## Papel no ERP

A V3.5B cria a fundacao local de acesso operacional do ERP ENAC. Ela organiza usuarios, perfis, escopos e regras de alcada para futuras aprovacoes de compra, nota fiscal de entrada e conta a pagar.

Esta etapa nao executa pagamento, baixa, programacao bancaria, liberacao financeira, integracao bancaria, SharePoint real, Microsoft Entra real, Power Automate ou `DELETE` fisico.

## Entidades

### `perfis`

Tabela ja existente desde a fundacao do ERP. Na V3.5B passa a ser usada como cadastro operacional dos perfis internos.

Perfis seed:

```text
ADMIN
DIRETORIA
PLANEJAMENTO
COMPRAS
FINANCEIRO
CAMPO
```

### `escopos_acesso`

Define pares `modulo` + `acao` com status logico.

Modulos iniciais:

```text
cadastros
solicitacoes-compra
cotacoes
pedidos-compra
notas-fiscais-entrada
contas-pagar
usuarios
perfis
alcadas
auditoria
```

Acoes iniciais:

```text
visualizar
criar
editar
inativar
reativar
enviar
aprovar_tecnico
aprovar_diretoria
conferir
cancelar
administrar
```

### `usuarios_perfis`

Relaciona usuarios a perfis, permite perfil principal e usa `status` para inativacao logica.

### `perfis_escopos`

Relaciona perfis a escopos, tambem com inativacao logica.

### `alcadas_aprovacao`

Registra regras por usuario ou perfil, modulo, tipo de documento, obra, centro de custo, faixa de valor, acao e efeito.

### `auditoria_eventos`

Registra criacao, edicao, inativacao, reativacao, vinculos e validacoes de alcada.

## Regras iniciais

- `CAMPO` pode criar Solicitacao de Compra, mas nao aprova compra.
- `COMPRAS` pode conduzir Cotacao e Pedido de Compra, mas nao aprova pagamento.
- `PLANEJAMENTO` pode fazer aprovacao tecnica ate R$ 20.000.
- `DIRETORIA` aprova acima de R$ 20.000.
- `FINANCEIRO` pode conferir Nota Fiscal de Entrada e Conta a Pagar, mas nao libera pagamento sozinho.
- Nenhum perfil executa pagamento nesta versao.

## Endpoints

```text
GET    /perfis
GET    /perfis/:id
POST   /perfis
PATCH  /perfis/:id
PATCH  /perfis/:id/inativar
PATCH  /perfis/:id/reativar

GET    /escopos
POST   /escopos
PATCH  /escopos/:id
PATCH  /escopos/:id/inativar
PATCH  /escopos/:id/reativar

GET    /usuarios-perfis
POST   /usuarios-perfis
PATCH  /usuarios-perfis/:id/inativar
PATCH  /usuarios-perfis/:id/reativar

GET    /perfis-escopos
POST   /perfis-escopos
PATCH  /perfis-escopos/:id/inativar
PATCH  /perfis-escopos/:id/reativar

GET    /alcadas
POST   /alcadas
PATCH  /alcadas/:id
PATCH  /alcadas/:id/inativar
PATCH  /alcadas/:id/reativar
POST   /alcadas/validar
```

## Validacao de alcada

Payload minimo:

```json
{
  "usuario_id": "uuid",
  "modulo": "solicitacoes-compra",
  "tipo_documento": "SOLICITACAO_COMPRA",
  "acao": "aprovar_tecnico",
  "valor": 15000
}
```

Resposta:

```json
{
  "data": {
    "aprovado": true,
    "decisao": "PERMITIDO",
    "motivo": "Regra PERMITIR encontrada."
  }
}
```

## Smoke

```powershell
cd server
npm.cmd run smoke:acessos
```

O smoke usa marcador `DEV_LOCAL_V3_5B` e valida criacao/listagem, vinculos, alcada ate/acima de R$ 20.000 e ausencia de `DELETE`, pagamento, baixa e programacao bancaria.
