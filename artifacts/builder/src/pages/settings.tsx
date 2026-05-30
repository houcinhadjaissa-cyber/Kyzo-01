import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, Key, Zap, Check, AlertCircle } from "lucide-react";
import { 
  useGetBuilderSettings, 
  useUpdateBuilderSettings,
  getGetBuilderSettingsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetBuilderSettings();
  const updateSettings = useUpdateBuilderSettings();
  
  const [apiKey, setApiKey] = useState("");
  const [activeModel, setActiveModel] = useState<string>("");
  const [premiumEnabled, setPremiumEnabled] = useState(false);

  useEffect(() => {
    if (settings) {
      setActiveModel(settings.activeModel);
      setPremiumEnabled(settings.premiumModelsEnabled);
    }
  }, [settings]);

  const handleSaveApi = () => {
    if (!apiKey) return;
    
    updateSettings.mutate({
      data: {
        openrouterApiKey: apiKey
      }
    }, {
      onSuccess: () => {
        setApiKey("");
        queryClient.invalidateQueries({ queryKey: getGetBuilderSettingsQueryKey() });
      }
    });
  };

  const handleModelChange = (val: string) => {
    setActiveModel(val);
    updateSettings.mutate({
      data: {
        activeModel: val
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetBuilderSettingsQueryKey() });
      }
    });
  };

  const handlePremiumToggle = (checked: boolean) => {
    setPremiumEnabled(checked);
    updateSettings.mutate({
      data: {
        premiumModelsEnabled: checked
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetBuilderSettingsQueryKey() });
      }
    });
  };

  if (isLoading) {
    return <div className="p-8">Loading settings...</div>;
  }

  const allModels = [
    ...(settings?.freeModels || []),
    ...(settings?.premiumModelsEnabled ? (settings?.premiumModels || []) : [])
  ];

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center px-4">
          <Button variant="ghost" size="icon" asChild className="mr-4">
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="font-semibold text-lg">Settings</div>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto p-4 md:p-8 space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Configuration</h1>
          <p className="text-muted-foreground">Manage your API keys and AI model preferences.</p>
        </div>

        {settings && !settings.openrouterKeyConfigured && (
          <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>API Key Required</AlertTitle>
            <AlertDescription>
              You must configure an OpenRouter API key to generate code.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              OpenRouter API Key
            </CardTitle>
            <CardDescription>
              Required for AI code generation. Get yours at openrouter.ai
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings?.openrouterKeyConfigured && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-500/10 p-3 rounded-md border border-green-500/20 mb-4">
                <Check className="h-4 w-4" />
                Key configured: {settings.openrouterKeyMasked}
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="apikey">
                {settings?.openrouterKeyConfigured ? "Update API Key" : "Enter API Key"}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="apikey"
                  type="password"
                  placeholder="sk-or-v1-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <Button onClick={handleSaveApi} disabled={!apiKey || updateSettings.isPending}>
                  Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Model Selection
            </CardTitle>
            <CardDescription>
              Choose which AI model powers the builder.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Premium Models</Label>
                <div className="text-sm text-muted-foreground">
                  Allow access to more expensive, higher-quality models.
                </div>
              </div>
              <Switch 
                checked={premiumEnabled} 
                onCheckedChange={handlePremiumToggle} 
                disabled={updateSettings.isPending}
              />
            </div>
            
            <Separator />
            
            <div className="grid gap-2">
              <Label>Active Model</Label>
              <Select value={activeModel} onValueChange={handleModelChange} disabled={updateSettings.isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {allModels.map(model => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </CardContent>
        </Card>

      </main>
    </div>
  );
}
