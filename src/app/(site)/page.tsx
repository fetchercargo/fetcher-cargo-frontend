import type { Metadata } from "next";
import TrackingSearch from "@/components/TrackingSearch";

export const metadata: Metadata = {
  title: "Track Your Shipment",
  description:
    "Track your cargo shipment with Fetcher Cargo. Enter your AirWay bill number to see real-time tracking updates.",
};

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center px-4 py-8 sm:py-16 md:py-24">
      <TrackingSearch />
    </main>
  );
}
