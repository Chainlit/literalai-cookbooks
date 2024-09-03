import React from "react";

import { Dashboard } from "./(dashboard)/Dashboard";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export default function Home() {
  return <Dashboard />;
}
