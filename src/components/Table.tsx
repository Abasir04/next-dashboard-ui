const Table = ({
  columns,
  renderRow,
  data,
  emptyMessage = "No data available",
}: {
  columns: { header: string; accessor: string; className?: string }[];
  renderRow: (item: any) => React.ReactNode;
  data: any[];
  emptyMessage?: string;
}) => {
  return (
    <table className="w-full mt-4">
      <thead>
        <tr className="text-center text-gray-500 text-sm mb-6">
          {columns.map((col) => (
            <th key={col.accessor} className={col.className}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length > 0 ? (
          data.map((item) => renderRow(item))
        ) : (
          <tr>
            <td
              colSpan={columns.length}
              className="text-center py-8 text-gray-500"
            >
              {emptyMessage}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default Table;
