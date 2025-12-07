import { Download, Image, FileJson, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Transaction, Flow, SummaryStats } from "@shared/schema";
import type { SankeyDiagramHandle } from "@/components/sankey-diagram";

interface ExportPanelProps {
  transactions: Transaction[];
  flows: Flow[];
  stats: SummaryStats;
  sankeyRef: React.RefObject<SankeyDiagramHandle | null>;
}

export function ExportPanel({ transactions, flows, stats, sankeyRef }: ExportPanelProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toISOString().split("T")[0];
  };

  const handleExportSankeyPNG = async () => {
    const svgElement = sankeyRef.current?.getSvgElement();
    if (!svgElement) {
      alert("No Sankey diagram available to export");
      return;
    }
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = 2;
      canvas.width = svgElement.clientWidth * scale;
      canvas.height = svgElement.clientHeight * scale;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--background")
        .trim() || "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `venmo-sankey-${formatDate(new Date())}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, "image/png");

      URL.revokeObjectURL(svgUrl);
    };

    img.src = svgUrl;
  };

  const handleExportTransactionsCSV = () => {
    const headers = ["ID", "Date", "From", "To", "Amount", "Type", "Status", "Note", "Source File"];
    const rows = transactions.map((tx) => [
      tx.id,
      formatDate(tx.datetime),
      tx.from,
      tx.to,
      tx.amount.toFixed(2),
      tx.type,
      tx.status,
      tx.note.replace(/"/g, '""'),
      tx.sourceFile,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    downloadFile(csvContent, `venmo-transactions-${formatDate(new Date())}.csv`, "text/csv");
  };

  const handleExportFlowsCSV = () => {
    const headers = ["Source", "Target", "Total Amount"];
    const rows = flows.map((flow) => [
      flow.source,
      flow.target,
      flow.value.toFixed(2),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    downloadFile(csvContent, `venmo-flows-${formatDate(new Date())}.csv`, "text/csv");
  };

  const handleExportTransactionsJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      transactionCount: transactions.length,
      transactions: transactions.map((tx) => ({
        id: tx.id,
        datetime: tx.datetime,
        from: tx.from,
        to: tx.to,
        amount: tx.amount,
        type: tx.type,
        status: tx.status,
        note: tx.note,
        sourceFile: tx.sourceFile,
      })),
    };

    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, `venmo-transactions-${formatDate(new Date())}.json`, "application/json");
  };

  const handleExportFlowsJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      summary: {
        totalSent: stats.totalSent,
        totalReceived: stats.totalReceived,
        totalTransactions: stats.totalTransactions,
        uniquePeople: stats.uniquePeople,
      },
      flows: flows.map((flow) => ({
        source: flow.source,
        target: flow.target,
        value: flow.value,
      })),
      topPayees: stats.topPayees,
      topPayers: stats.topPayers,
    };

    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, `venmo-flows-${formatDate(new Date())}.json`, "application/json");
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasData = transactions.length > 0;

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-1">
          <Download className="h-5 w-5" />
          Export Data
        </h3>
        <p className="text-sm text-muted-foreground">
          Download your transaction data and visualizations
        </p>
      </div>

      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Image className="h-4 w-4" />
            Visualization
          </CardTitle>
          <CardDescription className="text-xs">
            Export the Sankey diagram as an image
          </CardDescription>
        </CardHeader>
        <CardContent className="py-3 px-4">
          <Button
            onClick={handleExportSankeyPNG}
            disabled={!hasData}
            className="w-full"
            data-testid="button-export-sankey-png"
          >
            <Image className="h-4 w-4 mr-2" />
            Download Sankey as PNG
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            CSV Exports
          </CardTitle>
          <CardDescription className="text-xs">
            Export data in spreadsheet format
          </CardDescription>
        </CardHeader>
        <CardContent className="py-3 px-4 space-y-2">
          <Button
            variant="outline"
            onClick={handleExportTransactionsCSV}
            disabled={!hasData}
            className="w-full justify-start"
            data-testid="button-export-transactions-csv"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Transactions CSV
          </Button>
          <Button
            variant="outline"
            onClick={handleExportFlowsCSV}
            disabled={!hasData}
            className="w-full justify-start"
            data-testid="button-export-flows-csv"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Aggregated Flows CSV
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileJson className="h-4 w-4" />
            JSON Exports
          </CardTitle>
          <CardDescription className="text-xs">
            Export data in JSON format for developers
          </CardDescription>
        </CardHeader>
        <CardContent className="py-3 px-4 space-y-2">
          <Button
            variant="outline"
            onClick={handleExportTransactionsJSON}
            disabled={!hasData}
            className="w-full justify-start"
            data-testid="button-export-transactions-json"
          >
            <FileJson className="h-4 w-4 mr-2" />
            Transactions JSON
          </Button>
          <Button
            variant="outline"
            onClick={handleExportFlowsJSON}
            disabled={!hasData}
            className="w-full justify-start"
            data-testid="button-export-flows-json"
          >
            <FileJson className="h-4 w-4 mr-2" />
            Flows & Stats JSON
          </Button>
        </CardContent>
      </Card>

      {!hasData && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          Upload CSV files to enable exports
        </div>
      )}
    </div>
  );
}
