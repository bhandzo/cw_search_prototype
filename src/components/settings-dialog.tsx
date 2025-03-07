"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SettingsFormData } from "@/types/settings";

interface SettingsDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SettingsDialog({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: SettingsDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState<boolean>(false);
  const [sessionToken, setSessionToken] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("sessionToken") : null
  );
  const [formData, setFormData] = useState<SettingsFormData>({
    firmSlug: "",
    firmApiKey: "",
    clockworkApiKey: "",
    clockworkApiSecret: "",
    openaiApiKey: "",
    maxCandidates: 5,
  });

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("sessionToken");
      if (!token) return;

      const response = await fetch("/api/credentials", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to logout");
      }

      localStorage.removeItem("sessionToken");
      setSessionToken(null);

      // Reset form data
      setFormData({
        firmSlug: "",
        firmApiKey: "",
        clockworkApiSecret: "",
        clockworkApiKey: "",
        openaiApiKey: "",
        maxCandidates: 5,
      });

      router.refresh();
    } catch (error) {
      console.error("Error logging out:", error);
      setError("Failed to logout");
    }
  };

  useEffect(() => {
    const loadCredentials = async () => {
      const token = localStorage.getItem("sessionToken");
      setSessionToken(token);

      if (!token) {
        setOpen(true); // Open dialog if no session token exists
        return;
      }

      try {
        console.log(
          "[SettingsDialog] Loading credentials with session token:",
          token
        );
        const response = await fetch("/api/credentials", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log(
          "[SettingsDialog] Credentials load response status:",
          response.status
        );
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("sessionToken");
            setSessionToken(null);
            setOpen(true);
            return;
          }
          throw new Error("Failed to load credentials");
        }

        const credentials = await response.json();
        console.log("[SettingsDialog] Loaded credentials:", {
          ...credentials,
          clockworkAuthKey: credentials.clockworkAuthKey
            ? "[REDACTED]"
            : undefined,
        });

        // Split the clockworkAuthKey into API key and secret
        let clockworkApiKey = "";
        let clockworkApiSecret = "";
        if (credentials.clockworkAuthKey) {
          try {
            const decoded = atob(credentials.clockworkAuthKey);
            [clockworkApiKey, clockworkApiSecret] = decoded.split(":");
          } catch (e) {
            console.error(
              "[SettingsDialog] Error decoding clockwork auth key:",
              e
            );
          }
        }

        setFormData({
          firmSlug: credentials.firmSlug || "",
          firmApiKey: credentials.firmApiKey || "",
          clockworkApiKey,
          clockworkApiSecret,
          openaiApiKey: credentials.openaiApiKey || "",
          maxCandidates: credentials.maxCandidates || 5,
        });
      } catch (error) {
        console.error("[SettingsDialog] Error loading credentials:", error);
        setOpen(true);
      }
    };

    loadCredentials();
  }, []); // Remove sessionToken from dependencies

  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[SettingsDialog] Starting submit");
    setError(null);
    setIsSaving(true);

    const clockworkAuthKey = btoa(
      `${formData.clockworkApiKey}:${formData.clockworkApiSecret}`
    );
    console.log("[SettingsDialog] Generated auth key");

    const credentialsToSave = {
      firmSlug: formData.firmSlug,
      firmApiKey: formData.firmApiKey,
      clockworkAuthKey,
      openaiApiKey: formData.openaiApiKey,
      maxCandidates: formData.maxCandidates,
    };

    try {
      console.log("[SettingsDialog] Saving credentials...");
      const saveResponse = await fetch("/api/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: sessionToken ? `Bearer ${sessionToken}` : "",
        },
        body: JSON.stringify(credentialsToSave),
      });

      console.log("[SettingsDialog] Save response:", saveResponse.status);

      if (!saveResponse.ok) {
        throw new Error("Failed to save credentials");
      }

      const responseData = await saveResponse.json();
      console.log("[SettingsDialog] Save response data:", responseData);

      if (!responseData.token) {
        throw new Error("No session token received");
      }

      console.log(
        "[SettingsDialog] Setting new session token:",
        responseData.token
      );
      localStorage.setItem("sessionToken", responseData.token);
      setSessionToken(responseData.token);

      // Only close dialog if both validation and save succeed
      setOpen(false);
      setControlledOpen?.(false);

      // Force a page refresh to ensure new token is used
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={controlledOpen ?? open}
      onOpenChange={(value) => {
        setOpen(value);
        setControlledOpen?.(value);
      }}
    >
      <DialogContent
        onInteractOutside={(e) => {
          // Prevent closing if no session token exists
          if (!sessionToken && process.env.NODE_ENV !== "development") {
            e.preventDefault();
          }
        }}
      >
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
          {error && <div className="text-sm text-destructive">{error}</div>}
          <div className="text-sm text-muted-foreground mt-2 mb-4">
            You can get your firm API key and public/secret key pair from your
            profile in Clockwork
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxCandidates">Maximum Candidates to Analyze</Label>
            <Input
              id="maxCandidates"
              type="number"
              min="1"
              max="20"
              value={formData.maxCandidates.toString()}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxCandidates: Math.min(
                    20,
                    Math.max(1, parseInt(e.target.value) || 5)
                  ),
                })
              }
              required
            />
            <p className="text-sm text-muted-foreground">
              Maximum number of candidates to analyze in detail (1-20)
            </p>
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
          {sessionToken && (
            <Button
              type="button"
              variant="outline"
              className="w-full mb-2"
              onClick={handleLogout}
            >
              Logout
            </Button>
          )}
          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
