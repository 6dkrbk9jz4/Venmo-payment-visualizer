import { useCallback, useState } from "react";
import { Upload, X, FileText, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { UploadedFile } from "@shared/schema";

interface FileUploadProps {
  files: UploadedFile[];
  onFilesAdded: (fileContents: Array<{ name: string; content: string; size: number }>) => void;
  onFileRemove: (fileName: string) => void;
  onClearAll: () => void;
  errors: string[];
}

export function FileUpload({
  files,
  onFilesAdded,
  onFileRemove,
  onClearAll,
  errors,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      const results: Array<{ name: string; content: string; size: number }> = [];

      for (const file of Array.from(fileList)) {
        if (file.type === "text/csv" || file.name.endsWith(".csv")) {
          const content = await file.text();
          results.push({ name: file.name, content, size: file.size });
        }
      }

      if (results.length > 0) {
        onFilesAdded(results);
      }
    },
    [onFilesAdded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
        e.target.value = "";
      }
    },
    [handleFiles]
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h2 className="text-base font-semibold">Upload Files</h2>
          {files.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {files.length}
            </Badge>
          )}
        </div>

        <div
          className={`
            relative min-h-36 rounded-md border-2 border-dashed transition-colors duration-200
            flex flex-col items-center justify-center gap-3 p-4 cursor-pointer
            ${
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById("csv-input")?.click()}
          data-testid="dropzone-upload"
        >
          <input
            id="csv-input"
            type="file"
            accept=".csv"
            multiple
            className="hidden"
            onChange={handleInputChange}
            data-testid="input-file"
          />
          <div
            className={`
              p-3 rounded-full transition-colors
              ${isDragOver ? "bg-primary/10" : "bg-muted"}
            `}
          >
            <Upload
              className={`h-6 w-6 ${isDragOver ? "text-primary" : "text-muted-foreground"}`}
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Drag & drop CSV files here</p>
            <p className="text-xs text-muted-foreground mt-1">
              or click to browse
            </p>
          </div>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="text-xs">
              {errors.slice(0, 3).map((error, i) => (
                <p key={i}>{error}</p>
              ))}
              {errors.length > 3 && (
                <p className="mt-1 font-medium">
                  +{errors.length - 3} more errors
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {files.map((file) => (
                <Card
                  key={file.name}
                  className="p-3 flex items-center gap-3"
                  data-testid={`card-file-${file.name}`}
                >
                  <div className="p-2 rounded-md bg-muted shrink-0">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)} • {file.transactionCount} transactions
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileRemove(file.name);
                    }}
                    data-testid={`button-remove-${file.name}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </Card>
              ))}
            </div>
          </ScrollArea>
          <div className="p-4 border-t border-sidebar-border">
            <Button
              variant="outline"
              className="w-full"
              onClick={onClearAll}
              data-testid="button-clear-all"
            >
              Clear All
            </Button>
          </div>
        </div>
      )}

      {files.length === 0 && errors.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-muted-foreground text-center">
            Upload Venmo CSV statements to visualize your transaction flows
          </p>
        </div>
      )}
    </div>
  );
}
