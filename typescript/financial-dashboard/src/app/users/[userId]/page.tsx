import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/db";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PageProps = {
  params: { userId: string };
};

export default async function UserPage({ params }: PageProps) {
  const user = await db
    .selectFrom("User")
    .where("id", "=", params.userId)
    .selectAll()
    .executeTakeFirst();

  if (!user) notFound();

  const orderEntries = await db
    .selectFrom("OrderEntry")
    .innerJoin("Order", "OrderEntry.orderId", "Order.id")
    .where("Order.userId", "=", user.id)
    .innerJoin("Product", "OrderEntry.productId", "Product.id")
    .select((eb) => [
      eb.ref("Order.id").as("orderId"),
      "Order.createdAt",
      eb.ref("Product.id").as("productId"),
      eb.ref("Product.name").as("productName"),
      eb.ref("Product.price").as("productPrice"),
      "OrderEntry.quantity",
    ])
    .execute();

  type OrderEntry = {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  };

  type Order = {
    id: string;
    createdAt: string;
    entries: OrderEntry[];
    totalPrice: number;
  };

  const orders: Order[] = [];
  for (const orderEntry of orderEntries) {
    let order = orders.find((order) => order.id === orderEntry.orderId);
    if (!order) {
      order = {
        id: orderEntry.orderId,
        createdAt: orderEntry.createdAt,
        entries: [],
        totalPrice: 0,
      };
      orders.push(order);
    }
    order.entries.push({
      price: orderEntry.productPrice,
      productId: orderEntry.productId,
      productName: orderEntry.productName,
      quantity: orderEntry.quantity,
    });
    order.totalPrice += orderEntry.productPrice * orderEntry.quantity;
  }

  return (
    <main className="space-y-3 bg-muted/40 p-4 md:p-10">
      <h2 className="text-2xl">Users - {user.name}</h2>

      <section>
        <h3 className="mb-1 text-xl">Details</h3>
        <Card
          is="dl"
          className="grid grid-cols-[max-content_auto] gap-x-3 gap-y-2 p-6 [&>dt]:font-medium"
        >
          <dt>ID</dt>
          <dd>{user.id}</dd>

          <dt>Name</dt>
          <dd>{user.name}</dd>

          <dt>Email</dt>
          <dd>{user.email}</dd>

          <dt>Joined on</dt>
          <dd>{new Date(user.createdAt).toLocaleDateString()}</dd>
        </Card>
      </section>

      <section>
        <h3 className="-mb-4 text-xl">Orders</h3>

        {orders.map((order) => (
          <article className="mt-6">
            <p className="mb-1 text-sm">
              On the {new Date(order.createdAt).toLocaleDateString()}
            </p>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.entries.map((entry) => (
                    <TableRow key={entry.productId}>
                      <TableCell>
                        <span className="inline-block w-72 truncate">
                          {entry.productName}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {entry.price}$
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {entry.quantity}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {entry.price * entry.quantity}$
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3}></TableCell>
                    <TableCell className="text-right tabular-nums">
                      <strong>{order.totalPrice}$</strong>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </Card>
          </article>
        ))}
      </section>
    </main>
  );
}
