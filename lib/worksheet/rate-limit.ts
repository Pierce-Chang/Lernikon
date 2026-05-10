import { countWorksheetsLast24h } from "@/lib/db/queries";
import type { SubscriptionStatus, UserRow } from "@/lib/db/types";

export const FREE_DAILY_LIMIT = 3;

const PAID_STATUSES: ReadonlySet<SubscriptionStatus> = new Set([
  "active",
  "trialing",
]);

export const isPaid = (status: SubscriptionStatus): boolean =>
  PAID_STATUSES.has(status);

/**
 * True for paying customers AND admins (founders / staff).
 * Both bypass the free-tier daily cap.
 */
export const hasUnlimited = (user: Pick<UserRow, "subscription_status" | "is_admin">) =>
  user.is_admin || isPaid(user.subscription_status);

export interface QuotaSnapshot {
  isPaid: boolean;
  used: number;
  remaining: number;
  limit: number;
}

export const getQuota = async (
  userId: string,
  user: Pick<UserRow, "subscription_status" | "is_admin"> | null,
): Promise<QuotaSnapshot> => {
  if (user && hasUnlimited(user)) {
    return { isPaid: true, used: 0, remaining: Infinity, limit: Infinity };
  }
  const used = await countWorksheetsLast24h(userId);
  return {
    isPaid: false,
    used,
    remaining: Math.max(0, FREE_DAILY_LIMIT - used),
    limit: FREE_DAILY_LIMIT,
  };
};
