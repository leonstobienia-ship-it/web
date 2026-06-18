import * as React from 'react';

export interface EnacDataColumn<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (row: T) => React.ReactNode;
}

interface EnacDataTableProps<T> {
  rows: T[];
  columns: Array<EnacDataColumn<T>>;
  getRowKey: (row: T, index: number) => React.Key;
  onRowClick?: (row: T) => void;
  selectedKey?: React.Key;
  emptyState?: React.ReactNode;
  className?: string;
}

export function EnacDataTable<T extends Record<string, unknown>>({
  rows,
  columns,
  getRowKey,
  onRowClick,
  selectedKey,
  emptyState,
  className
}: EnacDataTableProps<T>): JSX.Element {
  if (rows.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className={`enac-foundation-table-wrap${className ? ` ${className}` : ''}`}>
      <table className="enac-foundation-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)} style={{ width: column.width, textAlign: column.align || 'left' }}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const rowKey = getRowKey(row, index);
            return (
              <tr
                key={rowKey}
                className={selectedKey === rowKey ? 'is-selected' : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((column) => (
                  <td key={String(column.key)} style={{ textAlign: column.align || 'left' }}>
                    {column.render ? column.render(row) : String(row[column.key as keyof T] ?? '')}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
