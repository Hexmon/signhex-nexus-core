import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface EmergencyTakeoverModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (config: TakeoverConfig) => void;
}

export interface TakeoverConfig {
  title: string;
  message: string;
  mediaUrl?: string;
  scope: "all" | "department" | "screens";
  targetIds?: string[];
  duration: number; // minutes
  auditNote: string;
  confirmed: boolean;
}

export function EmergencyTakeoverModal({
  open,
  onOpenChange,
  onConfirm,
}: EmergencyTakeoverModalProps) {
  const [config, setConfig] = useState<TakeoverConfig>({
    title: "",
    message: "",
    mediaUrl: "",
    scope: "all",
    duration: 30,
    auditNote: "",
    confirmed: false,
  });

  const { toast } = useToast();

  const handleConfirm = () => {
    if (!config.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please provide a title for this emergency takeover.",
        variant: "destructive",
      });
      return;
    }

    if (!config.message.trim() && !config.mediaUrl) {
      toast({
        title: "Content Required",
        description: "Please provide either a message or media URL.",
        variant: "destructive",
      });
      return;
    }

    if (!config.auditNote.trim()) {
      toast({
        title: "Audit Note Required",
        description: "Please provide a reason for this emergency takeover for audit purposes.",
        variant: "destructive",
      });
      return;
    }

    if (!config.confirmed) {
      toast({
        title: "Confirmation Required",
        description: "Please confirm that you understand the impact of this action.",
        variant: "destructive",
      });
      return;
    }

    onConfirm(config);
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setConfig({
      title: "",
      message: "",
      mediaUrl: "",
      scope: "all",
      duration: 30,
      auditNote: "",
      confirmed: false,
    });
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-warning" />
            Emergency Takeover
          </DialogTitle>
          <DialogDescription>
            Immediately override all scheduled content across selected screens. This action will be audited.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="takeover-title">
              Takeover Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="takeover-title"
              placeholder="e.g., Emergency Announcement - Building Evacuation"
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="takeover-message">Emergency Message</Label>
            <Textarea
              id="takeover-message"
              placeholder="Enter the emergency message to display..."
              value={config.message}
              onChange={(e) => setConfig({ ...config, message: e.target.value })}
              rows={4}
            />
          </div>

          {/* Media URL (optional) */}
          <div className="space-y-2">
            <Label htmlFor="media-url">Media URL (Optional)</Label>
            <Input
              id="media-url"
              type="url"
              placeholder="https://example.com/emergency-media.jpg"
              value={config.mediaUrl}
              onChange={(e) => setConfig({ ...config, mediaUrl: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Provide a URL to display media instead of text
            </p>
          </div>

          {/* Scope */}
          <div className="space-y-2">
            <Label htmlFor="scope">Scope</Label>
            <Select value={config.scope} onValueChange={(value: any) => setConfig({ ...config, scope: value })}>
              <SelectTrigger id="scope">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Screens (System-wide)</SelectItem>
                <SelectItem value="department">Specific Department</SelectItem>
                <SelectItem value="screens">Specific Screens</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Maximum Duration (minutes)</Label>
            <Select 
              value={config.duration.toString()} 
              onValueChange={(value) => setConfig({ ...config, duration: parseInt(value) })}
            >
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="240">4 hours</SelectItem>
                <SelectItem value="1440">24 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Audit Note */}
          <div className="space-y-2">
            <Label htmlFor="audit-note">
              Audit Note <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="audit-note"
              placeholder="Explain the reason for this emergency takeover (required for compliance and audit trail)"
              value={config.auditNote}
              onChange={(e) => setConfig({ ...config, auditNote: e.target.value })}
              rows={3}
            />
          </div>

          {/* Warning Box */}
          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="font-semibold text-sm">Critical Action - Impact:</p>
                <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
                  <li>Immediately interrupts all currently playing content</li>
                  <li>Affects {config.scope === "all" ? "ALL screens system-wide" : 
                             config.scope === "department" ? "all screens in selected department" :
                             "selected screens only"}</li>
                  <li>Scheduled content will resume after takeover expires</li>
                  <li>Action is permanently logged in audit trail</li>
                  <li>Notification sent to all affected departments</li>
                </ul>
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <div className="flex items-start gap-2 pt-2 border-t border-destructive/20">
              <Checkbox
                id="confirm-takeover"
                checked={config.confirmed}
                onCheckedChange={(checked) => setConfig({ ...config, confirmed: checked as boolean })}
              />
              <label
                htmlFor="confirm-takeover"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I understand the impact and confirm this emergency action is necessary
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={!config.confirmed || !config.title.trim() || !config.auditNote.trim()}
          >
            <Zap className="h-4 w-4 mr-2" />
            Activate Emergency Takeover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
