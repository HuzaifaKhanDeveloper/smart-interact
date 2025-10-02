import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";

interface ApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestone: any;
  onApprove: () => void;
}

export const ApproveDialog = ({ open, onOpenChange, milestone, onApprove }: ApproveDialogProps) => {
  const { toast } = useToast();
  const [notes, setNotes] = useState("");

  const handleApprove = () => {
    onApprove();
    toast({
      title: "Milestone Approved",
      description: "Your approval has been recorded",
    });
    onOpenChange(false);
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Approve Milestone
          </DialogTitle>
          <DialogDescription>
            Review and approve the milestone completion
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              Amount: <span className="font-semibold text-foreground">${milestone?.amount}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Tasks Completed: <span className="font-semibold text-foreground">{milestone?.tasks?.length || 0}</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Approval Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any comments about this approval..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApprove}>
            Approve & Sign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
