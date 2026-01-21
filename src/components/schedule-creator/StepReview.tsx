import { LayoutGrid, Image, Monitor, Calendar, MessageSquare, Check, Volume2, VolumeX, Clock, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { ScheduleWizardState, SlotMedia } from "@/pages/ScheduleCreator";

interface StepReviewProps {
  state: ScheduleWizardState;
  approvalNotes: string;
  onUpdateNotes: (notes: string) => void;
}

// Visual Layout Preview Component
function LayoutPreview({ state }: { state: ScheduleWizardState }) {
  const { selectedLayout, slotMedia } = state;
  
  if (!selectedLayout) return null;

  const getSlotMedia = (slotId: string): SlotMedia[] => {
    return slotMedia.filter((sm) => sm.slotId === slotId);
  };

  return (
    <div className="relative w-full aspect-video bg-muted/30 rounded-lg border-2 border-dashed border-border overflow-hidden">
      {selectedLayout.spec.slots.map((slot) => {
        const media = getSlotMedia(slot.id);
        const firstMedia = media[0];
        
        return (
          <div
            key={slot.id}
            className="absolute bg-background border border-border rounded-md overflow-hidden flex flex-col"
            style={{
              left: `${slot.x * 100}%`,
              top: `${slot.y * 100}%`,
              width: `${slot.w * 100}%`,
              height: `${slot.h * 100}%`,
            }}
          >
            {/* Slot Header */}
            <div className="flex items-center justify-between px-2 py-1 bg-muted/50 border-b text-xs">
              <span className="font-medium truncate">{slot.id}</span>
              <Badge variant="secondary" className="text-[10px] h-4">
                {media.length} media
              </Badge>
            </div>
            
            {/* Media Preview */}
            <div className="flex-1 p-1 overflow-hidden">
              {firstMedia ? (
                <div className="h-full flex flex-col">
                  {firstMedia.mediaThumbnail ? (
                    <div className="flex-1 relative bg-muted rounded overflow-hidden">
                      <img
                        src={firstMedia.mediaThumbnail}
                        alt={firstMedia.mediaName}
                        className="w-full h-full object-cover"
                      />
                      {media.length > 1 && (
                        <div className="absolute bottom-1 right-1 bg-background/90 text-[10px] px-1.5 py-0.5 rounded">
                          +{media.length - 1} more
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center bg-muted rounded">
                      <div className="text-center">
                        <Image className="h-6 w-6 mx-auto text-muted-foreground/50" />
                        <span className="text-[10px] text-muted-foreground truncate block mt-1 px-1">
                          {firstMedia.mediaName}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Quick Info */}
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                    {firstMedia.audioEnabled && (
                      <Volume2 className="h-3 w-3 text-primary" />
                    )}
                    <Clock className="h-3 w-3" />
                    <span>{firstMedia.durationSeconds}s</span>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground/50">
                  <span className="text-xs">Empty</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Media Details Card Component
function MediaDetailsCard({ slotMedia, selectedLayout }: { slotMedia: SlotMedia[]; selectedLayout: ScheduleWizardState['selectedLayout'] }) {
  if (!selectedLayout) return null;

  const getSlotsWithMedia = () => {
    return selectedLayout.spec.slots.map((slot) => ({
      ...slot,
      media: slotMedia.filter((sm) => sm.slotId === slot.id),
    }));
  };

  return (
    <div className="space-y-3">
      {getSlotsWithMedia().map((slot) => (
        <div key={slot.id} className="border rounded-lg p-3 bg-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span className="font-medium">Slot: {slot.id}</span>
            </div>
            <Badge variant={slot.media.length > 0 ? "default" : "secondary"}>
              {slot.media.length} media
            </Badge>
          </div>
          
          {slot.media.length > 0 ? (
            <div className="space-y-2">
              {slot.media.map((m, idx) => (
                <div
                  key={`${m.slotId}-${m.mediaId}-${idx}`}
                  className="flex items-center gap-3 p-2 bg-muted/50 rounded-md"
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {m.mediaThumbnail ? (
                      <img src={m.mediaThumbnail} alt={m.mediaName} className="w-full h-full object-cover" />
                    ) : (
                      <Image className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">#{idx + 1}</span>
                      <span className="font-medium text-sm truncate">{m.mediaName}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">{m.mediaType}</Badge>
                      <Badge variant="outline" className="text-xs">{m.fitMode}</Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {m.durationSeconds}s
                      </div>
                      {m.audioEnabled ? (
                        <div className="flex items-center gap-1 text-xs text-primary">
                          <Volume2 className="h-3 w-3" />
                          Audio ON
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <VolumeX className="h-3 w-3" />
                          Muted
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No media assigned to this slot</p>
          )}
        </div>
      ))}
    </div>
  );
}

export function StepReview({ state, approvalNotes, onUpdateNotes }: StepReviewProps) {
  const {
    selectedLayout,
    slotMedia,
    selectedScreenIds,
    selectedGroupIds,
    scheduleName,
    scheduleDescription,
    startAt,
    endAt,
    priority,
  } = state;

  const priorityLabel = ["Normal", "High", "Urgent"][priority] || "Normal";

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "Not set";
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Review & Submit</h2>
        <p className="text-sm text-muted-foreground">
          Review your schedule before submitting for approval
        </p>
      </div>

      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-6">
          {/* Visual Layout Preview */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <LayoutGrid className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Layout Preview</h3>
              {selectedLayout && (
                <div className="ml-auto flex gap-2">
                  <Badge variant="outline">{selectedLayout.aspect_ratio}</Badge>
                  <Badge variant="secondary">{selectedLayout.spec.slots.length} slots</Badge>
                </div>
              )}
            </div>
            
            {selectedLayout ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{selectedLayout.name}</span>
                  {selectedLayout.description && (
                    <span className="text-sm text-muted-foreground">— {selectedLayout.description}</span>
                  )}
                </div>
                <LayoutPreview state={state} />
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <LayoutGrid className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No layout selected</p>
              </div>
            )}
          </Card>

          {/* Media Details */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Image className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Media Assignments</h3>
              <Badge variant="secondary" className="ml-auto">
                {slotMedia.length} total items
              </Badge>
            </div>
            
            {slotMedia.length > 0 ? (
              <MediaDetailsCard slotMedia={slotMedia} selectedLayout={selectedLayout} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No media assigned yet</p>
              </div>
            )}
          </Card>

          {/* Target Screens */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Monitor className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Target Screens</h3>
              <Badge variant="secondary" className="ml-auto">
                {selectedScreenIds.length + selectedGroupIds.length} selected
              </Badge>
            </div>
            
            {selectedScreenIds.length > 0 || selectedGroupIds.length > 0 ? (
              <div className="space-y-4">
                {selectedScreenIds.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Individual Screens ({selectedScreenIds.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedScreenIds.map((id) => (
                        <Badge key={id} variant="outline" className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          {id}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedGroupIds.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Screen Groups ({selectedGroupIds.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedGroupIds.map((id) => (
                        <Badge key={id} variant="outline" className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-accent-foreground" />
                          {id}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Monitor className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No screens selected</p>
              </div>
            )}
          </Card>

          {/* Schedule Details */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Schedule Details</h3>
              <Check className="h-4 w-4 text-primary ml-auto" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Name</p>
                <p className="font-medium">{scheduleName || <span className="text-muted-foreground italic">Not set</span>}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Priority</p>
                <Badge
                  variant={priority === 2 ? "destructive" : priority === 1 ? "default" : "secondary"}
                >
                  {priorityLabel}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Start Time</p>
                <p className="font-medium">{formatDateTime(startAt)}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">End Time</p>
                <p className="font-medium">{formatDateTime(endAt)}</p>
              </div>
              
              {scheduleDescription && (
                <div className="col-span-2 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Description</p>
                  <p className="text-sm">{scheduleDescription}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Approval Notes */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Approval Notes</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="approval-notes" className="text-sm">
                Add notes for the approver (optional)
              </Label>
              <Textarea
                id="approval-notes"
                value={approvalNotes}
                onChange={(e) => onUpdateNotes(e.target.value)}
                placeholder="Any additional information or context for the approval request..."
                rows={4}
                className="resize-none"
              />
            </div>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}