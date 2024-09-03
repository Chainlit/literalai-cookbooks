type Props = {
  values: (string | number)[];
  onContextChange?: (context: any) => void;
};

export const DataList: React.FC<Props> = ({ values }) => {
  return (
    <ul className="list-disc pl-4">
      {values.map((value, index) => (
        <li key={index}>{value}</li>
      ))}
    </ul>
  );
};
