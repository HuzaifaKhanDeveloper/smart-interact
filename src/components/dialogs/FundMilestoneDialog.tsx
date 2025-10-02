import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { parseUnits } from "viem";
import { TOKEN_ADDRESSES } from "@/lib/thirdweb";
import { formatTokenAmount } from "@/lib/utils";
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
  const tokenDecimals = 18;
  const [amount, setAmount] = useState(milestone?.amount ? formatTokenAmount(milestone.amount, tokenDecimals, 6) : "");
  const [txState, setTxState] = useState<"idle" | "pending" | "confirming" | "success" | "error">("idle");
  const [txMessage, setTxMessage] = useState<string>("");

  const handleFund = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }
    try {
      setTxState("pending");
      setTxMessage("Sign transactions in your wallet (approval may be requested if needed)...");
      await Promise.resolve(onFund?.());
      setTxState("confirming");
      setTxMessage("Waiting for confirmations on-chain...");
      // Note: onFund includes both approval (if required) and funding, and awaits confirmations
      setTxState("success");
      toast({
        title: "Milestone Funded",
        description: `Successfully funded ${amount} ${token}`,
      });
      onOpenChange(false);
    } catch (e: any) {
      setTxState("error");
      toast({ title: "Funding failed", description: e?.shortMessage || e?.message || "Transaction failed", variant: "destructive" });
    } finally {
      setTxMessage("");
      setTxState("idle");
    }
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
              Required amount: {formatTokenAmount(milestone?.amount ?? 0, tokenDecimals, 6)} {token}
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
            {txState !== "idle" && (
              <div className="text-xs text-muted-foreground pt-1">
                {txState === "pending" && (txMessage || "Awaiting your signature...")}
                {txState === "confirming" && (txMessage || "Waiting for on-chain confirmations...")}
                {txState === "success" && "Success!"}
                {txState === "error" && "Something went wrong."}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground/80">Note: If allowance is insufficient, you'll be prompted to approve token spending, then funding will proceed.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={txState === "pending" || txState === "confirming"}>
            Cancel
          </Button>
          <Button onClick={handleFund} disabled={txState === "pending" || txState === "confirming"}>
            {txState === "pending" ? "Confirm in Wallet" : txState === "confirming" ? "Confirming..." : "Fund Milestone"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
