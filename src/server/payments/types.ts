/**
 * Server-only payment domain types.
 * Browser redirects must never mark a donation as paid.
 */

export type DonationState = "pledged" | "pending" | "verified";

export type Money = {
  amountMinor: number;
  currency: "BDT";
};

export type PaymentInitiationRequest = {
  donationId: string;
  amount: Money;
  customer: {
    name?: string;
    email?: string;
    phone?: string;
  };
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
};

export type PaymentInitiationResult = {
  provider: PaymentProviderId;
  redirectUrl: string;
  providerReference: string;
};

export type PaymentNotification = {
  provider: PaymentProviderId;
  providerReference: string;
  donationId: string;
  reportedAmount: Money;
  rawPayload: unknown;
  receivedAt: string;
};

export type PaymentValidationResult =
  | {
      ok: true;
      donationId: string;
      amount: Money;
      providerReference: string;
      /** True when this notification was already processed. */
      duplicate: boolean;
    }
  | {
      ok: false;
      reason:
        | "signature_invalid"
        | "amount_mismatch"
        | "currency_mismatch"
        | "unknown_donation"
        | "provider_error";
    };

export type PaymentProviderId = "sslcommerz" | (string & {});

/**
 * Provider boundary — website content and donation records depend on this
 * interface, not on a specific gateway SDK.
 */
export interface PaymentProvider {
  readonly id: PaymentProviderId;
  initiatePayment(
    request: PaymentInitiationRequest,
  ): Promise<PaymentInitiationResult>;
  /**
   * Validate IPN/webhook (or server-side query) before any state transition
   * to `verified`. Must be idempotent under duplicate notifications.
   */
  validateNotification(
    notification: PaymentNotification,
  ): Promise<PaymentValidationResult>;
}
