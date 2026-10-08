"use client";

import { useCallback, useState } from "react";
import { Modal } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";

type ConfirmOptions = { title: string; message?: React.ReactNode; confirmLabel?: string; danger?: boolean };

/**
 * Conferma con promessa: `if (await confirm({ title: "Eliminare?" })) ...`
 * Restituisce [confirm, dialog] — il dialog va renderizzato nella pagina.
 */
export function useConfirm(): [(opts: ConfirmOptions) => Promise<boolean>, React.ReactNode] {
  const [state, setState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);

  const confirm = useCallback(
    (opts: ConfirmOptions) => new Promise<boolean>((resolve) => setState({ ...opts, resolve })),
    []
  );

  const close = (value: boolean) => {
    state?.resolve(value);
    setState(null);
  };

  const dialog = (
    <Modal open={!!state} onClose={() => close(false)} title={state?.title}>
      {state?.message && <div className="text-[15px] text-ink-soft">{state.message}</div>}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={() => close(false)}>
          Annulla
        </Button>
        <Button variant={state?.danger ? "danger" : "primary"} onClick={() => close(true)}>
          {state?.confirmLabel || "Conferma"}
        </Button>
      </div>
    </Modal>
  );

  return [confirm, dialog];
}
