import type { Metadata } from "next";
import { Suspense } from "react";
import { SendFlow } from "@/components/send/send-flow";

export const metadata: Metadata = { title: "Send money · Sexy Wallet" };

export default function SendPage() {
  return (
    <Suspense>
      <SendFlow />
    </Suspense>
  );
}
