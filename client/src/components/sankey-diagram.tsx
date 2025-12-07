import { useEffect, useRef, useState, useMemo, forwardRef, useImperativeHandle } from "react";
import { sankey, sankeyLinkHorizontal, SankeyNode, SankeyLink } from "d3-sankey";
import { ZoomIn, ZoomOut, RotateCcw, Download, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { SankeyData, SankeyLink as SchemaLink } from "@shared/schema";

const SUPERHEROES = [
  "Batman", "Superman", "Wonder Woman", "Spider-Man", "Iron Man",
  "Thor", "Hulk", "Black Widow", "Captain America", "Black Panther",
  "Aquaman", "Flash", "Green Lantern", "Wolverine", "Deadpool",
  "Doctor Strange", "Ant-Man", "Hawkeye", "Scarlet Witch", "Vision",
  "Cyborg", "Shazam", "Supergirl", "Batgirl", "Nightwing",
  "Robin", "Beast Boy", "Starfire", "Raven", "Green Arrow"
];

function getSuperheroForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash = hash & hash;
  }
  return SUPERHEROES[Math.abs(hash) % SUPERHEROES.length];
}

function getSuperheroInitials(hero: string): string {
  return hero.split(/[\s-]+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function getSuperheroColor(hero: string): string {
  const colors: Record<string, string> = {
    "Batman": "#1a1a2e", "Superman": "#0066cc", "Wonder Woman": "#cc0000",
    "Spider-Man": "#cc0000", "Iron Man": "#b8860b", "Thor": "#4169e1",
    "Hulk": "#228b22", "Black Widow": "#2f2f2f", "Captain America": "#0047ab",
    "Black Panther": "#2d2d2d", "Aquaman": "#00ced1", "Flash": "#dc143c",
    "Green Lantern": "#00ff00", "Wolverine": "#ffd700", "Deadpool": "#8b0000",
    "Doctor Strange": "#8b008b", "Ant-Man": "#dc143c", "Hawkeye": "#4b0082",
    "Scarlet Witch": "#dc143c", "Vision": "#228b22", "Cyborg": "#4682b4",
    "Shazam": "#ffd700", "Supergirl": "#0066cc", "Batgirl": "#4b0082",
    "Nightwing": "#1e90ff", "Robin": "#dc143c", "Beast Boy": "#228b22",
    "Starfire": "#ff8c00", "Raven": "#4b0082", "Green Arrow": "#228b22"
  };
  return colors[hero] || "#666666";
}

interface SankeyDiagramProps {
  data: SankeyData;
  onNodeClick?: (nodeName: string) => void;
}

export interface SankeyDiagramHandle {
  getSvgElement: () => SVGSVGElement | null;
}

interface NodeExtra {
  name: string;
}

interface LinkExtra {
  value: number;
}

type SNode = SankeyNode<NodeExtra, LinkExtra>;
type SLink = SankeyLink<NodeExtra, LinkExtra>;

const FLOW_COLOR_POSITIVE = "hsl(142, 76%, 36%)";
const FLOW_COLOR_NEGATIVE = "hsl(0, 72%, 51%)";

export const SankeyDiagram = forwardRef<SankeyDiagramHandle, SankeyDiagramProps>(
  function SankeyDiagram({ data, onNodeClick }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [legendOpen, setLegendOpen] = useState(true);

  useImperativeHandle(ref, () => ({
    getSvgElement: () => svgRef.current,
  }));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({
        width: Math.max(width - 32, 400),
        height: Math.max(height - 80, 400),
      });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const sankeyData = useMemo(() => {
    if (!data.nodes.length || !data.links.length) return null;

    const nodesCopy = data.nodes.map((n) => ({ ...n }));
    const linksCopy = data.links.map((l) => ({ ...l }));

    const validLinks = linksCopy.filter(
      (l) => l.source !== l.target && l.value > 0
    );

    if (validLinks.length === 0) return null;

    const sankeyGenerator = sankey<NodeExtra, LinkExtra>()
      .nodeWidth(16)
      .nodePadding(12)
      .extent([
        [20, 20],
        [dimensions.width - 20, dimensions.height - 20],
      ]);

    try {
      return sankeyGenerator({
        nodes: nodesCopy,
        links: validLinks,
      });
    } catch {
      return null;
    }
  }, [data, dimensions]);

  const superheroMap = useMemo(() => {
    const map = new Map<string, { hero: string; initials: string; color: string }>();
    data.nodes.forEach((node) => {
      const hero = getSuperheroForName(node.name);
      map.set(node.name, {
        hero,
        initials: getSuperheroInitials(hero),
        color: getSuperheroColor(hero),
      });
    });
    return map;
  }, [data.nodes]);

  const handleZoomIn = () => {
    setTransform((t) => ({ ...t, k: Math.min(t.k * 1.2, 4) }));
  };

  const handleZoomOut = () => {
    setTransform((t) => ({ ...t, k: Math.max(t.k / 1.2, 0.25) }));
  };

  const handleReset = () => {
    setTransform({ k: 1, x: 0, y: 0 });
  };

  const handleExport = () => {
    const svg = svgRef.current;
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = "venmo-flow-diagram.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  if (!data.nodes.length || !data.links.length) {
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
              <path d="M4 4h5v5H4z" />
              <path d="M15 4h5v5h-5z" />
              <path d="M4 15h5v5H4z" />
              <path d="M15 15h5v5h-5z" />
              <path d="M9 6.5h6" />
              <path d="M9 17.5h6" />
              <path d="M6.5 9v6" />
              <path d="M17.5 9v6" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">No Data to Display</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Upload Venmo CSV files to visualize the flow of money between people.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!sankeyData) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">Unable to generate diagram - check your data format</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div ref={containerRef} className="h-full flex flex-col">
      <div className="flex items-center justify-between gap-2 p-4 border-b shrink-0">
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleZoomIn}
                data-testid="button-zoom-in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom In</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleZoomOut}
                data-testid="button-zoom-out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom Out</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleReset}
                data-testid="button-reset-view"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset View</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
              >
                <Info className="h-3 w-3 mr-1" />
                Click nodes to filter
              </Button>
            </TooltipTrigger>
            <TooltipContent>Click on a person to filter the transactions table</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleExport}
                data-testid="button-export-svg"
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export as SVG</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="flex-1 overflow-hidden bg-background relative">
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="w-full h-full"
            data-testid="sankey-svg"
          >
            <g
              transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}
            >
              <g className="links">
                {sankeyData.links.map((link, i) => {
                  const sourceNode = link.source as SNode;
                  const targetNode = link.target as SNode;
                  const isHighlighted =
                    hoveredNode === sourceNode.name ||
                    hoveredNode === targetNode.name;
                  
                  const originalLink = data.links[i];
                  const sentiment = originalLink?.sentiment || "positive";
                  const linkColor = sentiment === "positive" ? FLOW_COLOR_POSITIVE : FLOW_COLOR_NEGATIVE;

                  return (
                    <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        <path
                          d={sankeyLinkHorizontal()(link as any) || ""}
                          fill="none"
                          stroke={linkColor}
                          strokeWidth={Math.max(1, (link as SLink).width || 1)}
                          strokeOpacity={isHighlighted ? 0.8 : hoveredNode ? 0.15 : 0.5}
                          className="transition-opacity duration-200 cursor-pointer"
                          data-testid={`link-${sourceNode.name}-${targetNode.name}`}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm">
                          <p className="font-medium">
                            {sourceNode.name} → {targetNode.name}
                          </p>
                          <p className="font-mono">{formatCurrency(link.value)}</p>
                          <p className="text-xs text-muted-foreground">
                            {sentiment === "positive" ? "Received" : "Sent"}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </g>

              <g className="nodes">
                {sankeyData.nodes.map((node, i) => {
                  const sNode = node as SNode;
                  const isHighlighted = hoveredNode === sNode.name;
                  const heroInfo = superheroMap.get(sNode.name) || { hero: "Unknown", initials: "?", color: "#888" };
                  const x0 = sNode.x0 ?? 0;
                  const x1 = sNode.x1 ?? 0;
                  const y0 = sNode.y0 ?? 0;
                  const y1 = sNode.y1 ?? 0;
                  
                  const isLeftSide = x0 < dimensions.width / 2;
                  const avatarRadius = 10;
                  const avatarX = isLeftSide ? x1 + 8 + avatarRadius : x0 - 8 - avatarRadius;
                  const avatarY = (y0 + y1) / 2;
                  const textX = isLeftSide ? x1 + 8 + avatarRadius * 2 + 6 : x0 - 8 - avatarRadius * 2 - 6;

                  return (
                    <g
                      key={i}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredNode(sNode.name)}
                      onMouseLeave={() => setHoveredNode(null)}
                      onClick={() => onNodeClick?.(sNode.name)}
                      data-testid={`node-${sNode.name}`}
                    >
                      <rect
                        x={x0}
                        y={y0}
                        width={x1 - x0}
                        height={Math.max(1, y1 - y0)}
                        fill={heroInfo.color}
                        opacity={isHighlighted ? 1 : hoveredNode ? 0.4 : 0.9}
                        rx={2}
                        className="transition-opacity duration-200"
                      />
                      <circle
                        cx={avatarX}
                        cy={avatarY}
                        r={avatarRadius}
                        fill={heroInfo.color}
                        opacity={isHighlighted ? 1 : hoveredNode ? 0.4 : 0.9}
                        className="transition-opacity duration-200"
                      />
                      <text
                        x={avatarX}
                        y={avatarY}
                        dy="0.35em"
                        textAnchor="middle"
                        className="text-[8px] fill-white font-bold pointer-events-none"
                        opacity={isHighlighted ? 1 : hoveredNode ? 0.4 : 0.9}
                      >
                        {heroInfo.initials}
                      </text>
                      <text
                        x={textX}
                        y={avatarY}
                        dy="0.35em"
                        textAnchor={isLeftSide ? "start" : "end"}
                        className="text-xs fill-foreground font-medium pointer-events-none"
                        opacity={isHighlighted ? 1 : hoveredNode ? 0.4 : 0.9}
                      >
                        {sNode.name}
                      </text>
                    </g>
                  );
                })}
              </g>
            </g>
          </svg>
        </div>

        {data.nodes.length > 0 && (
          <div className="w-48 border-l shrink-0 bg-background">
            <Collapsible open={legendOpen} onOpenChange={setLegendOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between rounded-none border-b h-10 px-3"
                  data-testid="button-toggle-legend"
                >
                  <span className="text-xs font-medium">Legend</span>
                  <span className="text-xs text-muted-foreground">
                    {legendOpen ? "Hide" : "Show"}
                  </span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ScrollArea className="h-80">
                  <div className="p-3 space-y-1">
                    {data.nodes.map((node) => {
                      const heroInfo = superheroMap.get(node.name) || { hero: "Unknown", initials: "?", color: "#888" };
                      return (
                        <button
                          key={node.name}
                          className={`w-full flex items-center gap-2 p-2 rounded-md text-left text-xs transition-colors hover-elevate ${
                            hoveredNode === node.name ? "bg-accent" : ""
                          }`}
                          onMouseEnter={() => setHoveredNode(node.name)}
                          onMouseLeave={() => setHoveredNode(null)}
                          onClick={() => onNodeClick?.(node.name)}
                          data-testid={`legend-item-${node.name}`}
                        >
                          <div
                            className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[7px] font-bold text-white"
                            style={{ backgroundColor: heroInfo.color }}
                          >
                            {heroInfo.initials}
                          </div>
                          <span className="truncate">{node.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </div>
    </div>
  );
});
