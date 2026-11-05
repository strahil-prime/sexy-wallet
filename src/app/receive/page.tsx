import type { Metadata } from "next";
import { Suspense } from "react";
import { ReceiveView } from "@/components/receive/receive-view";

export const metadata: Metadata = { title: "Receive money · Neville" };

export default function ReceivePage() {
  return (
    <Suspense>
      <ReceiveView />
    </Suspense>
  );
}
