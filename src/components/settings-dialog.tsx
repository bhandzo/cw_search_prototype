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
  clockworkApiKey: string;
  clockworkApiSecret: string;
}

export function SettingsDialog() {
  const [credentials, setCredentials] = useState<Credentials>({
    firmSlug: "",
    firmApiKey: "",
    clockworkApiKey: "",
    clockworkApiSecret: "",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("credentials", JSON.stringify(credentials));
    // Clear any search history here when implemented
    setOpen(false);
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
              value={credentials.firmSlug}
              onChange={(e) =>
                setCredentials({ ...credentials, firmSlug: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="firmApiKey">Firm API Key</Label>
            <Input
              id="firmApiKey"
              type="password"
              value={credentials.firmApiKey}
              onChange={(e) =>
                setCredentials({ ...credentials, firmApiKey: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clockworkApiKey">Clockwork API Key</Label>
            <Input
              id="clockworkApiKey"
              type="password"
              value={credentials.clockworkApiKey}
              onChange={(e) =>
                setCredentials({ ...credentials, clockworkApiKey: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clockworkApiSecret">Clockwork API Secret</Label>
            <Input
              id="clockworkApiSecret"
              type="password"
              value={credentials.clockworkApiSecret}
              onChange={(e) =>
                setCredentials({
                  ...credentials,
                  clockworkApiSecret: e.target.value,
                })
              }
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
