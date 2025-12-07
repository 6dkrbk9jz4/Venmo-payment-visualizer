import type { Transaction, Flow, SummaryStats, SankeyData } from "@shared/schema";
import { isMerchant } from "./csv-parser";

export interface FlowWithSentiment extends Flow {
  sentiment: "positive" | "negative";
}

export function aggregateFlows(
  transactions: Transaction[],
  hideMerchants: boolean = false,
  aliasMap?: Map<string, string>
): FlowWithSentiment[] {
  const filtered = hideMerchants
    ? transactions.filter(
        (tx) => !isMerchant(tx.from) && !isMerchant(tx.to)
      )
    : transactions;

  const flowMap = new Map<string, { value: number; positiveSum: number; negativeSum: number }>();

  for (const tx of filtered) {
    const from = aliasMap?.get(tx.from) || tx.from;
    const to = aliasMap?.get(tx.to) || tx.to;
    
    if (!from || !to || from === to) continue;
    
    const absAmount = Math.abs(tx.amount);
    if (absAmount === 0) continue;
    
    const key = `${from}→${to}`;
    const existing = flowMap.get(key) || { value: 0, positiveSum: 0, negativeSum: 0 };
    existing.value += absAmount;
    
    if (tx.amount > 0) {
      existing.positiveSum += absAmount;
    } else {
      existing.negativeSum += absAmount;
    }
    
    flowMap.set(key, existing);
  }

  return Array.from(flowMap.entries())
    .map(([key, data]) => {
      const [source, target] = key.split("→");
      const sentiment: "positive" | "negative" = data.positiveSum >= data.negativeSum ? "positive" : "negative";
      return { source, target, value: data.value, sentiment };
    })
    .filter((f) => f.value > 0);
}

export function getUniquePeople(
  transactions: Transaction[],
  hideMerchants: boolean = false,
  aliasMap?: Map<string, string>
): string[] {
  const filtered = hideMerchants
    ? transactions.filter(
        (tx) => !isMerchant(tx.from) && !isMerchant(tx.to)
      )
    : transactions;

  const people = new Set<string>();
  for (const tx of filtered) {
    const from = aliasMap?.get(tx.from) || tx.from;
    const to = aliasMap?.get(tx.to) || tx.to;
    
    if (from && from !== "Unknown") people.add(from);
    if (to && to !== "Unknown") people.add(to);
  }
  return Array.from(people).sort();
}

export function getOriginalPeople(
  transactions: Transaction[],
  hideMerchants: boolean = false
): string[] {
  const filtered = hideMerchants
    ? transactions.filter(
        (tx) => !isMerchant(tx.from) && !isMerchant(tx.to)
      )
    : transactions;

  const people = new Set<string>();
  for (const tx of filtered) {
    if (tx.from && tx.from !== "Unknown") people.add(tx.from);
    if (tx.to && tx.to !== "Unknown") people.add(tx.to);
  }
  return Array.from(people).sort();
}

export function buildSankeyData(
  flows: FlowWithSentiment[],
  people: string[]
): SankeyData {
  if (flows.length === 0 || people.length === 0) {
    return { nodes: [], links: [] };
  }

  const nodeMap = new Map<string, number>();
  people.forEach((person, index) => {
    nodeMap.set(person, index);
  });

  const nodes = people.map((name) => ({ name }));

  const links = flows
    .filter(
      (f) => 
        nodeMap.has(f.source) && 
        nodeMap.has(f.target) && 
        f.source !== f.target &&
        f.value > 0
    )
    .map((f) => ({
      source: nodeMap.get(f.source)!,
      target: nodeMap.get(f.target)!,
      value: f.value,
      sentiment: f.sentiment,
    }));

  return { nodes, links };
}

export function calculateSummaryStats(
  transactions: Transaction[],
  hideMerchants: boolean = false,
  aliasMap?: Map<string, string>
): SummaryStats {
  const filtered = hideMerchants
    ? transactions.filter(
        (tx) => !isMerchant(tx.from) && !isMerchant(tx.to)
      )
    : transactions;

  const people = getUniquePeople(filtered, false, aliasMap);
  
  const sentByPerson = new Map<string, number>();
  const receivedByPerson = new Map<string, number>();

  let totalSent = 0;
  let totalReceived = 0;

  for (const tx of filtered) {
    const from = aliasMap?.get(tx.from) || tx.from;
    const to = aliasMap?.get(tx.to) || tx.to;
    const absAmount = Math.abs(tx.amount);
    
    if (tx.amount < 0) {
      totalSent += absAmount;
    } else if (tx.amount > 0) {
      totalReceived += absAmount;
    }
    
    sentByPerson.set(
      from,
      (sentByPerson.get(from) || 0) + absAmount
    );
    receivedByPerson.set(
      to,
      (receivedByPerson.get(to) || 0) + absAmount
    );
  }

  if (totalSent === 0 && totalReceived === 0 && filtered.length > 0) {
    for (const tx of filtered) {
      const absAmount = Math.abs(tx.amount);
      totalSent += absAmount;
    }
    totalReceived = totalSent;
  }

  const topPayees = Array.from(receivedByPerson.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  const topPayers = Array.from(sentByPerson.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  return {
    totalSent,
    totalReceived,
    totalTransactions: filtered.length,
    uniquePeople: people.length,
    topPayees,
    topPayers,
  };
}
