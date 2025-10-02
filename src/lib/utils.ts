import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Token amounts: USDC/USDT use 18 decimals in this deployment
export const DEFAULT_TOKEN_DECIMALS = 18;

export function formatTokenAmount(amount: bigint | number, decimals = DEFAULT_TOKEN_DECIMALS, fractionDigits = 2) {
  const amt = typeof amount === "bigint" ? Number(amount) : amount;
  const divisor = Math.pow(10, decimals);
  const value = amt / divisor;
  return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: fractionDigits });
}

export function parseAddress(value: string): string | null {
  const v = (value || "").trim();
  if (/^0x[a-fA-F0-9]{40}$/.test(v)) return v;
  return null;
}

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

// User-friendly mapping for known contract error names
export const ERROR_MESSAGES: Record<string, string> = {
  NOT_ADMIN: "Only admin can perform this action",
  NOT_INITIATOR: "Only the project creator can do this",
  NOT_PAYEE: "Only the worker can mark work for review",
  NOT_APPROVER: "You are not authorized to approve this milestone",
  ALREADY_FUNDED: "This milestone is already funded",
  NOT_FUNDED: "Please fund the milestone before requesting review",
  NOT_IN_REVIEW: "Milestone must be in review status first",
  APPROVALS_PENDING: "Not all approvers have signed off yet",
  INSUFFICIENT_BALANCE: "You don't have enough tokens in your wallet",
  INSUFFICIENT_ALLOWANCE: "Please approve token spending first",
  INVALID_DEADLINE: "Deadline must be in the future",
  ALREADY_APPROVED: "You have already approved this milestone",
};

export function parseTxErrorToMessage(error: unknown): string {
  const fallback = typeof (error as any)?.message === "string" ? (error as any).message : "Transaction failed";
  try {
    const msg: string = String((error as any)?.shortMessage || (error as any)?.message || fallback);
    const match = msg.match(/error\s+([A-Z_]+)/);
    if (match && match[1] && ERROR_MESSAGES[match[1]]) {
      return ERROR_MESSAGES[match[1]];
    }
    if (/Encoded error signature/i.test(msg)) {
      return "Transaction reverted. Check contract conditions and roles.";
    }
    return fallback;
  } catch {
    return fallback;
  }
}