"use server";

import { db } from "@/db";
import { sql } from "kysely";

export const getRecentSales = async () => {
  const result = await db
    .selectFrom("Order")
    .innerJoin("User", "Order.userId", "User.id")
    .innerJoin("OrderEntry", "Order.id", "OrderEntry.orderId")
    .innerJoin("Product", "Product.id", "OrderEntry.productId")
    .groupBy("Order.id")
    .select((eb) => [
      "Order.createdAt",
      eb.ref("User.name").as("userName"),
      eb.ref("User.email").as("userEmail"),
      sql<number>`SUM("Product"."price" * "OrderEntry"."quantity")`.as(
        "totalAmount"
      ),
    ])
    .orderBy("Order.createdAt", "desc")
    .limit(5)
    .execute();

  return result;
};

export const getMonthlyRevenues = async () => {
  const result = await db
    .selectFrom("Order")
    .innerJoin("OrderEntry", "Order.id", "OrderEntry.orderId")
    .innerJoin("Product", "Product.id", "OrderEntry.productId")
    .select((eb) => [
      sql<string>`strftime('%Y-%m-01', "Order"."createdAt")`.as(
        "month"
      ),
      sql<number>`SUM("Product"."price" * "OrderEntry"."quantity")`.as(
        "revenue"
      ),
    ])
    .groupBy("month")
    .orderBy("month", "desc")
    .limit(12)
    .execute();

  return result.reverse();
};
