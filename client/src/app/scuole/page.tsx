import { Suspense } from "react";
import { ScuolePage } from "@/components/scuole/ScuolePage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ScuolePage />
    </Suspense>
  );
}
