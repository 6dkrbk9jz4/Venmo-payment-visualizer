import type { Transaction, UploadedFile } from "@shared/schema";
import type { AliasMapping } from "./alias-manager";

const SESSION_KEY = "venmo-visualizer-session";

export interface SessionData {
  version: number;
  savedAt: string;
  transactions: Transaction[];
  uploadedFiles: UploadedFile[];
  aliases: AliasMapping[];
  hideMerchants: boolean;
  startDate: string | null;
  endDate: string | null;
}

const CURRENT_VERSION = 1;

export function saveSession(data: {
  transactions: Transaction[];
  uploadedFiles: UploadedFile[];
  aliases: AliasMapping[];
  hideMerchants: boolean;
  startDate: Date | null;
  endDate: Date | null;
}): boolean {
  try {
    const session: SessionData = {
      version: CURRENT_VERSION,
      savedAt: new Date().toISOString(),
      transactions: data.transactions.map((tx) => ({
        ...tx,
        datetime: new Date(tx.datetime).toISOString() as any,
      })),
      uploadedFiles: data.uploadedFiles,
      aliases: data.aliases,
      hideMerchants: data.hideMerchants,
      startDate: data.startDate?.toISOString() || null,
      endDate: data.endDate?.toISOString() || null,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return true;
  } catch (error) {
    console.error("Failed to save session:", error);
    return false;
  }
}

export function loadSession(): {
  transactions: Transaction[];
  uploadedFiles: UploadedFile[];
  aliases: AliasMapping[];
  hideMerchants: boolean;
  startDate: Date | null;
  endDate: Date | null;
} | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const session: SessionData = JSON.parse(raw);

    if (session.version !== CURRENT_VERSION) {
      clearSession();
      return null;
    }

    return {
      transactions: session.transactions.map((tx) => ({
        ...tx,
        datetime: new Date(tx.datetime),
      })),
      uploadedFiles: session.uploadedFiles,
      aliases: session.aliases,
      hideMerchants: session.hideMerchants,
      startDate: session.startDate ? new Date(session.startDate) : null,
      endDate: session.endDate ? new Date(session.endDate) : null,
    };
  } catch (error) {
    console.error("Failed to load session:", error);
    return null;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error("Failed to clear session:", error);
  }
}

export function hasSession(): boolean {
  try {
    return localStorage.getItem(SESSION_KEY) !== null;
  } catch {
    return false;
  }
}

export function getSessionInfo(): { savedAt: Date; transactionCount: number } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const session: SessionData = JSON.parse(raw);
    return {
      savedAt: new Date(session.savedAt),
      transactionCount: session.transactions.length,
    };
  } catch {
    return null;
  }
}
