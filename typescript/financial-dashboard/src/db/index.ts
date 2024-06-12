import { DB } from "./types";

import { resolve } from "path";
import Database from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

export const rawDatabase = new Database(resolve("./prisma/dev.db"));

const dialect = new SqliteDialect({
  database: rawDatabase,
});

export const db = new Kysely<DB>({
  dialect,
});
