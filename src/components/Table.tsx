type TableColumn<T> = {
  key: keyof T
  label: string
  render?: (row: T) => React.ReactNode
}

type TableProps<T extends Record<string, unknown>> = {
  columns: TableColumn<T>[]
  rows: T[]
}

export default function Table<T extends Record<string, unknown>>({ columns, rows }: TableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-slate-500">
                  No hay registros disponibles.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={index} className={`hover:bg-slate-50 ${index % 2 ? 'bg-slate-50/50' : ''}`}>
                  {columns.map((column) => (
                    <td key={String(column.key)} className="px-4 py-3 text-sm text-slate-700">
                      {column.render ? column.render(row) : String(row[column.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
