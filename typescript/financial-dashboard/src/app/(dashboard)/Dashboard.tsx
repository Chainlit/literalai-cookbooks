import { MonthlyRevenues } from "./MonthlyRevenues";
import { RecentSales } from "./RecentSales";

export const Dashboard: React.FC = () => {
  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
      <MonthlyRevenues className="xl:col-span-2" />
      <RecentSales />
    </div>
  );
};
