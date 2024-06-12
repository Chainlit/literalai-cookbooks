type Props = {
  values: (string | number)[];
};

export const List: React.FC<Props> = ({ values }) => {
  return (
    <ul className="list-disc pl-4">
      {values.map((value, index) => (
        <li key={index}>{value}</li>
      ))}
    </ul>
  );
};
