import type { Transaction, Flow, SummaryStats, SankeyData } from "@shared/schema";
import { isMerchant } from "./csv-parser";

export function aggregateFlows(
  transactions: Transaction[],
  hideMerchants: boolean = false
): Flow[] {
  const filtered = hideMerchants
    ? transactions.filter(
        (tx) => !isMerchant(tx.from) && !isMerchant(tx.to)
      )
    : transactions;

  const map = new Map<string, number>();

  for (const tx of filtered) {
    if (!tx.from || !tx.to || tx.from === tx.to) continue;
    
    const absAmount = Math.abs(tx.amount);
    if (absAmount === 0) continue;
    
    const key = `${tx.from}→${tx.to}`;
    map.set(key, (map.get(key) || 0) + absAmount);
  }

  return Array.from(map.entries())
    .map(([key, value]) => {
      const [source, target] = key.split("→");
      return { source, target, value };
    })
    .filter((f) => f.value > 0);
}

export function getUniquePeople(
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
  flows: Flow[],
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
    }));

  return { nodes, links };
}

export function calculateSummaryStats(
  transactions: Transaction[],
  hideMerchants: boolean = false
): SummaryStats {
  const filtered = hideMerchants
    ? transactions.filter(
        (tx) => !isMerchant(tx.from) && !isMerchant(tx.to)
      )
    : transactions;

  const people = getUniquePeople(filtered, false);
  
  const sentByPerson = new Map<string, number>();
  const receivedByPerson = new Map<string, number>();

  let totalSent = 0;
  let totalReceived = 0;

  for (const tx of filtered) {
    const absAmount = Math.abs(tx.amount);
    
    if (tx.amount < 0) {
      totalSent += absAmount;
    } else if (tx.amount > 0) {
      totalReceived += absAmount;
    }
    
    sentByPerson.set(
      tx.from,
      (sentByPerson.get(tx.from) || 0) + absAmount
    );
    receivedByPerson.set(
      tx.to,
      (receivedByPerson.get(tx.to) || 0) + absAmount
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
