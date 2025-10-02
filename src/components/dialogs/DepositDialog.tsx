import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Wallet, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  token: string;
  onDeposit: (amount: number) => void;
}

export const DepositDialog = ({ open, onOpenChange, token, onDeposit }: DepositDialogProps) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");

  const handleDeposit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    onDeposit(parseFloat(amount));
    toast({
      title: "Deposit Successful",
      description: `${amount} ${token} has been deposited to the project vault`,
    });
    onOpenChange(false);
    setAmount("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Deposit Funds
          </DialogTitle>
          <DialogDescription>
            Add funds to the project vault
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Admin can deposit additional funds to the project vault
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="depositAmount">Amount ({token})</Label>
            <Input
              id="depositAmount"
              type="number"
              placeholder="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg"
            />
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
          <Button onClick={handleDeposit}>
            Deposit Funds
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
