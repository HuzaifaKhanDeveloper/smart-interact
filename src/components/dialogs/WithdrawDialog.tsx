import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Wallet, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestone: any;
  token: string;
  onWithdraw: () => void;
}

export const WithdrawDialog = ({ open, onOpenChange, milestone, token, onWithdraw }: WithdrawDialogProps) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState(milestone?.amount?.toString() || "");

  const handleWithdraw = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    onWithdraw();
    toast({
      title: "Withdrawal Successful",
      description: `${amount} ${token} has been withdrawn to your wallet`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Withdraw Funds
          </DialogTitle>
          <DialogDescription>
            Withdraw approved milestone funds to your wallet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Only approved milestones can be withdrawn by the payee
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="withdrawAmount">Amount ({token})</Label>
            <Input
              id="withdrawAmount"
              type="number"
              placeholder="5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg"
            />
            <p className="text-xs text-muted-foreground">
              Available: {milestone?.amount} {token}
            </p>
          </div>

          <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Recipient:</span>
              <span className="font-mono text-xs">0x1234...5678</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Network Fee:</span>
              <span className="font-mono">~0.3 {token}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleWithdraw}>
            Withdraw Funds
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
