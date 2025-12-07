import { useMemo } from "react";
import { format } from "date-fns";
import { Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@shared/schema";

interface DateRangeFilterProps {
  transactions: Transaction[];
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
}

export function DateRangeFilter({
  transactions,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangeFilterProps) {
  const dateRange = useMemo(() => {
    if (transactions.length === 0) {
      return { min: new Date(), max: new Date() };
    }

    const dates = transactions.map((tx) => new Date(tx.datetime).getTime());
    return {
      min: new Date(Math.min(...dates)),
      max: new Date(Math.max(...dates)),
    };
  }, [transactions]);

  const effectiveStart = startDate || dateRange.min;
  const effectiveEnd = endDate || dateRange.max;

  const sliderValues = useMemo(() => {
    const minTime = dateRange.min.getTime();
    const maxTime = dateRange.max.getTime();
    const range = maxTime - minTime || 1;

    const startValue = ((effectiveStart.getTime() - minTime) / range) * 100;
    const endValue = ((effectiveEnd.getTime() - minTime) / range) * 100;

    return [Math.max(0, Math.min(100, startValue)), Math.max(0, Math.min(100, endValue))];
  }, [dateRange, effectiveStart, effectiveEnd]);

  const handleSliderChange = (values: number[]) => {
    const minTime = dateRange.min.getTime();
    const maxTime = dateRange.max.getTime();
    const range = maxTime - minTime || 1;

    const newStart = new Date(minTime + (values[0] / 100) * range);
    const newEnd = new Date(minTime + (values[1] / 100) * range);

    if (Math.abs(newStart.getTime() - dateRange.min.getTime()) < 86400000) {
      onStartDateChange(null);
    } else {
      onStartDateChange(newStart);
    }

    if (Math.abs(newEnd.getTime() - dateRange.max.getTime()) < 86400000) {
      onEndDateChange(null);
    } else {
      onEndDateChange(newEnd);
    }
  };

  const clearDateRange = () => {
    onStartDateChange(null);
    onEndDateChange(null);
  };

  const hasFilter = startDate !== null || endDate !== null;

  if (transactions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Date Range
        </h4>
        {hasFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearDateRange}
            data-testid="button-clear-date-filter"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="px-2">
        <Slider
          value={sliderValues}
          min={0}
          max={100}
          step={0.5}
          onValueChange={handleSliderChange}
          data-testid="slider-date-range"
          className="py-2"
        />
      </div>

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 justify-start font-mono text-xs"
              data-testid="button-start-date"
            >
              <Calendar className="h-3 w-3 mr-2" />
              {format(effectiveStart, "MMM d, yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={effectiveStart}
              onSelect={(date) => onStartDateChange(date || null)}
              disabled={(date) => date > effectiveEnd}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <span className="text-muted-foreground text-sm">to</span>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 justify-start font-mono text-xs"
              data-testid="button-end-date"
            >
              <Calendar className="h-3 w-3 mr-2" />
              {format(effectiveEnd, "MMM d, yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarComponent
              mode="single"
              selected={effectiveEnd}
              onSelect={(date) => onEndDateChange(date || null)}
              disabled={(date) => date < effectiveStart}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {hasFilter && (
        <Badge variant="secondary" className="w-full justify-center text-xs">
          Showing {format(effectiveStart, "MMM d, yyyy")} - {format(effectiveEnd, "MMM d, yyyy")}
        </Badge>
      )}
    </div>
  );
}
