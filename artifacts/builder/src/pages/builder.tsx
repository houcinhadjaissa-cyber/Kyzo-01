import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Link, useParams } from "wouter";
import { 
  ArrowLeft, Monitor, Smartphone, Tablet, TerminalSquare, 
  Send, RefreshCw, ExternalLink, Code as CodeIcon, Loader2, Download, Copy, Play
} from "lucide-react";
import { 
  useGetBuilderProject, 
  useUpdateBuilderProject, 
  useGenerateBuilderCode,
  getGetBuilderProjectQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export default function Builder() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  
  const { data: project, isLoading } = useGetBuilderProject(id || "");
  const updateProject = useUpdateBuilderProject();
  const generateCode = useGenerateBuilderCode();
  
  const [prompt, setPrompt] = useState("");
  const [deviceMode, setDeviceMode] = useState<"mobile"|"tablet"|"desktop">("desktop");
  const [activeTab, setActiveTab] = useState("preview"); // for mobile
  
  const [localHtml, setLocalHtml] = useState("");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Sync local HTML when project loads
  useEffect(() => {
    if (project?.htmlContent && !localHtml) {
      setLocalHtml(project.htmlContent);
    }
  }, [project?.htmlContent]);

  // Create/update blob URL whenever localHtml changes and is applied
  useEffect(() => {
    if (!localHtml) return;
    
    const blob = new Blob([localHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    
    return () => URL.revokeObjectURL(url);
  }, [localHtml]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [project?.messages, generateCode.isPending]);

  const handleSend = () => {
    if (!prompt.trim() || !id) return;
    
    const currentPrompt = prompt;
    setPrompt("");
    
    // Optimistic update for UI could be done here
    
    generateCode.mutate({
      id,
      data: {
        prompt: currentPrompt,
        currentHtml: localHtml || project?.htmlContent || undefined,
        // map history to required format
        conversationHistory: project?.messages?.map(m => ({
          role: m.role,
          content: m.content
        })) || []
      }
    }, {
      onSuccess: (res) => {
        // Save new HTML
        setLocalHtml(res.html);
        
        updateProject.mutate({
          id,
          data: {
            htmlContent: res.html
          }
        }, {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetBuilderProjectQueryKey(id) });
          }
        });
      }
    });
  };

  const quickPrompts = ["Add dark mode", "Make it mobile responsive", "Add a contact form", "Fix the layout"];

  if (isLoading || !project) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header */}
      <header className="flex-none h-14 border-b px-4 flex items-center justify-between bg-card text-card-foreground">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="font-medium text-sm truncate max-w-[200px]">{project.name}</div>
        </div>
        
        <div className="hidden md:flex items-center bg-muted/50 p-1 rounded-md">
          <Button 
            variant={deviceMode === "mobile" ? "secondary" : "ghost"} 
            size="sm" 
            className="h-7 px-2"
            onClick={() => setDeviceMode("mobile")}
          >
            <Smartphone className="h-4 w-4" />
          </Button>
          <Button 
            variant={deviceMode === "tablet" ? "secondary" : "ghost"} 
            size="sm" 
            className="h-7 px-2"
            onClick={() => setDeviceMode("tablet")}
          >
            <Tablet className="h-4 w-4" />
          </Button>
          <Button 
            variant={deviceMode === "desktop" ? "secondary" : "ghost"} 
            size="sm" 
            className="h-7 px-2"
            onClick={() => setDeviceMode("desktop")}
          >
            <Monitor className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {blobUrl && (
            <Button variant="outline" size="sm" className="hidden sm:flex" asChild>
              <a href={blobUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open
              </a>
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Chat Panel - Left */}
        <div className="hidden md:flex flex-col w-[320px] border-r bg-card/50">
          <ScrollArea className="flex-1 p-4" ref={chatScrollRef}>
            <div className="space-y-4">
              {project.messages?.length === 0 && (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  Describe what you want to build. Be as specific as you like!
                </div>
              )}
              
              {project.messages?.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div 
                    className={`max-w-[85%] rounded-lg p-3 text-sm ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground border'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {generateCode.isPending && (
                <div className="flex items-start">
                  <div className="bg-muted border rounded-lg p-3 flex gap-1 items-center">
                    <span className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <span className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="p-3 border-t bg-background">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {quickPrompts.map(qp => (
                <button
                  key={qp}
                  className="text-[10px] bg-muted hover:bg-muted/80 text-muted-foreground px-2 py-1 rounded-full transition-colors whitespace-nowrap"
                  onClick={() => setPrompt(qp)}
                >
                  {qp}
                </button>
              ))}
            </div>
            <div className="relative">
              <Input 
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Message AIOS..."
                className="pr-10"
                disabled={generateCode.isPending}
              />
              <Button 
                size="icon" 
                variant="ghost" 
                className="absolute right-1 top-1 h-7 w-7"
                onClick={handleSend}
                disabled={generateCode.isPending || !prompt.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Preview Panel - Center */}
        <div className="flex-1 bg-accent/30 flex flex-col relative">
          <div className="absolute top-2 right-2 z-10 md:hidden">
            <Button variant="secondary" size="icon" onClick={() => setActiveTab(t => t === 'preview' ? 'code' : 'preview')}>
              {activeTab === 'preview' ? <CodeIcon className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="flex-1 p-4 md:p-8 flex items-center justify-center overflow-auto">
            <div className={`
              bg-background border rounded-lg shadow-sm overflow-hidden transition-all duration-300 ease-in-out relative
              ${deviceMode === 'mobile' ? 'w-[375px] h-[812px]' : 
                deviceMode === 'tablet' ? 'w-[768px] h-[1024px] max-h-full' : 
                'w-full h-full'}
            `}>
              {deviceMode === 'mobile' && (
                <div className="absolute top-0 inset-x-0 h-6 bg-background border-b z-20 flex justify-center">
                  <div className="w-32 h-4 bg-muted rounded-b-xl" />
                </div>
              )}
              
              {!blobUrl ? (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm flex-col gap-4">
                  <CodeIcon className="h-8 w-8 opacity-20" />
                  <span>No preview available</span>
                </div>
              ) : (
                <iframe 
                  src={blobUrl} 
                  className={`w-full h-full bg-white border-0 ${deviceMode === 'mobile' ? 'pt-6' : ''}`}
                  sandbox="allow-scripts allow-same-origin"
                />
              )}
            </div>
          </div>
        </div>

        {/* Code Panel - Right */}
        <div className="hidden lg:flex flex-col w-[380px] border-l bg-[#1e1e1e] text-[#d4d4d4]">
          <Tabs defaultValue="html" className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#333] px-2 bg-[#252526]">
              <TabsList className="bg-transparent h-10 p-0 border-0">
                <TabsTrigger 
                  value="html" 
                  className="data-[state=active]:bg-[#1e1e1e] data-[state=active]:text-white rounded-none border-t-2 border-transparent data-[state=active]:border-blue-500 h-10 px-4"
                >
                  index.html
                </TabsTrigger>
                <TabsTrigger 
                  value="console" 
                  className="data-[state=active]:bg-[#1e1e1e] data-[state=active]:text-white rounded-none border-t-2 border-transparent data-[state=active]:border-blue-500 h-10 px-4"
                >
                  Console
                </TabsTrigger>
              </TabsList>
              
              <div className="flex gap-1 pr-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-gray-400 hover:text-white hover:bg-white/10"
                  onClick={() => {
                    navigator.clipboard.writeText(localHtml);
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-gray-400 hover:text-white hover:bg-white/10"
                  onClick={() => {
                    const blob = new Blob([localHtml], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'index.html';
                    a.click();
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            
            <TabsContent value="html" className="flex-1 m-0 p-0 h-full data-[state=active]:flex">
              <textarea 
                className="w-full h-full p-4 bg-transparent border-none text-[13px] font-mono resize-none focus:outline-none focus:ring-0 text-[#d4d4d4]"
                value={localHtml}
                onChange={e => setLocalHtml(e.target.value)}
                spellCheck={false}
              />
            </TabsContent>
            
            <TabsContent value="console" className="flex-1 m-0 p-4 h-full bg-[#1e1e1e]">
              <div className="text-sm font-mono text-gray-500">
                // Console output will appear here
              </div>
            </TabsContent>
          </Tabs>
        </div>

      </div>
    </div>
  );
}
