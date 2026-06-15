import * as React from 'react';
import type { CadastroPayload, CadastroRecord } from '../../services/erpApi';
import type { CadastroField, CadastroResourceConfig } from './types';

type FormMode = 'list' | 'create' | 'edit';

interface CadastroResourcePageProps {
  config: CadastroResourceConfig;
}

const getRecordValue = (record: CadastroRecord, key: string): string => {
  const value = record[key];
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (typeof value === 'number') {
    return value.toLocaleString('pt-BR');
  }

  const text = String(value);
  if (key.indexOf('data_') === 0 && text.length >= 10) {
    return text.slice(0, 10);
  }

  if (key === 'tipo_pessoa') {
    return text === 'fisica' ? 'Física' : 'Jurídica';
  }

  if (key === 'status') {
    return text === 'inativo' ? 'Inativo' : 'Ativo';
  }

  return text;
};

const buildFormFromRecord = (
  record: CadastroRecord,
  fields: CadastroField[],
  initialValues: Record<string, string>
): Record<string, string> => {
  const values: Record<string, string> = { ...initialValues };

  fields.forEach((field) => {
    const value = record[field.name];
    values[field.name] = value === null || value === undefined ? '' : String(value).slice(0, field.type === 'date' ? 10 : undefined);
  });

  return values;
};

const buildPayload = (fields: CadastroField[], values: Record<string, string>): CadastroPayload => {
  const payload: CadastroPayload = {};

  fields.forEach((field) => {
    const rawValue = (values[field.name] || '').trim();
    if (!rawValue) {
      if (field.required) {
        throw new Error(`Preencha o campo ${field.label}.`);
      }
      payload[field.name] = null;
      return;
    }

    payload[field.name] = field.type === 'number' ? Number(rawValue.replace(',', '.')) : rawValue;
  });

  return payload;
};

export function CadastroResourcePage({ config }: CadastroResourcePageProps): JSX.Element {
  const [items, setItems] = React.useState<CadastroRecord[]>([]);
  const [mode, setMode] = React.useState<FormMode>('list');
  const [selected, setSelected] = React.useState<CadastroRecord | null>(null);
  const [formValues, setFormValues] = React.useState<Record<string, string>>(config.initialValues);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');
  const [message, setMessage] = React.useState<string>('');

  const loadItems = React.useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      setItems(await config.list());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setLoading(false);
    }
  }, [config]);

  React.useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const openCreate = (): void => {
    setSelected(null);
    setFormValues(config.initialValues);
    setMode('create');
    setError('');
    setMessage('');
  };

  const openEdit = (record: CadastroRecord): void => {
    setSelected(record);
    setFormValues(buildFormFromRecord(record, config.fields, config.initialValues));
    setMode('edit');
    setError('');
    setMessage('');
  };

  const updateField = (fieldName: string, value: string): void => {
    setFormValues((current) => ({ ...current, [fieldName]: value }));
  };

  const save = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const payload = buildPayload(config.fields, formValues);
      if (mode === 'edit' && selected) {
        await config.update(selected.id, payload);
        setMessage(`${config.singular} atualizado.`);
      } else {
        await config.create(payload);
        setMessage(`${config.singular} criado.`);
      }
      setMode('list');
      await loadItems();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError));
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (record: CadastroRecord): Promise<void> => {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (record.status === 'inativo') {
        await config.reativar(record.id);
        setMessage(`${config.singular} reativado.`);
      } else {
        await config.inativar(record.id);
        setMessage(`${config.singular} inativado.`);
      }
      await loadItems();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : String(statusError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="enac-cadastro-resource" aria-label={config.plural}>
      <div className="enac-cadastro-toolbar">
        <div>
          <h2>{config.plural}</h2>
          <p>{items.length} registro(s) carregado(s)</p>
        </div>
        <button type="button" onClick={openCreate}>Novo</button>
      </div>

      {message && <div className="enac-web-alert enac-web-alert--compact enac-web-alert--success">{message}</div>}
      {error && <div className="enac-web-alert enac-web-alert--compact">{error}</div>}

      {mode !== 'list' && (
        <form className="enac-cadastro-form" onSubmit={save}>
          <div className="enac-cadastro-form-head">
            <h3>{mode === 'edit' ? `Editar ${config.singular}` : `Novo ${config.singular}`}</h3>
            <button type="button" className="enac-cadastro-secondary" onClick={() => setMode('list')}>Cancelar</button>
          </div>
          <div className="enac-cadastro-form-grid">
            {config.fields.map((field) => {
              if (field.type === 'hidden') {
                return <input key={field.name} type="hidden" value={formValues[field.name] || ''} />;
              }

              if (field.type === 'textarea') {
                return (
                  <label key={field.name}>
                    <span>{field.label}{field.required ? ' *' : ''}</span>
                    <textarea value={formValues[field.name] || ''} onChange={(event) => updateField(field.name, event.target.value)} />
                  </label>
                );
              }

              if (field.type === 'select') {
                return (
                  <label key={field.name}>
                    <span>{field.label}{field.required ? ' *' : ''}</span>
                    <select value={formValues[field.name] || ''} onChange={(event) => updateField(field.name, event.target.value)}>
                      <option value="">Selecione</option>
                      {(field.options || []).map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                );
              }

              return (
                <label key={field.name}>
                  <span>{field.label}{field.required ? ' *' : ''}</span>
                  <input
                    type={field.type || 'text'}
                    step={field.step}
                    value={formValues[field.name] || ''}
                    onChange={(event) => updateField(field.name, event.target.value)}
                  />
                </label>
              );
            })}
          </div>
          <div className="enac-cadastro-actions">
            <button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      )}

      {loading && <div className="enac-cadastro-empty">Carregando cadastros.</div>}

      {!loading && items.length === 0 && mode === 'list' && (
        <div className="enac-cadastro-empty">{config.emptyText}</div>
      )}

      {!loading && items.length > 0 && (
        <div className="enac-cadastro-table-wrap">
          <table className="enac-web-table enac-cadastro-table">
            <thead>
              <tr>
                {config.columns.map((column) => <th key={column.key}>{column.label}</th>)}
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((record) => (
                <tr key={record.id}>
                  {config.columns.map((column) => (
                    <td key={column.key}>{column.format ? column.format(record) : getRecordValue(record, column.key)}</td>
                  ))}
                  <td>
                    <div className="enac-cadastro-row-actions">
                      <button type="button" onClick={() => openEdit(record)}>Editar</button>
                      <button type="button" onClick={() => void changeStatus(record)}>
                        {record.status === 'inativo' ? 'Reativar' : 'Inativar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
