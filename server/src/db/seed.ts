import { closePool, getPool } from './client.js';

const marker = 'DEV_LOCAL_V3_5B';

const run = async (): Promise<void> => {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('begin');

    const empresa = await client.query<{ id: string }>(
      `
      insert into empresas (razao_social, nome_fantasia, cnpj, regime_tributario, status)
      values ($1, $2, $3, $4, 'ativo')
      on conflict (cnpj)
      do update set nome_fantasia = excluded.nome_fantasia, updated_at = now()
      returning id
      `,
      [`ENAC DEV - ${marker}`, `ENAC DEV ${marker}`, '00.000.000/0001-33', `DEV ${marker}`]
    );
    const companyId = empresa.rows[0].id;

    const perfis = ['ADMIN', 'DIRETORIA', 'PLANEJAMENTO', 'COMPRAS', 'FINANCEIRO', 'CAMPO'];
    const perfilIds = new Map<string, string>();

    for (const perfil of perfis) {
      const result = await client.query<{ id: string }>(
        `
        insert into perfis (company_id, nome, descricao, permissoes, escopo_padrao, status)
        values ($1, $2, $3, '[]'::jsonb, 'empresa', 'ativo')
        on conflict (company_id, nome)
        do update set descricao = excluded.descricao, updated_at = now()
        returning id
        `,
        [companyId, perfil, `${perfil} - ${marker}`]
      );
      perfilIds.set(perfil, result.rows[0].id);
    }

    const usuarios: Array<[string, string, string[]]> = [
      ['Leon DEV', 'leon.dev.v35b@enac.local', ['DIRETORIA', 'ADMIN']],
      ['Gustavo DEV', 'gustavo.dev.v35b@enac.local', ['PLANEJAMENTO']],
      ['Matheus DEV', 'matheus.dev.v35b@enac.local', ['COMPRAS', 'FINANCEIRO']],
      ['Kemilly DEV', 'kemilly.dev.v35b@enac.local', ['PLANEJAMENTO', 'CAMPO']],
      ['Davison DEV', 'davison.dev.v35b@enac.local', ['CAMPO', 'PLANEJAMENTO']]
    ];

    for (const [nome, email, perfisUsuario] of usuarios) {
      const principalPerfil = perfisUsuario[0];
      const perfilId = perfilIds.get(principalPerfil);
      const usuario = await client.query<{ id: string }>(
        `
        insert into usuarios (company_id, nome, email, perfil_principal_id, perfil_ids, cargo_funcao, ativo, status)
        values ($1, $2, $3, $4, array[$4]::uuid[], $5, true, 'ativo')
        on conflict (email)
        do update set nome = excluded.nome, perfil_principal_id = excluded.perfil_principal_id, perfil_ids = excluded.perfil_ids, cargo_funcao = excluded.cargo_funcao, updated_at = now()
        returning id
        `,
        [companyId, `${nome} - ${marker}`, email, perfilId, `${perfisUsuario.join(' ')} ${marker}`]
      );

      for (const perfil of perfisUsuario) {
        const vinculoPerfilId = perfilIds.get(perfil);
        if (!vinculoPerfilId) {
          continue;
        }
        await client.query(
          `
          insert into usuarios_perfis (usuario_id, perfil_id, principal, status)
          values ($1, $2, $3, 'ativo')
          on conflict (usuario_id, perfil_id)
          do update set principal = excluded.principal, status = 'ativo', updated_at = now()
          `,
          [usuario.rows[0].id, vinculoPerfilId, perfil === principalPerfil]
        );
      }

      await client.query(
        `
        update usuarios
        set perfil_ids = $1::uuid[], updated_at = now()
        where id = $2
        `,
        [perfisUsuario.map((perfil) => perfilIds.get(perfil)).filter(Boolean), usuario.rows[0].id]
      );
    }

    const cliente = await client.query<{ id: string }>(
      `
      insert into clientes (company_id, nome, cpf_cnpj, email, telefone, responsavel, observacoes, status)
      values ($1, $2, $3, $4, $5, $6, $7, 'ativo')
      on conflict (company_id, cpf_cnpj) where cpf_cnpj is not null
      do update set nome = excluded.nome, observacoes = excluded.observacoes, updated_at = now()
      returning id
      `,
      [companyId, `Cliente DEV ${marker}`, '11.111.111/0001-11', 'cliente.dev@enac.local', '(00) 0000-0000', 'Contato DEV', marker]
    );

    const fornecedor = await client.query<{ id: string }>(
      `
      insert into fornecedores (company_id, nome, cpf_cnpj, email, telefone, contato, pix, dados_bancarios, observacoes, status)
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ativo')
      on conflict (company_id, cpf_cnpj) where cpf_cnpj is not null
      do update set nome = excluded.nome, observacoes = excluded.observacoes, updated_at = now()
      returning id
      `,
      [
        companyId,
        `Fornecedor DEV ${marker}`,
        '22.222.222/0001-22',
        'fornecedor.dev@enac.local',
        '(00) 0000-0000',
        'Contato DEV',
        'fornecedor.dev@enac.local',
        'Banco DEV / Ag. 0001 / Cc. 00001-0',
        marker
      ]
    );

    const centroCustoObra = await client.query<{ id: string }>(
      `
      insert into centros_custo (company_id, codigo, nome, conta_analitica, status)
      values ($1, $2, $3, $4, 'ativo')
      on conflict (company_id, codigo)
      do update set nome = excluded.nome, updated_at = now()
      returning id
      `,
      [companyId, 'DEV-OBRA', `Centro de Custo Obra ${marker}`, 'DEV.OBRA']
    );

    await client.query(
      `
      insert into centros_custo (company_id, codigo, nome, conta_analitica, status)
      values ($1, $2, $3, $4, 'ativo')
      on conflict (company_id, codigo)
      do update set nome = excluded.nome, updated_at = now()
      `,
      [companyId, 'DEV-ADM', `Centro de Custo Administrativo ${marker}`, 'DEV.ADM']
    );

    await client.query(
      `
      insert into obras (company_id, cliente_id, centro_custo_id, codigo, nome, endereco, data_inicio_prevista, data_fim_prevista, status)
      values ($1, $2, $3, $4, $5, $6, current_date, current_date + interval '180 days', 'ativo')
      on conflict (company_id, codigo)
      do update set nome = excluded.nome, cliente_id = excluded.cliente_id, centro_custo_id = excluded.centro_custo_id, updated_at = now()
      `,
      [companyId, cliente.rows[0].id, centroCustoObra.rows[0].id, 'OBRA-DEV-V33A', `Obra DEV ${marker}`, `Endereco DEV ${marker}`]
    );

    await client.query('commit');
    console.info(`Seed ${marker} aplicado com sucesso.`);
    console.info(`Empresa: ${companyId}`);
    console.info(`Fornecedor DEV: ${fornecedor.rows[0].id}`);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
    await closePool();
  }
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
