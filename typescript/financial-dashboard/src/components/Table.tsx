import {
  Table as BaseTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

type Props = {
  columns: { name: string; label: string }[];
  rows: { [key: string]: string | number }[];
};

export const Table: React.FC<Props> = ({ columns, rows }) => {
  return (
    <BaseTable className="border">
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.name}>{column.label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={index}>
            {columns.map((column) => (
              <TableCell key={column.name}>{row[column.name]}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </BaseTable>
  );
};
