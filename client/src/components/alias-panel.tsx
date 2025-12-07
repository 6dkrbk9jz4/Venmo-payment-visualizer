import { useState, useMemo, useCallback } from "react";
import { Users, Merge, Plus, X, Check, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AliasMapping } from "@/lib/alias-manager";
import { findSimilarNames } from "@/lib/alias-manager";

interface AliasPanelProps {
  people: string[];
  aliases: AliasMapping[];
  onAliasesChange: (aliases: AliasMapping[]) => void;
}

export function AliasPanel({ people, aliases, onAliasesChange }: AliasPanelProps) {
  const [newCanonical, setNewCanonical] = useState("");
  const [selectedAliases, setSelectedAliases] = useState<string[]>([]);

  const suggestions = useMemo(() => {
    const existingAliasNames = new Set(
      aliases.flatMap((a) => [a.canonical, ...a.aliases])
    );
    const availablePeople = people.filter((p) => !existingAliasNames.has(p));
    return findSimilarNames(availablePeople, 0.75);
  }, [people, aliases]);

  const availablePeopleForSelection = useMemo(() => {
    const existingAliasNames = new Set(
      aliases.flatMap((a) => [a.canonical, ...a.aliases])
    );
    return people
      .filter((p) => !existingAliasNames.has(p) && !selectedAliases.includes(p))
      .sort();
  }, [people, aliases, selectedAliases]);

  const handleAddAlias = useCallback((person: string) => {
    if (!selectedAliases.includes(person)) {
      setSelectedAliases((prev) => [...prev, person]);
    }
  }, [selectedAliases]);

  const handleRemoveSelectedAlias = useCallback((person: string) => {
    setSelectedAliases((prev) => prev.filter((p) => p !== person));
  }, []);

  const handleCreateMapping = useCallback(() => {
    if (!newCanonical || selectedAliases.length === 0) return;

    const newMapping: AliasMapping = {
      canonical: newCanonical,
      aliases: selectedAliases.filter((a) => a !== newCanonical),
    };

    onAliasesChange([...aliases, newMapping]);
    setNewCanonical("");
    setSelectedAliases([]);
  }, [newCanonical, selectedAliases, aliases, onAliasesChange]);

  const handleAcceptSuggestion = useCallback(
    (suggestion: { names: string[]; suggested: string }) => {
      const newMapping: AliasMapping = {
        canonical: suggestion.suggested,
        aliases: suggestion.names.filter((n) => n !== suggestion.suggested),
      };
      onAliasesChange([...aliases, newMapping]);
    },
    [aliases, onAliasesChange]
  );

  const handleRemoveMapping = useCallback(
    (index: number) => {
      onAliasesChange(aliases.filter((_, i) => i !== index));
    },
    [aliases, onAliasesChange]
  );

  const handleSetCanonicalFromSelection = useCallback(() => {
    if (selectedAliases.length > 0 && !newCanonical) {
      const properCase = selectedAliases.find(
        (n) => /[A-Z]/.test(n) && /[a-z]/.test(n)
      );
      setNewCanonical(properCase || selectedAliases[0]);
    }
  }, [selectedAliases, newCanonical]);

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-1">
          <Users className="h-5 w-5" />
          Name Aliases
        </h3>
        <p className="text-sm text-muted-foreground">
          Merge similar names to consolidate transaction data
        </p>
      </div>

      {suggestions.length > 0 && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
              Suggested Merges
            </CardTitle>
            <CardDescription className="text-xs">
              We found names that might be the same person
            </CardDescription>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <ScrollArea className="max-h-48">
              <div className="space-y-2">
                {suggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 py-2 px-3 bg-muted/50 rounded-md"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5">
                        {suggestion.names.map((name) => (
                          <Badge
                            key={name}
                            variant={name === suggestion.suggested ? "default" : "outline"}
                            className="text-xs"
                          >
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAcceptSuggestion(suggestion)}
                      data-testid={`button-accept-suggestion-${idx}`}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Create New Mapping</label>
          <div className="flex gap-2">
            <Select
              value=""
              onValueChange={handleAddAlias}
            >
              <SelectTrigger
                className="flex-1"
                data-testid="select-person-for-alias"
              >
                <SelectValue placeholder="Select names to merge..." />
              </SelectTrigger>
              <SelectContent>
                {availablePeopleForSelection.map((person) => (
                  <SelectItem key={person} value={person}>
                    {person}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedAliases.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {selectedAliases.map((alias) => (
                <Badge
                  key={alias}
                  variant="secondary"
                  className="gap-1"
                >
                  {alias}
                  <button
                    onClick={() => handleRemoveSelectedAlias(alias)}
                    className="ml-1 hover:opacity-70"
                    data-testid={`button-remove-alias-${alias}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Canonical name (display name)"
                value={newCanonical}
                onChange={(e) => setNewCanonical(e.target.value)}
                onFocus={handleSetCanonicalFromSelection}
                data-testid="input-canonical-name"
              />
              <Button
                onClick={handleCreateMapping}
                disabled={!newCanonical || selectedAliases.length === 0}
                data-testid="button-create-alias"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create
              </Button>
            </div>
          </div>
        )}
      </div>

      {aliases.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Merge className="h-4 w-4" />
              Active Mappings
            </h4>
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {aliases.map((mapping, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-2 py-2 px-3 border rounded-md"
                    data-testid={`alias-mapping-${idx}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm mb-1">
                        {mapping.canonical}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {mapping.aliases.map((alias) => (
                          <Badge key={alias} variant="outline" className="text-xs">
                            {alias}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveMapping(idx)}
                      data-testid={`button-delete-mapping-${idx}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </>
      )}

      {people.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Upload CSV files to see people</p>
        </div>
      )}
    </div>
  );
}
