import { useCallback, useState } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Download, Zap, GitBranch, ArrowRight, Plus, X } from "lucide-react";

// ── Custom node types ──────────────────────────────────────────────────────────

function TriggerNode({ data }: NodeProps) {
  return (
    <div className="min-w-[160px] rounded-xl border-2 border-teal-400 bg-teal-50 p-3 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Zap className="h-3.5 w-3.5 text-teal-600" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-600">Trigger</span>
      </div>
      <div className="text-sm font-medium text-teal-900">{data.label}</div>
      <Handle type="source" position={Position.Bottom} className="!bg-teal-400 !w-3 !h-3" />
    </div>
  );
}

function ActionNode({ data }: NodeProps) {
  return (
    <div className="min-w-[160px] rounded-xl border-2 border-blue-400 bg-blue-50 p-3 shadow-sm">
      <Handle type="target" position={Position.Top} className="!bg-blue-400 !w-3 !h-3" />
      <div className="flex items-center gap-2 mb-1">
        <ArrowRight className="h-3.5 w-3.5 text-blue-600" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">Action</span>
      </div>
      <div className="text-sm font-medium text-blue-900">{data.label}</div>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-400 !w-3 !h-3" />
    </div>
  );
}

function ConditionNode({ data }: NodeProps) {
  return (
    <div className="min-w-[160px] rounded-xl border-2 border-amber-400 bg-amber-50 p-3 shadow-sm">
      <Handle type="target" position={Position.Top} className="!bg-amber-400 !w-3 !h-3" />
      <div className="flex items-center gap-2 mb-1">
        <GitBranch className="h-3.5 w-3.5 text-amber-600" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">Condition</span>
      </div>
      <div className="text-sm font-medium text-amber-900">{data.label}</div>
      <Handle type="source" position={Position.Right} id="yes" className="!bg-green-400 !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} id="no" className="!bg-red-400 !w-3 !h-3" />
    </div>
  );
}

const nodeTypes = { trigger: TriggerNode, action: ActionNode, condition: ConditionNode };

// ── Pre-built templates ────────────────────────────────────────────────────────

const TEMPLATES: Record<string, { nodes: Node[]; edges: Edge[] }> = {
  "Abandoned Cart Recovery": {
    nodes: [
      { id: "t1", type: "trigger", position: { x: 200, y: 40 }, data: { label: "Cart abandoned (2h)" } },
      { id: "c1", type: "condition", position: { x: 200, y: 160 }, data: { label: "Order value > $50?" } },
      { id: "a1", type: "action", position: { x: 80, y: 300 }, data: { label: "Send coupon email" } },
      { id: "a2", type: "action", position: { x: 320, y: 300 }, data: { label: "Send reminder email" } },
      { id: "a3", type: "action", position: { x: 200, y: 420 }, data: { label: "Mark campaign sent" } },
    ],
    edges: [
      { id: "e1", source: "t1", target: "c1" },
      { id: "e2", source: "c1", target: "a1", sourceHandle: "yes", label: "Yes" },
      { id: "e3", source: "c1", target: "a2", sourceHandle: "no", label: "No" },
      { id: "e4", source: "a1", target: "a3" },
      { id: "e5", source: "a2", target: "a3" },
    ],
  },
  "Low Stock Alert": {
    nodes: [
      { id: "t1", type: "trigger", position: { x: 200, y: 40 }, data: { label: "Inventory check (daily)" } },
      { id: "c1", type: "condition", position: { x: 200, y: 160 }, data: { label: "Stock < 10 units?" } },
      { id: "a1", type: "action", position: { x: 80, y: 300 }, data: { label: "Email supplier" } },
      { id: "a2", type: "action", position: { x: 320, y: 300 }, data: { label: "Notify team Slack" } },
    ],
    edges: [
      { id: "e1", source: "t1", target: "c1" },
      { id: "e2", source: "c1", target: "a1", sourceHandle: "yes", label: "Yes" },
      { id: "e3", source: "c1", target: "a2", sourceHandle: "yes" },
    ],
  },
  "Order Confirmation": {
    nodes: [
      { id: "t1", type: "trigger", position: { x: 200, y: 40 }, data: { label: "Order placed" } },
      { id: "a1", type: "action", position: { x: 80, y: 180 }, data: { label: "Send confirmation email" } },
      { id: "a2", type: "action", position: { x: 320, y: 180 }, data: { label: "Update inventory" } },
      { id: "a3", type: "action", position: { x: 200, y: 320 }, data: { label: "Notify fulfilment team" } },
    ],
    edges: [
      { id: "e1", source: "t1", target: "a1" },
      { id: "e2", source: "t1", target: "a2" },
      { id: "e3", source: "a1", target: "a3" },
      { id: "e4", source: "a2", target: "a3" },
    ],
  },
};

// ── Palette items ──────────────────────────────────────────────────────────────

const PALETTE = [
  { type: "trigger", label: "Order Placed", color: "teal" },
  { type: "trigger", label: "User Signup", color: "teal" },
  { type: "trigger", label: "Schedule (daily)", color: "teal" },
  { type: "action", label: "Send Email", color: "blue" },
  { type: "action", label: "Send SMS", color: "blue" },
  { type: "action", label: "Update Record", color: "blue" },
  { type: "action", label: "Webhook", color: "blue" },
  { type: "condition", label: "If / Else", color: "amber" },
  { type: "condition", label: "Check Stock", color: "amber" },
];

let nodeIdCounter = 100;

interface WorkflowBuilderProps {
  projectId: string;
  onClose: () => void;
}

export default function WorkflowBuilder({ projectId, onClose }: WorkflowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(TEMPLATES["Order Confirmation"].nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(TEMPLATES["Order Confirmation"].edges);
  const [template, setTemplate] = useState("Order Confirmation");
  const [runLog, setRunLog] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  const loadTemplate = (name: string) => {
    const t = TEMPLATES[name];
    if (t) {
      setNodes(t.nodes);
      setEdges(t.edges);
      setTemplate(name);
      setRunLog([]);
    }
  };

  const addNode = (type: string, label: string) => {
    nodeIdCounter++;
    const newNode: Node = {
      id: `n${nodeIdCounter}`,
      type,
      position: { x: 200 + Math.random() * 100, y: 80 + Math.random() * 200 },
      data: { label },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setRunLog(["Running workflow..."]);
    try {
      const res = await fetch(`/api/builder/projects/${projectId}/workflow-run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges }),
      });
      const data = (await res.json()) as { ok: boolean; log?: string[] };
      if (data.ok && data.log) {
        setRunLog(data.log);
      } else {
        setRunLog(["Workflow run failed."]);
      }
    } catch (err) {
      setRunLog([`Error: ${err}`]);
    }
    setIsRunning(false);
  };

  const handleExport = () => {
    const json = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workflow.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex-none h-14 border-b bg-card flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
          <span className="font-semibold">Workflow Builder</span>
          <Badge variant="secondary" className="text-[10px]">Beta</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Select value={template} onValueChange={loadTemplate}>
            <SelectTrigger className="w-52 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(TEMPLATES).map((t) => (
                <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExport} className="h-8">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export
          </Button>
          <Button size="sm" onClick={handleRun} disabled={isRunning} className="h-8">
            <Play className="h-3.5 w-3.5 mr-1.5" />
            Run
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Palette sidebar */}
        <div className="w-48 border-r bg-card/60 flex flex-col flex-none">
          <div className="p-3 border-b">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nodes</p>
          </div>
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-1">
              {PALETTE.map((item, i) => (
                <button
                  key={i}
                  onClick={() => addNode(item.type, item.label)}
                  className={`w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-muted ${
                    item.color === "teal" ? "text-teal-700" : item.color === "blue" ? "text-blue-700" : "text-amber-700"
                  }`}
                >
                  <Plus className="h-3 w-3 flex-none" />
                  {item.label}
                </button>
              ))}
            </div>
          </ScrollArea>
          {runLog.length > 0 && (
            <div className="border-t p-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Run Log</p>
              <div className="space-y-0.5">
                {runLog.map((line, i) => (
                  <p key={i} className="text-[10px] text-muted-foreground font-mono leading-relaxed">{line}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background color="#D2D2D7" gap={24} size={1} />
            <Controls />
            <MiniMap nodeStrokeWidth={3} zoomable pannable />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
