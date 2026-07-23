"use client";

import React, { useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { IntelligenceNode, IntelligenceEdge } from "@/lib/api";
import { Search, Filter, Layers, Code2, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface DependencyGraphProps {
  nodes: IntelligenceNode[];
  edges: IntelligenceEdge[];
  onSelectFile?: (path: string) => void;
}

// Custom Node Component for React Flow
const CustomFileNode = ({ data }: { data: IntelligenceNode & { isSelected?: boolean } }) => {
  const getRiskBorder = (score: number) => {
    if (score >= 50) return "border-red-500/80 shadow-red-500/20 bg-red-950/20";
    if (score >= 20) return "border-amber-500/80 shadow-amber-500/20 bg-amber-950/20";
    return "border-emerald-500/30 bg-card";
  };

  const getLangBadge = (lang: string) => {
    switch (lang.toLowerCase()) {
      case "typescript":
      case "ts":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "javascript":
      case "js":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "go":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
      case "python":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      default:
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    }
  };

  return (
    <div
      className={cn(
        "px-3 py-2 rounded-xl border backdrop-blur-md shadow-lg min-w-[180px] max-w-[240px] transition-all hover:scale-105",
        getRiskBorder(data.riskScore),
        data.isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary !w-2 !h-2" />
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 truncate">
          <Code2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="font-semibold text-xs text-foreground truncate" title={data.path}>
            {data.label}
          </span>
        </div>
        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border font-mono font-medium", getLangBadge(data.language))}>
          {data.language}
        </span>
      </div>

      <div className="text-[10px] text-muted-foreground font-mono truncate mb-2">
        {data.package}
      </div>

      <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-border/40 text-[10px] text-muted-foreground font-mono">
        <div>
          <span className="block text-[9px] text-muted-foreground/70">LOC</span>
          <span className="font-medium text-foreground">{data.linesOfCode}</span>
        </div>
        <div>
          <span className="block text-[9px] text-muted-foreground/70">COMP</span>
          <span className={cn("font-medium", data.cyclomaticComplexity > 10 ? "text-amber-400" : "text-foreground")}>
            {data.cyclomaticComplexity}
          </span>
        </div>
        <div>
          <span className="block text-[9px] text-muted-foreground/70">MAINT</span>
          <span className={cn("font-medium", data.maintainabilityIndex < 60 ? "text-red-400" : "text-emerald-400")}>
            {Math.round(data.maintainabilityIndex)}
          </span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-2 !h-2" />
    </div>
  );
};

const nodeTypes = {
  fileNode: CustomFileNode,
};

export function DependencyGraph({ nodes, edges, onSelectFile }: DependencyGraphProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<string>("all");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const packages = useMemo(() => {
    const pkgs = new Set<string>();
    nodes.forEach((n) => pkgs.add(n.package));
    return Array.from(pkgs).sort();
  }, [nodes]);

  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const matchesSearch =
        node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.path.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPkg = selectedPackage === "all" || node.package === selectedPackage;
      return matchesSearch && matchesPkg;
    });
  }, [nodes, searchQuery, selectedPackage]);

  const initialFlowNodes: Node[] = useMemo(() => {
    // Layout nodes in a grid grouped by package
    const packageGroups: { [pkg: string]: IntelligenceNode[] } = {};
    filteredNodes.forEach((n) => {
      if (!packageGroups[n.package]) packageGroups[n.package] = [];
      packageGroups[n.package].push(n);
    });

    const flowNodes: Node[] = [];
    let groupX = 50;

    Object.entries(packageGroups).forEach(([, groupNodes]) => {
      const nodeY = 50;
      const cols = 2;
      groupNodes.forEach((n, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        flowNodes.push({
          id: n.id,
          type: "fileNode",
          position: {
            x: groupX + col * 260,
            y: nodeY + row * 140,
          },
          data: {
            ...n,
            isSelected: selectedNodeId === n.id,
          },
        });
      });
      groupX += cols * 260 + 120;
    });

    return flowNodes;
  }, [filteredNodes, selectedNodeId]);

  const initialFlowEdges: Edge[] = useMemo(() => {
    const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
    return edges
      .filter((e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target))
      .map((e, idx) => ({
        id: `e-${idx}-${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        animated: true,
        style: { stroke: "#6366f1", strokeWidth: 1.5, opacity: 0.6 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#6366f1",
          width: 12,
          height: 12,
        },
      }));
  }, [edges, filteredNodes]);

  const [flowNodes, setNodes, onNodesChange] = useNodesState(initialFlowNodes);
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(initialFlowEdges);

  React.useEffect(() => {
    setNodes(initialFlowNodes);
    setEdges(initialFlowEdges);
  }, [initialFlowNodes, initialFlowEdges, setNodes, setEdges]);

  return (
    <div className="w-full h-full flex flex-col bg-background relative overflow-hidden">
      {/* Controls Bar */}
      <div className="p-3 border-b bg-card/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search file or module..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-muted/60 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary w-48 lg:w-64"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-muted/60 border rounded-lg px-2 py-1">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={selectedPackage}
              onChange={(e) => setSelectedPackage(e.target.value)}
              className="bg-transparent text-xs text-foreground focus:outline-none"
            >
              <option value="all">All Packages ({packages.length})</option>
              {packages.map((pkg) => (
                <option key={pkg} value={pkg}>
                  {pkg}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-indigo-400" />
            <span>{filteredNodes.length} Nodes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-primary" />
            <span>{flowEdges.length} Dependencies</span>
          </div>
        </div>
      </div>

      {/* React Flow Container */}
      <div className="flex-1 w-full h-full bg-slate-950/40 relative">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => {
            setSelectedNodeId(node.id);
            if (onSelectFile) onSelectFile(node.data.path as string);
          }}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2}
          defaultEdgeOptions={{ type: "smoothstep" }}
        >
          <Background color="#334155" gap={24} size={1} />
          <Controls className="!bg-card !border-border !fill-foreground !rounded-lg" />
          <MiniMap
            className="!bg-card/90 !border-border !rounded-lg"
            nodeColor={(n) => {
              const risk = (n.data?.riskScore as number) || 0;
              if (risk >= 50) return "#ef4444";
              if (risk >= 20) return "#f59e0b";
              return "#10b981";
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
