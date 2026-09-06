import type { Metadata } from "next";
import PickupRequestForm from "@/components/PickupRequestForm";

export const metadata: Metadata = {
  title: "Request a Pickup",
  description:
    "Raise a cargo pickup request with Fetcher Cargo — no account needed. Verify by email and our team schedules the collection.",
};

export default function PickupPage() {
  return (
    <main className="flex-1 px-4 py-8 sm:py-14">
      <PickupRequestForm />
    </main>
  );
}
