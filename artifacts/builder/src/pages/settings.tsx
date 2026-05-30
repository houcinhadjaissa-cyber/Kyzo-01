import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, Key, Zap, Check, AlertCircle, Rocket, TestTube2, Loader2 } from "lucide-react";
import { useGetBuilderSettings, useUpdateBuilderSettings, getGetBuilderSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function Settings() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetBuilderSettings();
  const updateSettings = useUpdateBuilderSettings();

  const [apiKey, setApiKey] = useState("");
  const [vercelToken, setVercelToken] = useState("");
  const [activeModel, setActiveModel] = useState<string>("");
  const [premiumEnabled, setPremiumEnabled] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [testMsg, setTestMsg] = useState("");

  useEffect(() => {
    if (settings) {
      setActiveModel(settings.activeModel);
      setPremiumEnabled(settings.premiumModelsEnabled);
    }
  }, [settings]);

  const handleSaveApiKey = () => {
    if (!apiKey) return;
    updateSettings.mutate({ data: { openrouterApiKey: apiKey } }, {
      onSuccess: () => {
        setApiKey("");
        queryClient.invalidateQueries({ queryKey: getGetBuilderSettingsQueryKey() });
      },
    });
  };

  const handleTestConnection = async () => {
    setTestStatus("testing");
    setTestMsg("");
    try {
      const res = await fetch("/api/builder/settings");
      const data = (await res.json()) as { openrouterKeyConfigured?: boolean };
      if (data.openrouterKeyConfigured) {
        setTestStatus("ok");
        setTestMsg("OpenRouter connection successful — AI generation is active.");
      } else {
        setTestStatus("error");
        setTestMsg("No OpenRouter API key found. Add it above.");
      }
    } catch {
      setTestStatus("error");
      setTestMsg("Could not reach the API server.");
    }
  };

  const handleModelChange = (val: string) => {
    setActiveModel(val);
    updateSettings.mutate({ data: { activeModel: val } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetBuilderSettingsQueryKey() }),
    });
  };

  const handlePremiumToggle = (checked: boolean) => {
    setPremiumEnabled(checked);
    updateSettings.mutate({ data: { premiumModelsEnabled: checked } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetBuilderSettingsQueryKey() }),
    });
  };

  const allModels = [
    ...(settings?.freeModels ?? []),
    ...(premiumEnabled ? (settings?.premiumModels ?? []) : []),
  ];

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background pb-16">
      <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center px-4">
          <Button variant="ghost" size="icon" asChild className="mr-4 h-9 w-9">
            <Link href="/"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div className="font-semibold text-lg">Settings</div>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Configuration</h1>
          <p className="text-muted-foreground text-sm">Manage your API keys, AI model, and deploy settings.</p>
        </div>

        {settings && !settings.openrouterKeyConfigured && (
          <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>API Key Required</AlertTitle>
            <AlertDescription>Add an OpenRouter API key to enable AI generation. Free-tier models are available at no cost.</AlertDescription>
          </Alert>
        )}

        {/* ── OpenRouter API Key ── */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Key className="h-4 w-4" />
              OpenRouter API Key
            </CardTitle>
            <CardDescription className="text-sm">
              Required for AI code generation. Free-tier models included —{" "}
              <a href="https://openrouter.ai" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                get yours at openrouter.ai
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings?.openrouterKeyConfigured && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                <Check className="h-4 w-4 shrink-0" />
                <span>Configured: {settings.openrouterKeyMasked}</span>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="apikey">{settings?.openrouterKeyConfigured ? "Update API Key" : "Enter API Key"}</Label>
              <div className="flex gap-2">
                <Input id="apikey" type="password" placeholder="sk-or-v1-…" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="flex-1" />
                <Button onClick={handleSaveApiKey} disabled={!apiKey || updateSettings.isPending} className="shrink-0">
                  {updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={testStatus === "testing"} className="h-8">
                {testStatus === "testing"
                  ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Testing…</>
                  : <><TestTube2 className="mr-1.5 h-3.5 w-3.5" />Test Connection</>
                }
              </Button>
              {testMsg && (
                <span className={`text-xs ${testStatus === "ok" ? "text-green-600" : "text-destructive"}`}>
                  {testMsg}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── AI Model ── */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4" />
              AI Model
            </CardTitle>
            <CardDescription className="text-sm">Select the model that powers the builder. Free-tier models are always available.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Enable Premium Models</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Unlock GPT-4o, Claude 3.5 Sonnet, Gemini 2.0 Flash (requires paid OpenRouter credits).</p>
              </div>
              <Switch checked={premiumEnabled} onCheckedChange={handlePremiumToggle} disabled={updateSettings.isPending} />
            </div>
            <Separator />
            <div className="grid gap-2">
              <Label className="text-sm">Active Model</Label>
              <Select value={activeModel} onValueChange={handleModelChange} disabled={updateSettings.isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {allModels.map((model) => (
                    <SelectItem key={model} value={model} className="text-xs">
                      <div className="flex items-center gap-2">
                        {model}
                        {settings?.freeModels?.includes(model) && (
                          <Badge variant="secondary" className="text-[9px] h-4">free</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">If this model fails, the builder automatically falls back to the next available free model.</p>
            </div>
          </CardContent>
        </Card>

        {/* ── Vercel Deploy ── */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Rocket className="h-4 w-4" />
              One-Click Deploy
            </CardTitle>
            <CardDescription className="text-sm">
              Deploy generated websites directly to Vercel. Add your token in{" "}
              <a href="https://vercel.com/account/tokens" target="_blank" rel="noreferrer" className="text-primary hover:underline">Vercel Account → Tokens</a>, then save it as{" "}
              <code className="bg-muted px-1 rounded text-xs">VERCEL_TOKEN</code> in Replit Secrets.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/60 p-4 text-sm space-y-2">
              <p className="font-medium text-sm">How to enable deploy:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
                <li>Go to <a href="https://vercel.com/account/tokens" target="_blank" rel="noreferrer" className="text-primary hover:underline">vercel.com/account/tokens</a></li>
                <li>Create a new token with "Full Account" scope</li>
                <li>In Replit, open the Secrets tool (🔒) and add <code className="bg-background px-1 rounded">VERCEL_TOKEN</code></li>
                <li>Restart the API Server workflow</li>
                <li>The "Deploy" button in the builder will now work</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
