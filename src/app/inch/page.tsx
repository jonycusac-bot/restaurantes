import type { Metadata } from "next";
import InchMenu from "./InchMenu";

export const metadata: Metadata = {
  title: "INCH — Un viaje por Asia · Propuesta de carta",
  description: "Propuesta independiente de carta digital para INCH. Sushi, ramen y sabores del sudeste asiático.",
  robots: { index: false, follow: false },
};

export default function InchPage() {
  return <InchMenu />;
}
