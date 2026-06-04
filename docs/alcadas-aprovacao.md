# Alçadas de Aprovação

As regras abaixo são beta e provisórias. Devem ser validadas com a diretoria antes da implantação.

## Parâmetros demonstrativos iniciais

| Processo | Faixa | Responsável |
| --- | --- | --- |
| Compra | R$ 0,00 até R$ 20.000,00 | Gustavo |
| Compra | Acima de R$ 20.000,00 | Leon |
| Liberação Bancária | Qualquer valor | Leon |

Os valores acima são dados simulados editáveis no módulo Administração / Configurações. Não devem existir como alçadas operacionais fixas no código, e os aprovadores devem ser selecionados a partir dos usuários ativos cadastrados.

## Diretriz técnica

As alçadas devem ser parâmetros persistidos no SharePoint pela V2.3. A aplicação consulta a configuração vigente no momento da submissão e grava um snapshot da regra aplicada no processo.

## Campos mínimos por regra

- Processo: compra, medição, pagamento, liberação bancária ou outro.
- `RegraInternaId` obrigatório, único e indexado.
- Tipo de solicitação: todos, material, serviço, locação ou equipamento.
- Obra: todas ou obra específica.
- Valor inicial e valor final, com opção ilimitada.
- Aprovador principal por ID de usuário ativo.
- Aprovação adicional e aprovador adicional opcional por ID de usuário ativo.
- Vigência inicial e final.
- Regra ativa.
- Observações.
- Auditoria por `Created`, `Modified`, `Author` e `Editor` nativos do SharePoint.

## Substituição

Não usar `AprovadorSubstituto` diretamente na alçada nesta rodada. A substituição é resolvida no cadastro do usuário a partir de `SubstitutoTemporario`, `InicioSubstituicao` e `FimSubstituicao`.

## Regra crítica

Cada aprovação deve guardar snapshot da regra aplicada: regra, processo, faixa vigente, valor submetido, aprovador base, aprovador efetivo, substituição aplicada, motivo de resolução, exceção aplicada e data/hora da submissão.

Alterações posteriores geram histórico administrativo e não mudam processos já enviados para aprovação, aprovados ou concluídos.

## Validações

- Bloquear valor final inferior ao valor inicial.
- Bloquear aprovador inativo.
- Alertar ou bloquear faixas sobrepostas no mesmo processo, tipo e obra.
- Bloquear submissão sem regra aplicável.
- Bloquear Matheus como aprovador de compra operacional executada por ele.
- Bloquear regra sem vigência válida.
- Aplicar regra específica de obra antes da regra geral equivalente.
