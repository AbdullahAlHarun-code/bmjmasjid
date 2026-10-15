import type { PaymentProvider, PaymentProviderId } from "./types";

/**
 * Resolves the active payment provider.
 * SSLCOMMERZ is planned first; additional gateways can register here later.
 *
 * Intentionally unimplemented in Step 1 — no credentials, SDK, or HTTP calls.
 */
export function getPaymentProvider(
  providerId: PaymentProviderId = "sslcommerz",
): PaymentProvider {
  void providerId;
  throw new Error(
    "Payment providers are not configured yet. See docs/payments-architecture.md.",
  );
}
