import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Transaction, Flow } from "@shared/schema";

interface RawDataViewProps {
  transactions: Transaction[];
  flows: Flow[];
}

export function RawDataView({ transactions, flows }: RawDataViewProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (data: object, key: string) => {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (transactions.length === 0) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center py-12">
          <div className="p-4 rounded-full bg-muted inline-block mb-4">
            <svg
              className="h-8 w-8 text-muted-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M16 13H8" />
              <path d="M16 17H8" />
              <path d="M10 9H8" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">No Raw Data</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Upload CSV files to view the parsed transaction data in JSON format.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="transactions" className="h-full flex flex-col">
      <div className="border-b px-4">
        <TabsList className="h-12 bg-transparent p-0 gap-6">
          <TabsTrigger
            value="transactions"
            className="h-12 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            data-testid="tab-raw-transactions"
          >
            Transactions ({transactions.length})
          </TabsTrigger>
          <TabsTrigger
            value="flows"
            className="h-12 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            data-testid="tab-raw-flows"
          >
            Aggregated Flows ({flows.length})
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="transactions" className="flex-1 m-0 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="flex justify-end p-4 border-b">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(transactions, "transactions")}
              data-testid="button-copy-transactions"
            >
              {copied === "transactions" ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              Copy JSON
            </Button>
          </div>
          <ScrollArea className="flex-1 p-4">
            <pre className="text-xs font-mono bg-muted p-4 rounded-md overflow-x-auto">
              {JSON.stringify(transactions, null, 2)}
            </pre>
          </ScrollArea>
        </div>
      </TabsContent>

      <TabsContent value="flows" className="flex-1 m-0 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="flex justify-end p-4 border-b">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(flows, "flows")}
              data-testid="button-copy-flows"
            >
              {copied === "flows" ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              Copy JSON
            </Button>
          </div>
          <ScrollArea className="flex-1 p-4">
            <pre className="text-xs font-mono bg-muted p-4 rounded-md overflow-x-auto">
              {JSON.stringify(flows, null, 2)}
            </pre>
          </ScrollArea>
        </div>
      </TabsContent>
    </Tabs>
  );
}
