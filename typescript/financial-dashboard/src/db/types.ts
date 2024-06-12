import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type Order = {
    id: string;
    createdAt: Generated<string>;
    userId: string;
};
export type OrderEntry = {
    orderId: string;
    productId: string;
    quantity: number;
};
export type Product = {
    id: string;
    name: string;
    price: number;
};
export type User = {
    id: string;
    email: string;
    name: string;
    createdAt: Generated<string>;
};
export type DB = {
    Order: Order;
    OrderEntry: OrderEntry;
    Product: Product;
    User: User;
};
