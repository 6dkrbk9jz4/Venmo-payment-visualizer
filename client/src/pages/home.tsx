import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { BarChart3, Table2, FileJson, Settings, Menu, Users, Download, Store } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { FileUpload } from "@/components/file-upload";
import { SankeyDiagram } from "@/components/sankey-diagram";
import { TransactionsTable } from "@/components/transactions-table";
import { SummaryStats } from "@/components/summary-stats";
import { SettingsPanel } from "@/components/settings-panel";
import { RawDataView } from "@/components/raw-data-view";
import { ThemeToggle } from "@/components/theme-toggle";
import { AliasPanel } from "@/components/alias-panel";
import { DateRangeFilter } from "@/components/date-range-filter";
import { ExportPanel } from "@/components/export-panel";
import { MerchantPanel } from "@/components/merchant-panel";
import { parseVenmoCSV } from "@/lib/csv-parser";
import type { SankeyDiagramHandle } from "@/components/sankey-diagram";
import {
  saveSession,
  loadSession,
  clearSession,
  getSessionInfo,
} from "@/lib/session-storage";
import {
  aggregateFlows,
  getUniquePeople,
  getOriginalPeople,
  buildSankeyData,
  calculateSummaryStats,
} from "@/lib/aggregator";
import { buildAliasMap, type AliasMapping } from "@/lib/alias-manager";
import type { Transaction, UploadedFile, Flow, SankeyData, SummaryStats as SummaryStatsType } from "@shared/schema";

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [filterPerson, setFilterPerson] = useState<string | null>(null);
  const [hideMerchants, setHideMerchants] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("sankey");
  const [aliases, setAliases] = useState<AliasMapping[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [sessionInfo, setSessionInfo] = useState(() => getSessionInfo());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const sankeyRef = useRef<SankeyDiagramHandle>(null);

  useEffect(() => {
    setSessionInfo(getSessionInfo());
  }, []);

  useEffect(() => {
    if (transactions.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [transactions, aliases, hideMerchants, startDate, endDate]);

  const aliasMap = useMemo(() => buildAliasMap(aliases), [aliases]);

  const filteredByDate = useMemo(() => {
    if (!startDate && !endDate) return transactions;
    
    return transactions.filter((tx) => {
      const txDate = new Date(tx.datetime);
      if (startDate && txDate < startDate) return false;
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (txDate > endOfDay) return false;
      }
      return true;
    });
  }, [transactions, startDate, endDate]);

  const originalPeople: string[] = useMemo(
    () => getOriginalPeople(transactions, hideMerchants),
    [transactions, hideMerchants]
  );

  const flows: Flow[] = useMemo(
    () => aggregateFlows(filteredByDate, hideMerchants, aliasMap),
    [filteredByDate, hideMerchants, aliasMap]
  );

  const people: string[] = useMemo(
    () => getUniquePeople(filteredByDate, hideMerchants, aliasMap),
    [filteredByDate, hideMerchants, aliasMap]
  );

  const sankeyData: SankeyData = useMemo(
    () => buildSankeyData(flows, people),
    [flows, people]
  );

  const stats: SummaryStatsType = useMemo(
    () => calculateSummaryStats(filteredByDate, hideMerchants, aliasMap),
    [filteredByDate, hideMerchants, aliasMap]
  );

  const handleFilesAdded = useCallback(
    (files: Array<{ name: string; content: string; size: number }>) => {
      const newTransactions: Transaction[] = [];
      const newFiles: UploadedFile[] = [];
      const errors: string[] = [];

      for (const file of files) {
        if (uploadedFiles.some((f) => f.name === file.name)) {
          errors.push(`File "${file.name}" already uploaded`);
          continue;
        }

        const result = parseVenmoCSV(file.content, file.name);
        newTransactions.push(...result.transactions);
        errors.push(...result.errors);

        newFiles.push({
          name: file.name,
          size: file.size,
          transactionCount: result.transactions.length,
        });
      }

      setTransactions((prev) => [...prev, ...newTransactions]);
      setUploadedFiles((prev) => [...prev, ...newFiles]);
      setParseErrors(errors);
    },
    [uploadedFiles]
  );

  const handleFileRemove = useCallback((fileName: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.sourceFile !== fileName));
    setUploadedFiles((prev) => prev.filter((f) => f.name !== fileName));
    setParseErrors([]);
  }, []);

  const handleClearAll = useCallback(() => {
    setTransactions([]);
    setUploadedFiles([]);
    setParseErrors([]);
    setFilterPerson(null);
    setAliases([]);
    setStartDate(null);
    setEndDate(null);
  }, []);

  const handleNodeClick = useCallback((nodeName: string) => {
    setFilterPerson(nodeName);
    setActiveTab("table");
  }, []);

  const handleClearFilter = useCallback(() => {
    setFilterPerson(null);
  }, []);

  const handleSaveSession = useCallback(() => {
    const success = saveSession({
      transactions,
      uploadedFiles,
      aliases,
      hideMerchants,
      startDate,
      endDate,
    });
    if (success) {
      setHasUnsavedChanges(false);
      setSessionInfo(getSessionInfo());
    }
    return success;
  }, [transactions, uploadedFiles, aliases, hideMerchants, startDate, endDate]);

  const handleLoadSession = useCallback(() => {
    const session = loadSession();
    if (!session) return false;

    setTransactions(session.transactions);
    setUploadedFiles(session.uploadedFiles);
    setAliases(session.aliases);
    setHideMerchants(session.hideMerchants);
    setStartDate(session.startDate);
    setEndDate(session.endDate);
    setHasUnsavedChanges(false);
    return true;
  }, []);

  const handleClearSession = useCallback(() => {
    clearSession();
    setSessionInfo(null);
  }, []);

  const UploadSidebar = (
    <div className="flex flex-col h-full">
      <FileUpload
        files={uploadedFiles}
        onFilesAdded={handleFilesAdded}
        onFileRemove={handleFileRemove}
        onClearAll={handleClearAll}
        errors={parseErrors}
      />
      {transactions.length > 0 && (
        <>
          <Separator />
          <div className="p-4">
            <DateRangeFilter
              transactions={transactions}
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="h-14 border-b flex items-center justify-between gap-4 px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                data-testid="button-mobile-menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              {UploadSidebar}
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary">
              <BarChart3 className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">
              Venmo Flow Visualizer
            </h1>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex-1 flex min-h-0">
        <aside className="hidden lg:flex w-80 border-r bg-sidebar shrink-0 flex-col overflow-auto">
          {UploadSidebar}
        </aside>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="flex-1 flex flex-col"
          >
            <div className="border-b px-4 shrink-0">
              <TabsList className="h-12 bg-transparent p-0 gap-1">
                <TabsTrigger
                  value="sankey"
                  className="h-12 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-2"
                  data-testid="tab-sankey"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Sankey Diagram</span>
                </TabsTrigger>
                <TabsTrigger
                  value="table"
                  className="h-12 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-2"
                  data-testid="tab-table"
                >
                  <Table2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Transactions</span>
                </TabsTrigger>
                <TabsTrigger
                  value="aliases"
                  className="h-12 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-2"
                  data-testid="tab-aliases"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Aliases</span>
                </TabsTrigger>
                <TabsTrigger
                  value="raw"
                  className="h-12 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-2"
                  data-testid="tab-raw"
                >
                  <FileJson className="h-4 w-4" />
                  <span className="hidden sm:inline">Raw Data</span>
                </TabsTrigger>
                <TabsTrigger
                  value="merchants"
                  className="h-12 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-2"
                  data-testid="tab-merchants"
                >
                  <Store className="h-4 w-4" />
                  <span className="hidden sm:inline">Merchants</span>
                </TabsTrigger>
                <TabsTrigger
                  value="export"
                  className="h-12 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-2"
                  data-testid="tab-export"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="h-12 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-2"
                  data-testid="tab-settings"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="sankey" className="flex-1 m-0 overflow-hidden">
              <div className="h-full flex flex-col lg:flex-row">
                <div className="flex-1 min-w-0 overflow-hidden">
                  <SankeyDiagram
                    ref={sankeyRef}
                    data={sankeyData}
                    onNodeClick={handleNodeClick}
                  />
                </div>
                {transactions.length > 0 && (
                  <div className="lg:w-96 border-t lg:border-t-0 lg:border-l shrink-0 overflow-auto p-4">
                    <SummaryStats stats={stats} />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="table" className="flex-1 m-0 overflow-hidden">
              <TransactionsTable
                transactions={filteredByDate}
                filterPerson={filterPerson || undefined}
                onClearFilter={handleClearFilter}
                aliasMap={aliasMap}
              />
            </TabsContent>

            <TabsContent value="aliases" className="flex-1 m-0 overflow-auto">
              <AliasPanel
                people={originalPeople}
                aliases={aliases}
                onAliasesChange={setAliases}
              />
            </TabsContent>

            <TabsContent value="raw" className="flex-1 m-0 overflow-hidden">
              <RawDataView transactions={filteredByDate} flows={flows} />
            </TabsContent>

            <TabsContent value="merchants" className="flex-1 m-0 overflow-auto">
              <MerchantPanel transactions={filteredByDate} />
            </TabsContent>

            <TabsContent value="export" className="flex-1 m-0 overflow-auto">
              <ExportPanel
                transactions={filteredByDate}
                flows={flows}
                stats={stats}
                sankeyRef={sankeyRef}
              />
            </TabsContent>

            <TabsContent value="settings" className="flex-1 m-0 overflow-auto">
              <SettingsPanel
                hideMerchants={hideMerchants}
                onHideMerchantsChange={setHideMerchants}
                onSaveSession={handleSaveSession}
                onLoadSession={handleLoadSession}
                onClearSession={handleClearSession}
                sessionInfo={sessionInfo}
                hasUnsavedChanges={hasUnsavedChanges}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
