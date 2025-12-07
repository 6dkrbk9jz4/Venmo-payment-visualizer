import { useMemo, useState } from "react";
import { Store, ChevronDown, ChevronRight, TrendingUp, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@shared/schema";
import { findMerchantCluster, MERCHANT_CATEGORIES, getMerchantStats } from "@/lib/merchant-clusters";

interface MerchantPanelProps {
  transactions: Transaction[];
}

export function MerchantPanel({ transactions }: MerchantPanelProps) {
  const [groupByCluster, setGroupByCluster] = useState(true);
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set());

  const merchantTransactions = useMemo(() => {
    return transactions.filter((tx) => 
      findMerchantCluster(tx.from) || findMerchantCluster(tx.to)
    );
  }, [transactions]);

  const clusterStats = useMemo(() => {
    const stats = new Map<string, { total: number; count: number; merchants: Map<string, { total: number; count: number }> }>();
    
    for (const tx of merchantTransactions) {
      const fromCluster = findMerchantCluster(tx.from);
      const toCluster = findMerchantCluster(tx.to);
      const amount = Math.abs(tx.amount);
      
      const cluster = fromCluster || toCluster;
      const merchantName = fromCluster ? tx.from : tx.to;
      
      if (cluster) {
        if (!stats.has(cluster.name)) {
          stats.set(cluster.name, { total: 0, count: 0, merchants: new Map() });
        }
        const clusterData = stats.get(cluster.name)!;
        clusterData.total += amount;
        clusterData.count += 1;
        
        if (!clusterData.merchants.has(merchantName)) {
          clusterData.merchants.set(merchantName, { total: 0, count: 0 });
        }
        const merchantData = clusterData.merchants.get(merchantName)!;
        merchantData.total += amount;
        merchantData.count += 1;
      }
    }
    
    return Array.from(stats.entries())
      .map(([name, data]) => ({
        name,
        total: data.total,
        count: data.count,
        merchants: Array.from(data.merchants.entries())
          .map(([mName, mData]) => ({
            name: mName,
            total: mData.total,
            count: mData.count,
          }))
          .sort((a, b) => b.total - a.total),
      }))
      .sort((a, b) => b.total - a.total);
  }, [merchantTransactions]);

  const totalMerchantSpend = useMemo(() => {
    return clusterStats.reduce((sum, cluster) => sum + cluster.total, 0);
  }, [clusterStats]);

  const maxClusterTotal = useMemo(() => {
    return Math.max(...clusterStats.map((c) => c.total), 1);
  }, [clusterStats]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const toggleCluster = (name: string) => {
    setExpandedClusters((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  if (transactions.length === 0) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <div className="text-center py-12 px-4">
          <div className="p-4 rounded-full bg-muted inline-block mb-4">
            <Store className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No Merchant Data</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Upload CSV files to see merchant spending analysis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-1">
          <Store className="h-5 w-5" />
          Merchant Spending
        </h3>
        <p className="text-sm text-muted-foreground">
          View spending grouped by merchant category
        </p>
      </div>

      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="py-3 px-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold font-mono">
                {formatCurrency(totalMerchantSpend)}
              </p>
              <p className="text-xs text-muted-foreground">Total merchant spend</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono">
                {merchantTransactions.length}
              </p>
              <p className="text-xs text-muted-foreground">Merchant transactions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Switch
          id="group-cluster"
          checked={groupByCluster}
          onCheckedChange={setGroupByCluster}
          data-testid="switch-group-by-cluster"
        />
        <Label htmlFor="group-cluster" className="text-sm">
          Group by category
        </Label>
      </div>

      <ScrollArea className="h-[calc(100vh-400px)] min-h-64">
        <div className="space-y-2">
          {clusterStats.map((cluster) => (
            <Card key={cluster.name} className="overflow-hidden">
              <Collapsible
                open={expandedClusters.has(cluster.name)}
                onOpenChange={() => toggleCluster(cluster.name)}
              >
                <CollapsibleTrigger asChild>
                  <button
                    className="w-full p-3 flex items-center justify-between gap-3 text-left hover-elevate"
                    data-testid={`cluster-${cluster.name}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{cluster.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {cluster.count} transactions
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="font-mono text-sm font-medium">
                          {formatCurrency(cluster.total)}
                        </p>
                        <Progress
                          value={(cluster.total / maxClusterTotal) * 100}
                          className="w-24 h-1.5"
                        />
                      </div>
                      {expandedClusters.has(cluster.name) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t px-3 py-2 bg-muted/30 space-y-1">
                    {cluster.merchants.map((merchant) => (
                      <div
                        key={merchant.name}
                        className="flex items-center justify-between py-1.5 px-2 rounded text-sm"
                      >
                        <span className="truncate text-muted-foreground">
                          {merchant.name}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary" className="text-xs">
                            {merchant.count}
                          </Badge>
                          <span className="font-mono text-xs">
                            {formatCurrency(merchant.total)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {clusterStats.length === 0 && merchantTransactions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Store className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No merchant transactions found</p>
          <p className="text-xs">Your transactions don't contain recognized merchants</p>
        </div>
      )}
    </div>
  );
}
