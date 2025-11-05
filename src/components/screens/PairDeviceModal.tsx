import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, RefreshCw } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface PairDeviceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PairDeviceModal({ open, onOpenChange }: PairDeviceModalProps) {
  const [pairingCode, setPairingCode] = useState(generatePairingCode());
  const [copied, setCopied] = useState(false);
  const [department, setDepartment] = useState("");
  const [tags, setTags] = useState("");
  const [cacheCap, setCacheCap] = useState("5");
  const [heartbeatInterval, setHeartbeatInterval] = useState("30");

  function generatePairingCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  const handleRegeneratCode = () => {
    setPairingCode(generatePairingCode());
    toast.info("New pairing code generated");
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pairingCode);
    setCopied(true);
    toast.success("Pairing code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const pairingUrl = `https://signhex.app/pair?code=${pairingCode}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Pair New Device</DialogTitle>
          <DialogDescription>
            Scan the QR code or enter the pairing code on your device to register it with the system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* QR Code Section */}
          <div className="flex flex-col items-center gap-4 p-6 bg-muted/50 rounded-lg">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <QRCodeSVG value={pairingUrl} size={200} level="H" />
            </div>
            
            <div className="flex items-center gap-2 w-full max-w-sm">
              <Input
                value={pairingCode}
                readOnly
                className="text-center text-lg font-mono font-bold tracking-wider"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyCode}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRegeneratCode}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Code expires in 15 minutes
            </p>
          </div>

          {/* Configuration Section */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Device Configuration</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="it">IT Operations</SelectItem>
                    <SelectItem value="fb">Food & Beverage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Initial Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="lobby, public, hd"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cache-cap">Cache Capacity (GB)</Label>
                <Select value={cacheCap} onValueChange={setCacheCap}>
                  <SelectTrigger id="cache-cap">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 GB</SelectItem>
                    <SelectItem value="5">5 GB</SelectItem>
                    <SelectItem value="10">10 GB</SelectItem>
                    <SelectItem value="20">20 GB</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="heartbeat">Heartbeat Interval (seconds)</Label>
                <Select value={heartbeatInterval} onValueChange={setHeartbeatInterval}>
                  <SelectTrigger id="heartbeat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">60 seconds</SelectItem>
                    <SelectItem value="120">2 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-muted/30 p-4 rounded-lg space-y-2">
            <h5 className="font-semibold text-sm">Pairing Instructions:</h5>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Open the SignHex Player app on your device</li>
              <li>Navigate to Settings → Pair Device</li>
              <li>Scan the QR code or enter the pairing code manually</li>
              <li>Wait for confirmation and device registration</li>
              <li>Device will appear in the screens list once paired</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
