import type { Metadata } from "next";
import { Suspense } from "react";
import { SendFlow } from "@/components/send/send-flow";

export const metadata: Metadata = { title: "Send money · Nobby" };

export default function SendPage() {
  return (
    <Suspense>
      <SendFlow />
    </Suspense>
  );
}
