# Controle de Versão V2.3

## Situação verificada

- `git` não está disponível no PATH.
- `where.exe git` não localizou uma instalação.
- Caminhos comuns de instalação do Git no Windows foram verificados sem resultado.
- O diretório `.git` não existe em `C:\Users\leon\OneDrive - enac.com.br\Documentos\Sistema ENAC`.

## Consequência

Não há histórico Git local disponível para identificar o commit exato correspondente à V2.2 homologada. Portanto, não é seguro criar retroativamente a tag `v2.2-interface-homologada` sobre o estado atual.

## Medida compensatória

Foi criada uma cópia de segurança controlada do protótipo V2.2 homologado em:

`backups/v2.2-interface-homologada/src/prototype/`

Arquivos preservados:

- `index.html`
- `styles.css`
- `app.js`

## Próximo passo recomendado

Quando Git estiver disponível, inicializar ou conectar o repositório correto, identificar o histórico remoto se existir, e só então criar:

- tag `v2.2-interface-homologada` no commit correto da V2.2;
- branch `dev/v2.3-sharepoint-integracao` para continuidade da V2.3.
