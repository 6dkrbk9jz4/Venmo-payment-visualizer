import { z } from "zod";

export const transactionSchema = z.object({
  id: z.string(),
  datetime: z.date(),
  type: z.string(),
  status: z.string(),
  note: z.string(),
  from: z.string(),
  to: z.string(),
  amount: z.number(),
  tip: z.number().optional(),
  tax: z.number().optional(),
  fee: z.number().optional(),
  sourceFile: z.string(),
});

export type Transaction = z.infer<typeof transactionSchema>;

export const flowSchema = z.object({
  source: z.string(),
  target: z.string(),
  value: z.number(),
});

export type Flow = z.infer<typeof flowSchema>;

export const appStateSchema = z.object({
  transactions: z.array(transactionSchema),
  flows: z.array(flowSchema),
  people: z.array(z.string()),
});

export type AppState = z.infer<typeof appStateSchema>;

export interface UploadedFile {
  name: string;
  size: number;
  transactionCount: number;
}

export interface SummaryStats {
  totalSent: number;
  totalReceived: number;
  totalTransactions: number;
  uniquePeople: number;
  topPayees: Array<{ name: string; amount: number }>;
  topPayers: Array<{ name: string; amount: number }>;
}

export interface SankeyNode {
  name: string;
  index?: number;
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export interface Settings {
  hideMerchants: boolean;
  darkMode: boolean;
}

export const users = {
  id: "",
  username: "",
  password: "",
};

export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = { id: string; username: string; password: string };
