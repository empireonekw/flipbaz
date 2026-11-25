"use client";

import { useActionState } from "react";
import { submitOrderPaymentAction } from "../actions";
import PaymentProofFields from "@/components/dashboard/PaymentProofFields";
import SubmitButton from "@/components/ui/SubmitButton";
import Alert from "@/components/ui/Alert";

/**
 * Pay (again) for an existing order.
 * @param {{ orderId: string, amount: number, accounts: Object[] }} props
 */
export default function OrderPaymentForm({ orderId, amount, accounts }) {
  const [state, formAction] = useActionState(submitOrderPaymentAction, {});
  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.message && <Alert tone="error">{state.message}</Alert>}
      <input type="hidden" name="orderId" value={orderId} />
      <PaymentProofFields accounts={accounts} amount={amount} errors={state.errors ?? {}} values={state.values ?? {}} />
      <SubmitButton variant="accent" pendingText="Uploading…" disabled={!accounts.length}>
        Submit payment
      </SubmitButton>
    </form>
  );
}
