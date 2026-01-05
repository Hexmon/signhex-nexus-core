import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Plus, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { devicePairingApi } from "@/api/domains/devicePairing";
import { queryKeys } from "@/api/queryKeys";
import { useSafeMutation } from "@/hooks/useSafeMutation";
import { toast } from "sonner";

interface PairDeviceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PairDeviceModal({ open, onOpenChange }: PairDeviceModalProps) {
  const queryClient = useQueryClient();
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    deviceId: "",
    expiresIn: 900,
  });
  const [confirmForm, setConfirmForm] = useState({
    pairingCode: "",
    name: "",
    location: "",
  });

  const generatePairing = useSafeMutation({
    mutationFn: (payload: { device_id: string; expires_in: number }) =>
      devicePairingApi.generate(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["device-pairings"] });
      if (data.pairing_code) {
        setGeneratedCode(data.pairing_code);
        toast.success("Pairing code generated successfully");
      }
    },
  }, "Unable to generate pairing code.");

  const confirmPairing = useSafeMutation({
    mutationFn: (payload: { pairing_code: string; name: string; location?: string }) =>
      devicePairingApi.confirm(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["device-pairings"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.screens });
      toast.success(`Screen "${data.screen.name}" paired successfully`);
      setConfirmForm({ pairingCode: "", name: "", location: "" });
      onOpenChange(false);
    },
  }, "Unable to confirm pairing.");

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      toast.success("Pairing code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConfirm = () => {
    confirmPairing.mutate({
      pairing_code: confirmForm.pairingCode.trim(),
      name: confirmForm.name.trim(),
      location: confirmForm.location.trim() || undefined,
    });
  };

  const handleGenerate = () => {
    generatePairing.mutate({
      device_id: generateForm.deviceId.trim(),
      expires_in: generateForm.expiresIn,
    });
  };

  const handleGenerateNew = () => {
    setGeneratedCode(null);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setGeneratedCode(null);
      setGenerateForm({ deviceId: "", expiresIn: 900 });
      setConfirmForm({ pairingCode: "", name: "", location: "" });
    }
    onOpenChange(open);
  };

  const pairingUrl = generatedCode
    ? `https://signhex.app/pair?code=${generatedCode}`
    : "";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Device Pairing</DialogTitle>
          <DialogDescription>
            Generate a pairing code or confirm an existing pairing
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="generate" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="confirm">Confirm</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-3 py-3">
            {generatedCode ? (
              <>
                <div className="flex flex-col items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <QRCodeSVG value={pairingUrl} size={160} level="H" />
                  </div>

                  <div className="flex items-center gap-2 w-full">
                    <Input
                      value={generatedCode}
                      readOnly
                      className="text-center text-base font-mono font-bold tracking-wider"
                    />
                    <Button variant="outline" size="icon" onClick={handleCopyCode}>
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleGenerateNew}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Expires in 15 minutes
                  </p>
                </div>

                <div className="bg-muted/30 p-3 rounded-lg">
                  <h5 className="font-semibold text-sm mb-1">Instructions:</h5>
                  <ol className="text-xs text-muted-foreground space-y-0.5 list-decimal list-inside">
                    <li>Open SignHex Player on device</li>
                    <li>Go to Settings → Pair Device</li>
                    <li>Scan QR or enter code</li>
                    <li>Switch to "Confirm" tab to complete</li>
                  </ol>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="device-id" className="text-sm">Device ID *</Label>
                  <Input
                    id="device-id"
                    value={generateForm.deviceId}
                    onChange={(e) =>
                      setGenerateForm((prev) => ({ ...prev, deviceId: e.target.value }))
                    }
                    placeholder="e.g., DEVICE-001 or MAC address"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Unique identifier for the device (can be any string)
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="expires-in" className="text-sm">Expires In (seconds)</Label>
                  <Input
                    id="expires-in"
                    type="number"
                    value={generateForm.expiresIn}
                    onChange={(e) =>
                      setGenerateForm((prev) => ({
                        ...prev,
                        expiresIn: parseInt(e.target.value) || 900
                      }))
                    }
                    min={60}
                    max={3600}
                  />
                  <p className="text-xs text-muted-foreground">
                    Default: 900 seconds (15 minutes)
                  </p>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={generatePairing.isPending || !generateForm.deviceId.trim()}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {generatePairing.isPending ? "Generating..." : "Generate Pairing Code"}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="confirm" className="space-y-3 py-3">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="pairing-code" className="text-sm">Pairing Code *</Label>
                <Input
                  id="pairing-code"
                  value={confirmForm.pairingCode}
                  onChange={(e) =>
                    setConfirmForm((prev) => ({
                      ...prev,
                      pairingCode: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="Enter code"
                  className="font-mono uppercase"
                  maxLength={20}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="screen-name" className="text-sm">Screen Name *</Label>
                <Input
                  id="screen-name"
                  value={confirmForm.name}
                  onChange={(e) =>
                    setConfirmForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Lobby Display"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="screen-location" className="text-sm">Location (Optional)</Label>
                <Input
                  id="screen-location"
                  value={confirmForm.location}
                  onChange={(e) =>
                    setConfirmForm((prev) => ({ ...prev, location: e.target.value }))
                  }
                  placeholder="e.g., First Floor"
                />
              </div>

              <Button
                onClick={handleConfirm}
                disabled={
                  confirmPairing.isPending ||
                  !confirmForm.pairingCode.trim() ||
                  !confirmForm.name.trim()
                }
                className="w-full"
              >
                {confirmPairing.isPending ? "Confirming..." : "Confirm & Create Screen"}
              </Button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-2.5 rounded-lg">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                <strong>Note:</strong> Device sends request with the code. Enter it here to register the screen.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}