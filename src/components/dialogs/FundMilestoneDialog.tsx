import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Wallet } from "lucide-react";

interface FundMilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestone: any;
  token: string;
  onFund: () => void;
}

export const FundMilestoneDialog = ({ open, onOpenChange, milestone, token, onFund }: FundMilestoneDialogProps) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState(milestone?.amount?.toString() || "");

  const handleFund = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    onFund();
    toast({
      title: "Milestone Funded",
      description: `Successfully funded ${amount} ${token}`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Fund Milestone
          </DialogTitle>
          <DialogDescription>
            Transfer funds to this milestone's vault
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fundAmount">Amount ({token})</Label>
            <Input
              id="fundAmount"
              type="number"
              placeholder="5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg"
            />
            <p className="text-xs text-muted-foreground">
              Required amount: {milestone?.amount} {token}
            </p>
          </div>

          <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Your Balance:</span>
              <span className="font-mono font-medium">10,000 {token}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Network Fee:</span>
              <span className="font-mono">~0.5 {token}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleFund}>
            Fund Milestone
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
