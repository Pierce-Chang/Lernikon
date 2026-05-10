import { countWorksheetsLast24h } from "@/lib/db/queries";
import type { SubscriptionStatus } from "@/lib/db/types";

export const FREE_DAILY_LIMIT = 3;

const PAID_STATUSES: ReadonlySet<SubscriptionStatus> = new Set([
  "active",
  "trialing",
]);

export const isPaid = (status: SubscriptionStatus): boolean =>
  PAID_STATUSES.has(status);

export interface QuotaSnapshot {
  isPaid: boolean;
  used: number;
  remaining: number;
  limit: number;
}

export const getQuota = async (
  userId: string,
  status: SubscriptionStatus,
): Promise<QuotaSnapshot> => {
  const paid = isPaid(status);
  if (paid) {
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
