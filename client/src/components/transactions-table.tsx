import { useState, useMemo } from "react";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Transaction } from "@shared/schema";

interface TransactionsTableProps {
  transactions: Transaction[];
  filterPerson?: string;
  onClearFilter?: () => void;
  aliasMap?: Map<string, string>;
}

type SortField = "datetime" | "from" | "to" | "amount" | "type";
type SortDirection = "asc" | "desc";

export function TransactionsTable({
  transactions,
  filterPerson,
  onClearFilter,
  aliasMap,
}: TransactionsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("datetime");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const uniqueTypes = useMemo(() => {
    const types = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.type) types.add(tx.type);
    });
    return Array.from(types).sort();
  }, [transactions]);

  const applyAlias = (name: string): string => {
    return aliasMap?.get(name) || name;
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...transactions];

    if (filterPerson) {
      const aliasedFilter = applyAlias(filterPerson);
      result = result.filter(
        (tx) => applyAlias(tx.from) === aliasedFilter || applyAlias(tx.to) === aliasedFilter
      );
    }

    if (typeFilter && typeFilter !== "all") {
      result = result.filter((tx) => tx.type === typeFilter);
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (tx) =>
          applyAlias(tx.from).toLowerCase().includes(lower) ||
          applyAlias(tx.to).toLowerCase().includes(lower) ||
          tx.note.toLowerCase().includes(lower) ||
          tx.type.toLowerCase().includes(lower) ||
          tx.sourceFile.toLowerCase().includes(lower)
      );
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "datetime":
          comparison =
            new Date(a.datetime).getTime() - new Date(b.datetime).getTime();
          break;
        case "from":
          comparison = applyAlias(a.from).localeCompare(applyAlias(b.from));
          break;
        case "to":
          comparison = applyAlias(a.to).localeCompare(applyAlias(b.to));
          break;
        case "amount":
          comparison = Math.abs(a.amount) - Math.abs(b.amount);
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [transactions, filterPerson, searchTerm, sortField, sortDirection, typeFilter, aliasMap]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSorted.slice(start, start + pageSize);
  }, [filteredAndSorted, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
  const startRow = filteredAndSorted.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRow = Math.min(currentPage * pageSize, filteredAndSorted.length);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1" />
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(absValue);
    return value < 0 ? `-${formatted}` : formatted;
  };

  const handleExport = () => {
    const headers = ["Date", "From", "To", "Amount", "Type", "Note", "Source File"];
    const rows = filteredAndSorted.map((tx) => [
      formatDate(tx.datetime),
      applyAlias(tx.from),
      applyAlias(tx.to),
      tx.amount.toFixed(2),
      tx.type,
      tx.note.replace(/"/g, '""'),
      tx.sourceFile,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "venmo-transactions-export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    onClearFilter?.();
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || typeFilter !== "all" || filterPerson;

  if (transactions.length === 0) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center py-12 px-4">
          <div className="p-4 rounded-full bg-muted inline-block mb-4">
            <svg
              className="h-8 w-8 text-muted-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 3h18v18H3zM3 9h18M9 21V9" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">No Transactions</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Upload CSV files to see your transaction data here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-wrap items-center gap-3 p-4 border-b">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
            data-testid="input-search-transactions"
          />
        </div>

        <Select
          value={typeFilter}
          onValueChange={(val) => {
            setTypeFilter(val);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-36" data-testid="select-type-filter">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {uniqueTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filterPerson && (
          <Badge variant="secondary" className="gap-1">
            Person: {applyAlias(filterPerson)}
            <button
              onClick={onClearFilter}
              className="ml-1 hover:text-foreground"
              data-testid="button-clear-person-filter"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            data-testid="button-clear-all-filters"
          >
            Clear Filters
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          data-testid="button-export-csv"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
            <TableRow>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("datetime")}
                data-testid="header-date"
              >
                <span className="flex items-center">
                  Date
                  <SortIcon field="datetime" />
                </span>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("from")}
                data-testid="header-from"
              >
                <span className="flex items-center">
                  From
                  <SortIcon field="from" />
                </span>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("to")}
                data-testid="header-to"
              >
                <span className="flex items-center">
                  To
                  <SortIcon field="to" />
                </span>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right"
                onClick={() => handleSort("amount")}
                data-testid="header-amount"
              >
                <span className="flex items-center justify-end">
                  Amount
                  <SortIcon field="amount" />
                </span>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("type")}
                data-testid="header-type"
              >
                <span className="flex items-center">
                  Type
                  <SortIcon field="type" />
                </span>
              </TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((tx, index) => (
              <TableRow 
                key={tx.id} 
                className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}
                data-testid={`row-transaction-${index}`}
              >
                <TableCell className="font-mono text-xs whitespace-nowrap">
                  {formatDate(tx.datetime)}
                </TableCell>
                <TableCell className="max-w-32 truncate" title={tx.from}>
                  {applyAlias(tx.from)}
                  {aliasMap?.has(tx.from) && (
                    <span className="text-xs text-muted-foreground ml-1">*</span>
                  )}
                </TableCell>
                <TableCell className="max-w-32 truncate" title={tx.to}>
                  {applyAlias(tx.to)}
                  {aliasMap?.has(tx.to) && (
                    <span className="text-xs text-muted-foreground ml-1">*</span>
                  )}
                </TableCell>
                <TableCell 
                  className={`text-right font-mono whitespace-nowrap ${
                    tx.amount < 0 ? "text-destructive" : "text-chart-2"
                  }`}
                >
                  {formatCurrency(tx.amount)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {tx.type}
                  </Badge>
                </TableCell>
                <TableCell
                  className="max-w-40 truncate text-muted-foreground text-xs"
                  title={tx.note}
                >
                  {tx.note || "-"}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {tx.sourceFile.length > 15
                      ? tx.sourceFile.slice(0, 12) + "..."
                      : tx.sourceFile}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {paginatedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No transactions match your filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-t bg-background">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => {
              setPageSize(Number(val));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-20" data-testid="select-page-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {startRow}-{endRow} of {filteredAndSorted.length}
          </span>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              data-testid="button-prev-page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              data-testid="button-next-page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
