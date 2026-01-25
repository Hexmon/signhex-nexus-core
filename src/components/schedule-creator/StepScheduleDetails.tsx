import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";

interface StepScheduleDetailsProps {
  scheduleName: string;
  scheduleDescription: string;
  startAt: string;
  endAt: string;
  priority: number;
  validationErrors?: string[];
  isCheckingAvailability?: boolean;
  onUpdate: (updates: Partial<{
    scheduleName: string;
    scheduleDescription: string;
    startAt: string;
    endAt: string;
    priority: number;
  }>) => void;
}

const priorityOptions = [
  { value: "0", label: "Normal", description: "Standard priority" },
  { value: "1", label: "High", description: "Takes precedence over normal" },
  { value: "2", label: "Urgent", description: "Highest priority level" },
];

export function StepScheduleDetails({
  scheduleName,
  scheduleDescription,
  startAt,
  endAt,
  priority,
  validationErrors,
  isCheckingAvailability,
  onUpdate,
}: StepScheduleDetailsProps) {
  const formatLocalDateTime = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    const hours = String(value.getHours()).padStart(2, "0");
    const minutes = String(value.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const minDate = new Date();
  minDate.setSeconds(0, 0);
  minDate.setMinutes(minDate.getMinutes() + 1);
  const minStartAt = formatLocalDateTime(minDate);
  const minEndAt = startAt || minStartAt;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Schedule Details</h2>
        <p className="text-sm text-muted-foreground">
          Set the name, timing, and priority for your schedule
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Basic info */}
        <div className="space-y-6">
          <Card className="p-4 space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Basic Information
            </h3>

            <div className="space-y-2">
              <Label htmlFor="schedule-name">Schedule Name *</Label>
              <Input
                id="schedule-name"
                value={scheduleName}
                onChange={(e) => onUpdate({ scheduleName: e.target.value })}
                placeholder="e.g., Q1 Marketing Campaign"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule-desc">Description</Label>
              <Textarea
                id="schedule-desc"
                value={scheduleDescription}
                onChange={(e) => onUpdate({ scheduleDescription: e.target.value })}
                placeholder="Describe what this schedule is for..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={priority.toString()}
                onValueChange={(val) => onUpdate({ priority: parseInt(val) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex flex-col">
                        <span>{opt.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {opt.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>
        </div>

        {/* Right column - Date/Time */}
        <div className="space-y-6">
          <Card className="p-4 space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              Schedule Timing
            </h3>

            <div className="space-y-2">
              <Label htmlFor="start-at">Start Date & Time *</Label>
              <Input
                id="start-at"
                type="datetime-local"
                value={startAt}
                onChange={(e) => onUpdate({ startAt: e.target.value })}
                min={minStartAt}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-at">End Date & Time *</Label>
              <Input
                id="end-at"
                type="datetime-local"
                value={endAt}
                onChange={(e) => onUpdate({ endAt: e.target.value })}
                min={minEndAt}
              />
            </div>

            {isCheckingAvailability && (
              <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                Checking selected screens and groups for schedule conflicts...
              </div>
            )}

            {validationErrors && validationErrors.length > 0 && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <p className="font-medium">Schedule timing needs attention</p>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  {validationErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {startAt && endAt && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">Duration</p>
                <p className="text-sm text-muted-foreground">
                  {(() => {
                    const start = new Date(startAt);
                    const end = new Date(endAt);
                    const diffMs = end.getTime() - start.getTime();
                    if (diffMs < 0) return "Invalid range";
                    const hours = Math.floor(diffMs / (1000 * 60 * 60));
                    const days = Math.floor(hours / 24);
                    const remainingHours = hours % 24;
                    if (days > 0) {
                      return `${days} day(s)${remainingHours > 0 ? `, ${remainingHours} hour(s)` : ""}`;
                    }
                    return `${hours} hour(s)`;
                  })()}
                </p>
              </div>
            )}
          </Card>

          {/* Quick presets */}
          <Card className="p-4 space-y-3">
            <h3 className="font-medium text-sm">Quick Presets</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Today", days: 0 },
                { label: "Tomorrow", days: 1 },
                { label: "This Week", days: 7 },
                { label: "This Month", days: 30 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const start = new Date(now);
                    start.setHours(9, 0, 0, 0);
                    if (preset.days > 0) {
                      start.setDate(start.getDate() + (preset.days === 1 ? 1 : 0));
                    }
                    if (start <= now) {
                      start.setTime(now.getTime() + 60 * 1000);
                    }
                    const end = new Date(start);
                    end.setDate(end.getDate() + preset.days);
                    end.setHours(18, 0, 0, 0);
                    if (end <= start) {
                      end.setTime(start.getTime() + 60 * 60 * 1000);
                    }

                    onUpdate({
                      startAt: formatLocalDateTime(start),
                      endAt: formatLocalDateTime(end),
                    });
                  }}
                  className="px-3 py-1 text-sm border rounded-full hover:bg-muted transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
