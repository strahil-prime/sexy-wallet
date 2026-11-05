import type { Metadata } from "next";
import { CardView } from "@/components/card/card-view";

export const metadata: Metadata = { title: "Cards · Neville" };

export default function CardPage() {
  return <CardView />;
}
