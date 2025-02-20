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

interface Credentials {
  firmSlug: string;
  firmApiKey: string;
  clockworkAuthKey: string;
}

interface FormData {
  firmSlug: string;
  firmApiKey: string;
  clockworkApiKey: string;
  clockworkApiSecret: string;
}

export function SettingsDialog() {
  const [formData, setFormData] = useState<FormData>({
    firmSlug: "",
    firmApiKey: "",
    clockworkApiKey: "",
    clockworkApiSecret: "",
  });

  const [credentials, setCredentials] = useState<Credentials>({
    firmSlug: "",
    firmApiKey: "",
    clockworkAuthKey: "",
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("credentials");
    if (stored) {
      setCredentials(JSON.parse(stored));
    } else {
      setOpen(true); // Automatically open if no credentials exist
    }
  }, []);

  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsValidating(true);
    
    // Create base64 encoded auth key from API key and secret
    const clockworkAuthKey = btoa(`${formData.clockworkApiKey}:${formData.clockworkApiSecret}`);
    console.log('Base64 encoded auth key:', clockworkAuthKey);
    
    const credentialsToSave = {
      firmSlug: formData.firmSlug,
      firmApiKey: formData.firmApiKey,
      clockworkAuthKey
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
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
            <Label htmlFor="clockworkApiKey">Clockwork API Key</Label>
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
            <Label htmlFor="clockworkApiSecret">Clockwork API Secret</Label>
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
          <Button type="submit" className="w-full" disabled={isValidating}>
            {isValidating ? "Validating..." : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
