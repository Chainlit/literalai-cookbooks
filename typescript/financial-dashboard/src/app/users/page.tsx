import Link from "next/link";

import { db } from "@/db";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function UserListPage() {
  const users = await db
    .selectFrom("User")
    .leftJoin("Order", "Order.userId", "User.id")
    .groupBy("User.id")
    .select((eb) => [
      "User.id",
      "User.name",
      "User.email",
      eb.fn.count<number>("Order.id").as("orderCount"),
    ])
    .execute();

  return (
    <>
      <h2 className="text-2xl">Users</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Orders</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <Link href={`/users/${user.id}`}>{user.name}</Link>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell className="text-right tabular-nums">
                {user.orderCount}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
