import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useParams } from "wouter";
import {
  ArrowLeft, Monitor, Smartphone, Tablet, Send, ExternalLink,
  Code as CodeIcon, Loader2, Download, Copy, Play, Camera,
  ShoppingBag, GitBranch, Rocket, CheckCircle2, XCircle,
  MessageSquare, Eye, X, Save,
} from "lucide-react";
import {
  useGetBuilderProject,
  useUpdateBuilderProject,
  getGetBuilderProjectQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { basicSetup } from "@codemirror/basic-setup";
import { html } from "@codemirror/lang-html";
import { oneDark } from "@codemirror/theme-one-dark";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import EcommercePanel from "@/components/EcommercePanel";
import WorkflowBuilder from "@/components/WorkflowBuilder";

type DeviceMode = "mobile" | "tablet" | "desktop";
type MobileTab = "chat" | "preview" | "code";
type DeployStatus = "idle" | "deploying" | "done" | "error";

// ── CodeEditor (CodeMirror 6) ──────────────────────────────────────────────────

function CodeEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorView | null>(null);
  const lastExternalRef = useRef(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current) return;
    const editor = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          html(),
          oneDark,
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              const newVal = update.state.doc.toString();
              lastExternalRef.current = newVal;
              onChangeRef.current(newVal);
            }
          }),
        ],
      }),
      parent: containerRef.current,
    });
    editorRef.current = editor;
    return () => {
      editor.destroy();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update editor when value changes from outside (streaming)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (lastExternalRef.current === value) return;
    lastExternalRef.current = value;
    const current = editor.state.doc.toString();
    if (current !== value) {
      editor.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto [&_.cm-editor]:h-full [&_.cm-scroller]:overflow-auto [&_.cm-editor.cm-focused]:outline-none"
    />
  );
}

// ── Save Snapshot Dialog ───────────────────────────────────────────────────────

function SaveSnapshotDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (label: string) => void;
}) {
  const [label, setLabel] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Save Snapshot</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="e.g., Before checkout redesign"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && label) { onSave(label); onOpenChange(false); setLabel(""); }}}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!label}
            onClick={() => { onSave(label); onOpenChange(false); setLabel(""); }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Deploy Dialog ──────────────────────────────────────────────────────────────

function DeployDialog({
  open,
  onOpenChange,
  status,
  url,
  message,
  onDeploy,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  status: DeployStatus;
  url?: string;
  message?: string;
  onDeploy: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Deploy to Vercel
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {status === "idle" && (
            <p className="text-sm text-muted-foreground">
              Deploy your project as a static site on Vercel. Requires a{" "}
              <code className="bg-muted px-1 rounded text-xs">VERCEL_TOKEN</code> in Replit Secrets.
            </p>
          )}
          {status === "deploying" && (
            <div className="space-y-3">
              {["Creating deployment…", "Building static files…", "Assigning domain…"].map((step, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary flex-none" />
                  <span className="text-muted-foreground">{step}</span>
                </div>
              ))}
            </div>
          )}
          {status === "done" && url && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium text-sm">Deployed successfully!</span>
              </div>
              <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
                <a href={url} target="_blank" rel="noreferrer" className="text-sm text-primary flex-1 truncate hover:underline">
                  {url}
                </a>
                <Button variant="ghost" size="icon" className="h-7 w-7 flex-none" onClick={() => navigator.clipboard.writeText(url)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 flex-none" asChild>
                  <a href={url} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
                </Button>
              </div>
            </div>
          )}
          {status === "error" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                <span className="font-medium text-sm">Deploy failed</span>
              </div>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">{message}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          {status === "idle" && <Button onClick={onDeploy}>Deploy Now</Button>}
          {status === "deploying" && <Button disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deploying…</Button>}
          {(status === "done" || status === "error") && (
            <div className="flex gap-2 w-full">
              {status === "error" && <Button onClick={onDeploy}>Retry</Button>}
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Quick prompts ──────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  "Build an e-commerce store",
  "Add a hero section",
  "Make it mobile responsive",
  "Add dark mode toggle",
  "Add a contact form",
  "Add navigation menu",
  "Add product cards",
  "Add a checkout page",
];

// ── Main Builder Component ────────────────────────────────────────────────────

export default function Builder() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: project, isLoading } = useGetBuilderProject(id ?? "");
  const updateProject = useUpdateBuilderProject();

  // ── Local state ──────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [localHtml, setLocalHtml] = useState("");
  const [streamingHtml, setStreamingHtml] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const [mobileTab, setMobileTab] = useState<MobileTab>("preview");
  const [showEcommerce, setShowEcommerce] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [showSnapshotDialog, setShowSnapshotDialog] = useState(false);
  const [showDeployDialog, setShowDeployDialog] = useState(false);
  const [deployStatus, setDeployStatus] = useState<DeployStatus>("idle");
  const [deployUrl, setDeployUrl] = useState<string | undefined>();
  const [deployMessage, setDeployMessage] = useState<string | undefined>();
  // E-commerce module enabled states — persisted to project.description JSON
  const [ecomModules, setEcomModules] = useState<Record<string, boolean>>({});

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  // Initialise from project data once
  useEffect(() => {
    if (project && messages.length === 0) {
      setMessages(
        (project.messages ?? []).map((m) => ({ role: m.role, content: m.content })),
      );
      if (!localHtml && project.htmlContent) {
        setLocalHtml(project.htmlContent);
      }
      // Hydrate e-commerce module states from persisted description JSON
      try {
        const meta = JSON.parse(project.description ?? "{}") as { _ecom?: Record<string, boolean> };
        if (meta._ecom) setEcomModules(meta._ecom);
      } catch {
        // plain-text description — no module config
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  // Live preview: show streaming HTML while generating, otherwise show saved
  const previewHtml = isStreaming && streamingHtml ? streamingHtml : localHtml;

  // ── SSE streaming send ────────────────────────────────────────────────────────

  const handleSend = useCallback(async (overridePrompt?: string) => {
    const text = (overridePrompt ?? prompt).trim();
    if (!text || !id || isStreaming) return;
    setPrompt("");
    setIsStreaming(true);
    setStreamingHtml("");
    setMobileTab("preview");

    setMessages((prev) => [...prev, { role: "user", content: text }]);

    try {
      const response = await fetch(`/api/builder/projects/${id}/generate-stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          currentHtml: localHtml,
          conversationHistory: messages.slice(-10),
        }),
      });

      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let buf = "";
      // Track SSE named-event type for current event block
      let currentEvent = "message";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (line === "") {
            // blank line resets event name after each event block
            currentEvent = "message";
            continue;
          }
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
            continue;
          }
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);

          if (data === "[DONE]") {
            // Stream fully terminated — ensure streaming state is cleared
            setIsStreaming(false);
            setStreamingHtml("");
            return;
          }

          if (currentEvent === "done") {
            // Final cleaned HTML from server
            try {
              const parsed = JSON.parse(data) as { html: string };
              setLocalHtml(parsed.html);
              setStreamingHtml("");
              setIsStreaming(false);
              setMessages((prev) => [...prev, { role: "assistant", content: `Generated: ${text}` }]);
              queryClient.invalidateQueries({ queryKey: getGetBuilderProjectQueryKey(id) });
            } catch {
              // fallback: use accumulated
              setLocalHtml(accumulated);
            }
            return;
          }

          if (currentEvent === "error") {
            try {
              const parsed = JSON.parse(data) as { error: string };
              setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${parsed.error}` }]);
            } catch {
              setMessages((prev) => [...prev, { role: "assistant", content: `Generation error` }]);
            }
            setIsStreaming(false);
            setStreamingHtml("");
            return;
          }

          // Default event = raw token (newlines were encoded as \n literal)
          const token = data.replace(/\\n/g, "\n");
          accumulated += token;
          setStreamingHtml(accumulated);
        }
      }

      // If stream ended without [DONE] / event:done (connection drop etc.)
      if (accumulated) {
        setLocalHtml(accumulated);
        setStreamingHtml("");
      }
      setIsStreaming(false);
    } catch (err) {
      setIsStreaming(false);
      setStreamingHtml("");
      setMessages((prev) => [...prev, { role: "assistant", content: `Failed: ${String(err)}` }]);
    }
  }, [prompt, id, isStreaming, localHtml, messages, queryClient]);

  // ── Persist e-commerce module toggle to project description JSON ─────────────
  const handleEcomToggle = useCallback((moduleId: string, enabled: boolean) => {
    if (!id) return;
    const next = { ...ecomModules, [moduleId]: enabled };
    setEcomModules(next);
    // Merge into project.description JSON (preserves existing _text)
    let descMeta: Record<string, unknown> = {};
    try {
      descMeta = JSON.parse(project?.description ?? "{}") as Record<string, unknown>;
    } catch {
      descMeta = { _text: project?.description ?? "" };
    }
    const updated = JSON.stringify({ ...descMeta, _ecom: next });
    updateProject.mutate({ id, data: { description: updated } });
  }, [id, ecomModules, project?.description, updateProject]);

  // ── Snapshot ──────────────────────────────────────────────────────────────────

  const handleSaveSnapshot = async (label: string) => {
    if (!id || !localHtml) return;
    await fetch(`/api/builder/projects/${id}/snapshots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, htmlContent: localHtml }),
    });
    queryClient.invalidateQueries({ queryKey: getGetBuilderProjectQueryKey(id) });
  };

  const handleRestoreSnapshot = async (snapshotId: string) => {
    if (!id) return;
    const res = await fetch(`/api/builder/projects/${id}/snapshots/${snapshotId}/restore`, {
      method: "POST",
    });
    const data = (await res.json()) as { htmlContent?: string };
    if (data.htmlContent) setLocalHtml(data.htmlContent);
    queryClient.invalidateQueries({ queryKey: getGetBuilderProjectQueryKey(id) });
  };

  // ── Deploy ────────────────────────────────────────────────────────────────────

  const handleDeploy = async () => {
    if (!id) return;
    setDeployStatus("deploying");
    setDeployUrl(undefined);
    setDeployMessage(undefined);
    try {
      const res = await fetch(`/api/builder/projects/${id}/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ htmlContent: localHtml }),
      });
      const data = (await res.json()) as { ok: boolean; url?: string; message?: string };
      if (data.ok && data.url) {
        setDeployStatus("done");
        setDeployUrl(data.url);
      } else {
        setDeployStatus("error");
        setDeployMessage(data.message ?? "Unknown error");
      }
    } catch (err) {
      setDeployStatus("error");
      setDeployMessage(String(err));
    }
  };

  const openDeployDialog = () => {
    setDeployStatus("idle");
    setDeployUrl(undefined);
    setDeployMessage(undefined);
    setShowDeployDialog(true);
  };

  // ── Utility ───────────────────────────────────────────────────────────────────

  const downloadHtml = () => {
    const blob = new Blob([localHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project?.name ?? "project"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Loading ───────────────────────────────────────────────────────────────────

  if (isLoading || !project) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Device preview dimensions ─────────────────────────────────────────────────

  const deviceFrameClass =
    deviceMode === "mobile"
      ? "w-[375px] h-[812px] rounded-[2.5rem] border-4"
      : deviceMode === "tablet"
        ? "w-[768px] max-h-full h-[1024px] rounded-2xl border-2"
        : "w-full h-full rounded-none border-0";

  // ── Snapshots from project data ───────────────────────────────────────────────

  const snapshots = project.snapshots ?? [];

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col overflow-hidden bg-background"
      style={{ height: "100dvh", paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* ── Header ── */}
      <header className="flex-none h-14 border-b bg-card px-3 flex items-center justify-between gap-2 shrink-0">
        {/* Left */}
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8 shrink-0">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <span className="font-semibold text-sm truncate max-w-[140px] sm:max-w-[220px]">{project.name}</span>
          {isStreaming && (
            <Badge variant="secondary" className="text-[10px] shrink-0 animate-pulse">
              Generating…
            </Badge>
          )}
        </div>

        {/* Center — device toggles (desktop only) */}
        <div className="hidden md:flex items-center bg-muted/60 rounded-lg p-0.5 gap-0.5">
          {(["mobile", "tablet", "desktop"] as DeviceMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setDeviceMode(mode)}
              className={`min-w-[44px] min-h-[36px] flex items-center justify-center rounded-md px-2 transition-colors ${
                deviceMode === mode ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {mode === "mobile" && <Smartphone className="h-4 w-4" />}
              {mode === "tablet" && <Tablet className="h-4 w-4" />}
              {mode === "desktop" && <Monitor className="h-4 w-4" />}
            </button>
          ))}
        </div>

        {/* Right — actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost" size="icon" className="h-9 w-9 hidden sm:flex"
            title="Save snapshot"
            onClick={() => setShowSnapshotDialog(true)}
          >
            <Camera className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" size="icon" className="h-9 w-9 hidden sm:flex"
            title="E-commerce modules"
            onClick={() => setShowEcommerce(true)}
          >
            <ShoppingBag className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" size="icon" className="h-9 w-9 hidden sm:flex"
            title="Workflow builder"
            onClick={() => setShowWorkflow(true)}
          >
            <GitBranch className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" size="icon" className="h-9 w-9"
            title="Download HTML"
            onClick={downloadHtml}
            disabled={!localHtml}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            className="h-9 hidden sm:flex gap-1.5"
            onClick={openDeployDialog}
            disabled={!localHtml}
          >
            <Rocket className="h-3.5 w-3.5" />
            Deploy
          </Button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── Chat Panel (left, desktop only) ── */}
        <div className={`
          flex-col border-r bg-card/50
          w-[300px] shrink-0
          hidden md:flex
          ${mobileTab === "chat" ? "!flex flex-col absolute inset-0 z-10 md:relative md:z-auto" : ""}
        `}>
          <ScrollArea className="flex-1 p-3" ref={chatScrollRef}>
            <div className="space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm px-4">
                  Describe what you want to build — e.g., <em>"Build an Alibaba-style marketplace"</em>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isStreaming && (
                <div className="flex justify-start">
                  <div className="chat-bubble-assistant flex gap-1 items-center py-3">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick prompts */}
          <div className="px-3 pt-2 flex flex-wrap gap-1">
            {QUICK_PROMPTS.slice(0, 4).map((qp) => (
              <button
                key={qp}
                onClick={() => handleSend(qp)}
                disabled={isStreaming}
                className="text-[10px] bg-muted hover:bg-secondary text-muted-foreground hover:text-foreground px-2 py-1 rounded-full transition-colors disabled:opacity-50"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t">
            <div className="relative">
              <textarea
                ref={promptRef}
                rows={2}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                placeholder="Message AIOS Builder…"
                disabled={isStreaming}
                className="w-full resize-none rounded-xl border bg-background px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 min-h-[44px]"
              />
              <button
                onClick={() => handleSend()}
                disabled={isStreaming || !prompt.trim()}
                className="absolute right-2 bottom-2 h-7 w-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                {isStreaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Preview Pane (center) ── */}
        <div className={`
          flex-1 bg-muted/30 flex flex-col min-w-0 overflow-hidden
          ${mobileTab !== "preview" ? "hidden md:flex" : "flex"}
        `}>
          {/* Preview toolbar */}
          <div className="flex-none flex items-center justify-between px-3 py-1.5 border-b bg-card/80 backdrop-blur">
            <div className="flex items-center gap-1.5">
              <div className="flex gap-1">
                <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <span className="w-3 h-3 rounded-full bg-[#28CA41]" />
              </div>
              <span className="text-xs text-muted-foreground ml-1 hidden sm:block">
                {deviceMode === "mobile" ? "375px" : deviceMode === "tablet" ? "768px" : "Full width"}
              </span>
            </div>
            {localHtml && (
              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                <a href={URL.createObjectURL(new Blob([localHtml], { type: "text/html" }))} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            )}
          </div>

          {/* Iframe frame */}
          <div className="flex-1 p-4 md:p-6 flex items-start justify-center overflow-auto">
            <div
              className={`
                relative bg-white overflow-hidden shadow-lg transition-all duration-300 ease-out
                ${deviceFrameClass}
              `}
              style={
                deviceMode === "mobile"
                  ? { maxHeight: "calc(100dvh - 10rem)" }
                  : deviceMode === "tablet"
                    ? { maxHeight: "calc(100dvh - 8rem)" }
                    : { height: "100%", minHeight: "100%" }
              }
            >
              {/* Mobile notch */}
              {deviceMode === "mobile" && (
                <div className="absolute top-0 inset-x-0 h-8 bg-background/95 z-10 flex justify-center items-end pb-1">
                  <div className="w-28 h-5 bg-black rounded-b-2xl" />
                </div>
              )}

              {isStreaming && streamingHtml && (
                <div className="absolute top-2 right-2 z-20">
                  <Badge variant="secondary" className="text-[9px] animate-pulse">Live</Badge>
                </div>
              )}

              {!previewHtml ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-3 bg-muted/20">
                  <CodeIcon className="h-10 w-10 opacity-20" />
                  <p className="text-sm">Type a prompt to generate your website</p>
                </div>
              ) : (
                <iframe
                  srcDoc={previewHtml}
                  className={`w-full border-0 bg-white ${deviceMode === "mobile" ? "pt-8 h-full" : "h-full"}`}
                  sandbox="allow-scripts allow-same-origin"
                  title="Preview"
                />
              )}
            </div>
          </div>
        </div>

        {/* ── Code + Snapshots Panel (right) ── */}
        <div className={`
          flex flex-col border-l bg-[#1e1e1e] text-[#d4d4d4]
          w-[380px] shrink-0
          hidden lg:flex
          ${mobileTab === "code" ? "!flex flex-col absolute inset-0 z-10 md:relative md:z-auto" : ""}
        `}>
          <Tabs defaultValue="code" className="flex flex-col h-full overflow-hidden">
            <div className="flex-none flex items-center justify-between border-b border-[#333] bg-[#252526] px-1">
              <TabsList className="bg-transparent h-10 p-0 border-0 gap-0">
                <TabsTrigger
                  value="code"
                  className="data-[state=active]:bg-[#1e1e1e] data-[state=active]:text-white text-gray-400 rounded-none border-t-2 border-transparent data-[state=active]:border-blue-500 h-10 px-3 text-xs"
                >
                  <CodeIcon className="h-3.5 w-3.5 mr-1.5" />index.html
                </TabsTrigger>
                <TabsTrigger
                  value="snapshots"
                  className="data-[state=active]:bg-[#1e1e1e] data-[state=active]:text-white text-gray-400 rounded-none border-t-2 border-transparent data-[state=active]:border-blue-500 h-10 px-3 text-xs"
                >
                  <Camera className="h-3.5 w-3.5 mr-1.5" />Snapshots ({snapshots.length})
                </TabsTrigger>
              </TabsList>
              <div className="flex gap-1 pr-2">
                <button
                  className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  onClick={() => navigator.clipboard.writeText(localHtml)}
                  title="Copy code"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  onClick={downloadHtml}
                  title="Download"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  onClick={() => setShowSnapshotDialog(true)}
                  title="Save snapshot"
                >
                  <Save className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <TabsContent value="code" className="flex-1 m-0 p-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col">
              <CodeEditor value={previewHtml} onChange={setLocalHtml} />
            </TabsContent>

            <TabsContent value="snapshots" className="flex-1 m-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col">
              <ScrollArea className="flex-1 p-3">
                {snapshots.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 text-xs">
                    No snapshots yet. Click <Camera className="inline h-3 w-3" /> to save a version.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {snapshots.map((snap) => (
                      <div key={snap.id} className="rounded-lg border border-[#333] p-3 hover:border-[#555] transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-white truncate">{snap.label}</div>
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              {formatDistanceToNow(new Date(snap.createdAt), { addSuffix: true })}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRestoreSnapshot(snap.id)}
                            className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded transition-colors shrink-0"
                          >
                            Restore
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      <div className="md:hidden flex-none flex items-center justify-around border-t bg-card h-16 shrink-0" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {([
          { id: "chat", icon: <MessageSquare className="h-5 w-5" />, label: "Chat" },
          { id: "preview", icon: <Eye className="h-5 w-5" />, label: "Preview" },
          { id: "code", icon: <CodeIcon className="h-5 w-5" />, label: "Code" },
        ] as { id: MobileTab; icon: React.ReactNode; label: string }[]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id)}
            className={`flex flex-col items-center gap-1 py-2 px-4 min-w-[64px] transition-colors ${
              mobileTab === tab.id ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {tab.icon}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Mobile chat pane ── */}
      {mobileTab === "chat" && (
        <div className="md:hidden absolute inset-0 z-20 bg-background flex flex-col" style={{ top: "3.5rem", bottom: "4rem" }}>
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Describe what you want to build…
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isStreaming && (
                <div className="flex justify-start">
                  <div className="chat-bubble-assistant flex gap-1 items-center py-3">
                    <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="flex flex-wrap gap-1 px-3 py-1">
            {QUICK_PROMPTS.slice(0, 3).map((qp) => (
              <button key={qp} onClick={() => handleSend(qp)} disabled={isStreaming}
                className="text-[10px] bg-muted text-muted-foreground px-2 py-1 rounded-full">
                {qp}
              </button>
            ))}
          </div>
          <div className="p-3 border-t">
            <div className="relative">
              <textarea
                rows={2}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                placeholder="Message AIOS Builder…"
                disabled={isStreaming}
                className="w-full resize-none rounded-xl border bg-background px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 min-h-[44px]"
              />
              <button
                onClick={() => handleSend()}
                disabled={isStreaming || !prompt.trim()}
                className="absolute right-2 bottom-2 h-7 w-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40"
              >
                {isStreaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile code pane ── */}
      {mobileTab === "code" && (
        <div className="md:hidden absolute inset-0 z-20 bg-[#1e1e1e] flex flex-col" style={{ top: "3.5rem", bottom: "4rem" }}>
          <div className="flex-none flex items-center justify-between h-10 px-3 border-b border-[#333] bg-[#252526]">
            <span className="text-xs text-gray-400">index.html</span>
            <button onClick={() => navigator.clipboard.writeText(localHtml)} className="p-1 rounded hover:bg-white/10 text-gray-400">
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <CodeEditor value={localHtml} onChange={setLocalHtml} />
          </div>
        </div>
      )}

      {/* ── Overlays ── */}
      <SaveSnapshotDialog
        open={showSnapshotDialog}
        onOpenChange={setShowSnapshotDialog}
        onSave={handleSaveSnapshot}
      />

      <DeployDialog
        open={showDeployDialog}
        onOpenChange={setShowDeployDialog}
        status={deployStatus}
        url={deployUrl}
        message={deployMessage}
        onDeploy={handleDeploy}
      />

      {showEcommerce && (
        <EcommercePanel
          projectId={id ?? ""}
          initialEnabled={ecomModules}
          onHtmlUpdate={(html) => {
            setLocalHtml(html);
            updateProject.mutate({ id: id ?? "", data: { htmlContent: html } });
          }}
          onToggle={handleEcomToggle}
          onClose={() => setShowEcommerce(false)}
        />
      )}

      {showWorkflow && (
        <WorkflowBuilder
          projectId={id ?? ""}
          onClose={() => setShowWorkflow(false)}
        />
      )}
    </div>
  );
}
