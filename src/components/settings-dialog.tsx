"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { Credentials, SettingsFormData } from "@/types/settings";

export function SettingsDialog() {
  const [formData, setFormData] = useState<SettingsFormData>({
    firmSlug: "",
    firmApiKey: "",
    clockworkApiKey: "",
    clockworkApiSecret: "",
    openaiApiKey: "",
  });

  const [credentials, setCredentials] = useState<Credentials>({
    firmSlug: "",
    firmApiKey: "",
    clockworkAuthKey: "",
  });
  useEffect(() => {
    const stored = localStorage.getItem("credentials");
    if (stored) {
      const parsedCredentials = JSON.parse(stored);
      setCredentials(parsedCredentials);

      // Decode the clockwork auth key to get back the original API key and secret
      let clockworkApiKey = '';
      let clockworkApiSecret = '';
      if (parsedCredentials.clockworkAuthKey) {
        try {
          const decoded = atob(parsedCredentials.clockworkAuthKey);
          [clockworkApiKey, clockworkApiSecret] = decoded.split(':');
        } catch (e) {
          console.error('Error decoding clockwork auth key:', e);
        }
      }

      setFormData({
        firmSlug: parsedCredentials.firmSlug || '',
        firmApiKey: parsedCredentials.firmApiKey || '',
        clockworkApiKey: clockworkApiKey,
        clockworkApiSecret: clockworkApiSecret,
        openaiApiKey: parsedCredentials.openaiApiKey || ''
      });
    } else if (process.env.NODE_ENV === 'development') {
      const clockworkAuthKey = btoa(`${process.env.NEXT_PUBLIC_CLOCKWORK_PUBLIC_KEY}:${process.env.NEXT_PUBLIC_CLOCKWORK_SECRET_KEY}`);
      const devCredentials = {
        firmSlug: process.env.NEXT_PUBLIC_FIRM_SLUG || '',
        firmApiKey: process.env.NEXT_PUBLIC_FIRM_API_KEY || '',
        clockworkAuthKey,
        openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''
      };
      localStorage.setItem("credentials", JSON.stringify(devCredentials));
      setCredentials(devCredentials);
      setFormData({
        firmSlug: process.env.NEXT_PUBLIC_FIRM_SLUG || '',
        firmApiKey: process.env.NEXT_PUBLIC_FIRM_API_KEY || '',
        clockworkApiKey: process.env.NEXT_PUBLIC_CLOCKWORK_PUBLIC_KEY || '',
        clockworkApiSecret: process.env.NEXT_PUBLIC_CLOCKWORK_SECRET_KEY || '',
        openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''
      });
    }
  }, []);

  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsValidating(true);
    
    // Create base64 encoded auth key from API key and secret
    console.log('API Key:', formData.clockworkApiKey);
    console.log('API Secret:', formData.clockworkApiSecret);
    const clockworkAuthKey = btoa(`${formData.clockworkApiKey}:${formData.clockworkApiSecret}`);
    console.log('Combined string:', `${formData.clockworkApiKey}:${formData.clockworkApiSecret}`);
    console.log('Base64 encoded auth key:', clockworkAuthKey);
    
    const credentialsToSave = {
      firmSlug: formData.firmSlug,
      firmApiKey: formData.firmApiKey,
      clockworkAuthKey,
      openaiApiKey: formData.openaiApiKey
    };

    try {
      // Validate credentials with a test request
      const response = await fetch("/api/clockwork-search/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentials: credentialsToSave }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to validate credentials');
      }

      localStorage.setItem("credentials", JSON.stringify(credentialsToSave));
      setCredentials(credentialsToSave);
      setOpen(false);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent onInteractOutside={(e) => {
        // Prevent closing if credentials don't exist
        if (!localStorage.getItem("credentials") && process.env.NODE_ENV !== 'development') {
          e.preventDefault();
        }
      }}>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firmSlug">Firm Slug</Label>
            <Input
              id="firmSlug"
              value={formData.firmSlug}
              onChange={(e) =>
                setFormData({ ...formData, firmSlug: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="firmApiKey">Firm API Key</Label>
            <Input
              id="firmApiKey"
              value={formData.firmApiKey}
              onChange={(e) =>
                setFormData({ ...formData, firmApiKey: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clockworkApiKey">Public Key</Label>
            <Input
              id="clockworkApiKey"
              value={formData.clockworkApiKey}
              onChange={(e) =>
                setFormData({ ...formData, clockworkApiKey: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clockworkApiSecret">Secret Key</Label>
            <Input
              id="clockworkApiSecret"
              value={formData.clockworkApiSecret}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  clockworkApiSecret: e.target.value,
                })
              }
              required
            />
          </div>
          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}
          <div className="text-sm text-muted-foreground mt-2 mb-4">
            You can get your firm API key and public/secret key pair from your profile in Clockwork
          </div>
          <div className="space-y-2">
            <Label htmlFor="openaiApiKey">OpenAI API Key</Label>
            <Input
              id="openaiApiKey"
              value={formData.openaiApiKey}
              onChange={(e) =>
                setFormData({ ...formData, openaiApiKey: e.target.value })
              }
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isValidating}>
            {isValidating ? "Validating..." : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
