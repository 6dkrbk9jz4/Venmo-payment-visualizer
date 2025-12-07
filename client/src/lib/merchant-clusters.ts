export interface MerchantCluster {
  name: string;
  merchants: string[];
  icon?: string;
}

export const MERCHANT_CATEGORIES: MerchantCluster[] = [
  {
    name: "Food Delivery",
    merchants: ["doordash", "uber eats", "grubhub", "instacart", "postmates", "seamless"],
  },
  {
    name: "Rideshare",
    merchants: ["uber", "lyft", "bolt"],
  },
  {
    name: "Restaurants",
    merchants: ["starbucks", "mcdonalds", "chipotle", "panera", "dunkin", "dominos", "pizza hut", "taco bell", "wendys", "burger king", "subway", "chick-fil-a"],
  },
  {
    name: "Streaming",
    merchants: ["netflix", "spotify", "hulu", "disney+", "hbo", "paramount+", "peacock", "youtube", "twitch", "amazon prime"],
  },
  {
    name: "E-Commerce",
    merchants: ["amazon", "walmart", "target", "costco", "ebay", "etsy"],
  },
  {
    name: "Payments",
    merchants: ["venmo", "paypal", "cash app", "zelle", "square"],
  },
  {
    name: "Pharmacy",
    merchants: ["cvs", "walgreens", "rite aid"],
  },
  {
    name: "Convenience",
    merchants: ["7-eleven", "wawa", "sheetz", "circle k"],
  },
  {
    name: "Gas Stations",
    merchants: ["shell", "chevron", "exxon", "bp", "mobil", "sunoco"],
  },
  {
    name: "Travel",
    merchants: ["airbnb", "vrbo", "hotels.com", "expedia", "booking.com", "kayak", "priceline"],
  },
  {
    name: "Airlines",
    merchants: ["delta", "united", "american airlines", "southwest", "jetblue", "spirit", "frontier", "alaska airlines"],
  },
  {
    name: "Telecom",
    merchants: ["att", "verizon", "t-mobile", "sprint", "comcast", "xfinity", "spectrum", "cox"],
  },
  {
    name: "Tech",
    merchants: ["apple", "google", "microsoft", "adobe"],
  },
];

export function findMerchantCluster(name: string): MerchantCluster | null {
  if (!name) return null;
  const lowerName = name.toLowerCase();
  
  for (const cluster of MERCHANT_CATEGORIES) {
    for (const merchant of cluster.merchants) {
      if (lowerName.includes(merchant) || merchant.includes(lowerName.slice(0, 5))) {
        return cluster;
      }
    }
  }
  
  return null;
}

export function getClusterName(name: string): string {
  const cluster = findMerchantCluster(name);
  return cluster ? cluster.name : name;
}

export function getMerchantStats(
  transactions: Array<{ from: string; to: string; amount: number }>,
  useCluster: boolean = false
): Array<{ name: string; cluster: string | null; totalAmount: number; transactionCount: number }> {
  const stats = new Map<string, { cluster: string | null; totalAmount: number; transactionCount: number }>();
  
  for (const tx of transactions) {
    const fromCluster = findMerchantCluster(tx.from);
    const toCluster = findMerchantCluster(tx.to);
    
    if (fromCluster) {
      const key = useCluster ? fromCluster.name : tx.from;
      const existing = stats.get(key) || { cluster: fromCluster.name, totalAmount: 0, transactionCount: 0 };
      existing.totalAmount += Math.abs(tx.amount);
      existing.transactionCount += 1;
      stats.set(key, existing);
    }
    
    if (toCluster) {
      const key = useCluster ? toCluster.name : tx.to;
      const existing = stats.get(key) || { cluster: toCluster.name, totalAmount: 0, transactionCount: 0 };
      existing.totalAmount += Math.abs(tx.amount);
      existing.transactionCount += 1;
      stats.set(key, existing);
    }
  }
  
  return Array.from(stats.entries())
    .map(([name, data]) => ({
      name,
      cluster: data.cluster,
      totalAmount: data.totalAmount,
      transactionCount: data.transactionCount,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

export function groupTransactionsByCluster(
  transactions: Array<{ from: string; to: string; amount: number }>,
): Map<string, Array<{ from: string; to: string; amount: number }>> {
  const groups = new Map<string, Array<{ from: string; to: string; amount: number }>>();
  
  for (const tx of transactions) {
    const fromCluster = findMerchantCluster(tx.from);
    const toCluster = findMerchantCluster(tx.to);
    
    const clusterName = fromCluster?.name || toCluster?.name || "Other";
    
    if (!groups.has(clusterName)) {
      groups.set(clusterName, []);
    }
    groups.get(clusterName)!.push(tx);
  }
  
  return groups;
}
