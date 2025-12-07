import Papa from "papaparse";
import type { Transaction } from "@shared/schema";

const KNOWN_MERCHANTS = [
  "doordash",
  "uber",
  "lyft",
  "grubhub",
  "instacart",
  "amazon",
  "venmo",
  "paypal",
  "netflix",
  "spotify",
  "apple",
  "google",
  "microsoft",
  "walmart",
  "target",
  "costco",
  "starbucks",
  "mcdonalds",
  "chipotle",
  "panera",
  "dunkin",
  "dominos",
  "pizza hut",
  "taco bell",
  "wendys",
  "burger king",
  "subway",
  "chick-fil-a",
  "cvs",
  "walgreens",
  "rite aid",
  "7-eleven",
  "shell",
  "chevron",
  "exxon",
  "bp",
  "airbnb",
  "vrbo",
  "hotels.com",
  "expedia",
  "booking.com",
  "delta",
  "united",
  "american airlines",
  "southwest",
  "jetblue",
  "spirit",
  "frontier",
  "att",
  "verizon",
  "t-mobile",
  "sprint",
  "comcast",
  "xfinity",
  "spectrum",
  "cox",
  "hulu",
  "disney+",
  "hbo",
  "paramount+",
  "peacock",
  "youtube",
  "twitch",
  "patreon",
  "cash app",
  "zelle",
];

export function isMerchant(name: string): boolean {
  if (!name) return false;
  const lowerName = name.toLowerCase();
  return KNOWN_MERCHANTS.some(
    (merchant) =>
      lowerName.includes(merchant) || 
      (lowerName.length > 4 && merchant.includes(lowerName.slice(0, 5)))
  );
}

function parseSignedAmount(value: string): number {
  if (!value) return 0;
  const trimmed = value.trim();
  const cleaned = trimmed.replace(/[$,\s]/g, "");
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return num;
}

function parseDate(value: string): Date {
  if (!value) return new Date();
  const trimmed = value.trim();
  const parsed = new Date(trimmed);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function normalizeHeader(header: string): string {
  return (header || "").toLowerCase().trim().replace(/[^a-z0-9]/g, "");
}

const VENMO_HEADER_MAPPINGS: Record<string, string[]> = {
  id: ["id", "transactionid"],
  datetime: ["datetime", "date", "timestamp", "createdat"],
  type: ["type", "transactiontype"],
  status: ["status"],
  note: ["note", "description", "memo"],
  from: ["from", "sender", "fromuser"],
  to: ["to", "recipient", "touser"],
  amount: ["amounttotal", "amount", "total", "amountusd"],
  tip: ["tip", "tipamount"],
  tax: ["tax", "taxamount"],
  fee: ["fee", "feeamount"],
};

function findColumnIndex(headers: string[], fieldName: string): number {
  const normalizedHeaders = headers.map(normalizeHeader);
  const possibleNames = VENMO_HEADER_MAPPINGS[fieldName] || [fieldName];
  
  for (const name of possibleNames) {
    const normalizedName = normalizeHeader(name);
    const exactIdx = normalizedHeaders.findIndex((h) => h === normalizedName);
    if (exactIdx !== -1) return exactIdx;
  }
  
  for (const name of possibleNames) {
    const normalizedName = normalizeHeader(name);
    const partialIdx = normalizedHeaders.findIndex((h) => h.includes(normalizedName));
    if (partialIdx !== -1) return partialIdx;
  }
  
  return -1;
}

function isHeaderRow(row: string[]): boolean {
  if (!row || row.length < 3) return false;
  
  const normalizedRow = row.map(normalizeHeader);
  
  const hasFrom = normalizedRow.some((c) => c === "from" || c.includes("from"));
  const hasTo = normalizedRow.some((c) => c === "to" || c.includes("to"));
  const hasAmount = normalizedRow.some(
    (c) => c.includes("amount") || c === "total"
  );
  
  return hasFrom && hasTo && hasAmount;
}

export interface ParseResult {
  transactions: Transaction[];
  errors: string[];
}

export function parseVenmoCSV(
  csvText: string,
  sourceFileName: string
): ParseResult {
  const transactions: Transaction[] = [];
  const errors: string[] = [];

  const result = Papa.parse(csvText, {
    skipEmptyLines: true,
  });

  if (result.errors.length > 0) {
    errors.push(
      ...result.errors.slice(0, 5).map((e) => `Row ${e.row}: ${e.message}`)
    );
  }

  const rows = result.data as string[][];
  
  if (rows.length === 0) {
    errors.push("CSV file is empty");
    return { transactions, errors };
  }

  let headerRowIndex = -1;
  let headers: string[] = [];
  
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i];
    if (!row) continue;
    
    if (isHeaderRow(row)) {
      headerRowIndex = i;
      headers = row.map((h) => (h || "").trim());
      break;
    }
  }

  if (headerRowIndex === -1) {
    if (rows.length > 0 && rows[0].length >= 3) {
      headerRowIndex = 0;
      headers = rows[0].map((h) => (h || "").trim());
      errors.push("Using first row as headers - format may not be standard Venmo");
    } else {
      errors.push("Could not find header row with From, To, and Amount columns. Please ensure your CSV has these columns.");
      return { transactions, errors };
    }
  }

  const fromIdx = findColumnIndex(headers, "from");
  const toIdx = findColumnIndex(headers, "to");
  const amountIdx = findColumnIndex(headers, "amount");
  const dateIdx = findColumnIndex(headers, "datetime");
  const typeIdx = findColumnIndex(headers, "type");
  const statusIdx = findColumnIndex(headers, "status");
  const noteIdx = findColumnIndex(headers, "note");
  const tipIdx = findColumnIndex(headers, "tip");
  const taxIdx = findColumnIndex(headers, "tax");
  const feeIdx = findColumnIndex(headers, "fee");

  if (fromIdx === -1 || toIdx === -1) {
    errors.push(`Missing required columns. Found headers: ${headers.join(", ")}`);
    return { transactions, errors };
  }

  if (amountIdx === -1) {
    errors.push("Could not find Amount column in CSV");
    return { transactions, errors };
  }

  let successCount = 0;
  let skipCount = 0;

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < Math.max(fromIdx, toIdx, amountIdx) + 1) {
      skipCount++;
      continue;
    }

    const from = (row[fromIdx] || "").trim();
    const to = (row[toIdx] || "").trim();
    const amountRaw = row[amountIdx] || "";

    if (!from && !to) {
      skipCount++;
      continue;
    }
    
    const signedAmount = parseSignedAmount(amountRaw);
    
    if (signedAmount === 0) {
      skipCount++;
      continue;
    }

    const transaction: Transaction = {
      id: `${sourceFileName}-${i}`,
      datetime: dateIdx >= 0 ? parseDate(row[dateIdx]) : new Date(),
      type: typeIdx >= 0 ? (row[typeIdx] || "").trim() || "Payment" : "Payment",
      status: statusIdx >= 0 ? (row[statusIdx] || "").trim() || "Complete" : "Complete",
      note: noteIdx >= 0 ? (row[noteIdx] || "").trim() : "",
      from: from || "Unknown",
      to: to || "Unknown",
      amount: signedAmount,
      tip: tipIdx >= 0 ? Math.abs(parseSignedAmount(row[tipIdx])) : undefined,
      tax: taxIdx >= 0 ? Math.abs(parseSignedAmount(row[taxIdx])) : undefined,
      fee: feeIdx >= 0 ? Math.abs(parseSignedAmount(row[feeIdx])) : undefined,
      sourceFile: sourceFileName,
    };

    transactions.push(transaction);
    successCount++;
  }

  if (successCount === 0 && skipCount > 0) {
    errors.push(`Parsed 0 transactions. ${skipCount} rows were skipped (empty or invalid data).`);
  }

  return { transactions, errors };
}
