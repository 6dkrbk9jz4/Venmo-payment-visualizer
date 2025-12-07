import {
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  Receipt,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SummaryStats as SummaryStatsType } from "@shared/schema";

interface SummaryStatsProps {
  stats: SummaryStatsType;
}

export function SummaryStats({ stats }: SummaryStatsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrencyFull = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-sent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-chart-1/10">
                <ArrowUpRight className="h-5 w-5 text-chart-1" />
              </div>
              <div>
                <p className="text-2xl font-semibold font-mono tracking-tight">
                  {formatCurrency(stats.totalSent)}
                </p>
                <p className="text-xs text-muted-foreground">Total Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-received">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-chart-2/10">
                <ArrowDownLeft className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-semibold font-mono tracking-tight">
                  {formatCurrency(stats.totalReceived)}
                </p>
                <p className="text-xs text-muted-foreground">Total Received</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-transactions">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-chart-3/10">
                <Receipt className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-semibold font-mono tracking-tight">
                  {stats.totalTransactions.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-unique-people">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-chart-4/10">
                <Users className="h-5 w-5 text-chart-4" />
              </div>
              <div>
                <p className="text-2xl font-semibold font-mono tracking-tight">
                  {stats.uniquePeople.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Unique People</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Accordion type="multiple" className="space-y-2">
        <AccordionItem value="top-payees" className="border rounded-md px-4">
          <AccordionTrigger
            className="hover:no-underline py-3"
            data-testid="accordion-top-payees"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-chart-2" />
              <span className="text-sm font-medium">Top 10 Payees</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ScrollArea className="h-64">
              <div className="space-y-2 pr-4">
                {stats.topPayees.map((person, index) => (
                  <div
                    key={person.name}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                    data-testid={`row-payee-${index}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-5 font-mono">
                        {index + 1}.
                      </span>
                      <span className="text-sm">{person.name}</span>
                    </div>
                    <span className="text-sm font-mono text-chart-2">
                      {formatCurrencyFull(person.amount)}
                    </span>
                  </div>
                ))}
                {stats.topPayees.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No data available
                  </p>
                )}
              </div>
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="top-payers" className="border rounded-md px-4">
          <AccordionTrigger
            className="hover:no-underline py-3"
            data-testid="accordion-top-payers"
          >
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-chart-1" />
              <span className="text-sm font-medium">Top 10 Payers</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ScrollArea className="h-64">
              <div className="space-y-2 pr-4">
                {stats.topPayers.map((person, index) => (
                  <div
                    key={person.name}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                    data-testid={`row-payer-${index}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-5 font-mono">
                        {index + 1}.
                      </span>
                      <span className="text-sm">{person.name}</span>
                    </div>
                    <span className="text-sm font-mono text-chart-1">
                      {formatCurrencyFull(person.amount)}
                    </span>
                  </div>
                ))}
                {stats.topPayers.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No data available
                  </p>
                )}
              </div>
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
