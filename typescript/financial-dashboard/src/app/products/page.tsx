import { db } from "@/db";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ProductListPage() {
  const products = await db
    .selectFrom("Product")
    .leftJoin("OrderEntry", "Product.id", "OrderEntry.productId")
    .groupBy("Product.id")
    .select((eb) => [
      "Product.id",
      "Product.name",
      "Product.price",
      eb.fn.sum<number>("OrderEntry.quantity").as("totalSold"),
    ])
    .execute();

  return (
    <main className="space-y-3 bg-muted/40 p-4 md:p-10">
      <h2 className="text-2xl">Products</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Sold</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>{product.name}</TableCell>
              <TableCell className="text-right tabular-nums">
                {product.price}$
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {product.totalSold}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </main>
  );
}
