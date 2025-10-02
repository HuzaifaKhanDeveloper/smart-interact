import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, DollarSign, Users, ChevronDown, Calendar, CircleDot, Edit, Wallet, Check, ArrowDownToLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditMilestoneDialog } from "@/components/dialogs/EditMilestoneDialog";
import { FundMilestoneDialog } from "@/components/dialogs/FundMilestoneDialog";
import { ApproveDialog } from "@/components/dialogs/ApproveDialog";
import { WithdrawDialog } from "@/components/dialogs/WithdrawDialog";

interface Task {
  title: string;
  description: string;
}

interface MilestoneCardProps {
  milestone: {
    index: number;
    amount: number;
    startingAt: number;
    endingAt: number;
    status: string;
    approvers: string[];
    tasks: Task[];
    editLocked: boolean;
  };
  projectToken: string;
  onUpdate: (milestone: any) => void;
  isAdmin: boolean;
}

const statusConfig = {
  INITIALIZED: {
    label: "Initialized",
    color: "bg-muted text-muted-foreground",
    icon: CircleDot,
  },
  FUNDED: {
    label: "Funded",
    color: "bg-primary/10 text-primary",
    icon: DollarSign,
  },
  REVIEW: {
    label: "In Review",
    color: "bg-warning/10 text-warning",
    icon: Clock,
  },
  APPROVED: {
    label: "Approved",
    color: "bg-success/10 text-success",
    icon: CheckCircle2,
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-success/10 text-success",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-destructive/10 text-destructive",
    icon: Clock,
  },
};

export const MilestoneCard = ({ milestone, projectToken, onUpdate, isAdmin }: MilestoneCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [fundOpen, setFundOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const config = statusConfig[milestone.status as keyof typeof statusConfig];
  const StatusIcon = config.icon;

  const daysRemaining = Math.ceil((milestone.endingAt - Date.now()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysRemaining < 0;

  const handleFund = () => {
    onUpdate({ ...milestone, status: "FUNDED" });
  };

  const handleApprove = () => {
    onUpdate({ ...milestone, status: "APPROVED" });
  };

  const handleWithdraw = () => {
    onUpdate({ ...milestone, status: "COMPLETED" });
  };

  const canEdit = !milestone.editLocked && isAdmin;
  const canFund = milestone.status === "INITIALIZED" && isAdmin;
  const canApprove = milestone.status === "REVIEW" && isAdmin;
  const canWithdraw = milestone.status === "APPROVED";

  return (
    <>
      <Card className="border-none shadow-card backdrop-blur-sm bg-gradient-card overflow-hidden">
        <div
          className="p-6 cursor-pointer hover:bg-muted/5 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", config.color)}>
                <StatusIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Milestone {milestone.index + 1}
                </h3>
                <Badge variant="outline" className={cn("mt-1", config.color)}>
                  {config.label}
                </Badge>
              </div>
            </div>

            <ChevronDown
              className={cn(
                "h-5 w-5 text-muted-foreground transition-transform",
                isExpanded && "rotate-180"
              )}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Amount
              </p>
              <p className="font-semibold text-foreground">
                ${milestone.amount.toLocaleString()} {projectToken}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Deadline
              </p>
              <p className={cn("text-sm font-medium", isOverdue && "text-destructive")}>
                {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days left`}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                Approvers
              </p>
              <p className="text-sm font-medium">{milestone.approvers.length}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Tasks</p>
              <p className="text-sm font-medium">{milestone.tasks.length}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
            )}
            {canFund && (
              <Button variant="default" size="sm" onClick={() => setFundOpen(true)}>
                <Wallet className="h-3 w-3 mr-1" />
                Fund Milestone
              </Button>
            )}
            {canApprove && (
              <Button variant="default" size="sm" onClick={() => setApproveOpen(true)}>
                <Check className="h-3 w-3 mr-1" />
                Approve
              </Button>
            )}
            {canWithdraw && (
              <Button variant="default" size="sm" onClick={() => setWithdrawOpen(true)}>
                <ArrowDownToLine className="h-3 w-3 mr-1" />
                Withdraw
              </Button>
            )}
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-6 pb-6 pt-0 space-y-4 border-t border-border/50">
            <div className="pt-4">
              <h4 className="text-sm font-semibold mb-3 text-foreground">Tasks</h4>
              <div className="space-y-2">
                {milestone.tasks.map((task, idx) => (
                  <Card key={idx} className="p-4 bg-background/50 border-border/50">
                    <h5 className="font-medium text-sm text-foreground mb-1">{task.title}</h5>
                    <p className="text-xs text-muted-foreground">{task.description}</p>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3 text-foreground">Approvers</h4>
              <div className="space-y-2">
                {milestone.approvers.map((approver, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                    <p className="font-mono text-xs text-foreground">{approver}</p>
                    <Badge variant="outline" className="bg-muted/50">
                      Pending
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Dialogs */}
      <EditMilestoneDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        milestone={milestone}
        onSave={onUpdate}
      />
      <FundMilestoneDialog
        open={fundOpen}
        onOpenChange={setFundOpen}
        milestone={milestone}
        token={projectToken}
        onFund={handleFund}
      />
      <ApproveDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        milestone={milestone}
        onApprove={handleApprove}
      />
      <WithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        milestone={milestone}
        token={projectToken}
        onWithdraw={handleWithdraw}
      />
    </>
  );
};
