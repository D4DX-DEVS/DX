"use client";

import { ErrorState } from "@/components/admin/states";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl py-10">
      <ErrorState message="This page could not be loaded. Check the connection and try again." onRetry={reset} />
    </div>
  );
}
