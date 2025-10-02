import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, DollarSign, Users, ChevronDown, Calendar, CircleDot, Edit, Wallet, Check, ArrowDownToLine, XCircle, TimerReset, Plus } from "lucide-react";
import { cn, formatTokenAmount } from "@/lib/utils";
import { EditMilestoneDialog } from "@/components/dialogs/EditMilestoneDialog";
import { FundMilestoneDialog } from "@/components/dialogs/FundMilestoneDialog";
import { ApproveDialog } from "@/components/dialogs/ApproveDialog";
import { WithdrawDialog } from "@/components/dialogs/WithdrawDialog";
import { TOKEN_ADDRESSES } from "@/lib/thirdweb";
import { StatusBadge } from "@/components/StatusBadge";

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
    initializerApprovalRequired?: boolean;
    initializerHasApproved?: boolean;
  };
  projectToken: string;
  onUpdate: (milestone: any) => void;
  isAdmin: boolean;
  isInitializer?: boolean;
  isPayee?: boolean;
  isProjectCompleted?: boolean;
  onFund?: () => Promise<void> | void;
  onApprove?: () => Promise<void> | void;
  onWithdraw?: () => Promise<void> | void;
  onMarkReview?: () => Promise<void> | void;
  onComplete?: () => Promise<void> | void;
  onRelease?: () => Promise<void> | void;
  onCancel?: () => Promise<void> | void;
  onExtendDeadline?: () => Promise<void> | void;
  onAddTasks?: () => Promise<void> | void;
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

export const MilestoneCard = ({ milestone, projectToken, onUpdate, isAdmin, isInitializer, isPayee, isProjectCompleted, onFund, onApprove, onWithdraw, onMarkReview, onComplete, onRelease, onCancel, onExtendDeadline, onAddTasks }: MilestoneCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [fundOpen, setFundOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const tokenDecimals = 18;

  const config = statusConfig[milestone.status as keyof typeof statusConfig];
  const StatusIcon = config.icon;

  const daysRemaining = Math.ceil((milestone.endingAt - Date.now()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysRemaining < 0;

  const handleFund = async () => {
    if (onFund) await onFund();
    else onUpdate({ ...milestone, status: "FUNDED" });
  };

  const handleApprove = async () => {
    if (onApprove) await onApprove();
    else onUpdate({ ...milestone, status: "APPROVED" });
  };

  const handleWithdraw = async () => {
    if (onWithdraw) await onWithdraw();
    else onUpdate({ ...milestone, status: "COMPLETED" });
  };

  const handleMarkReview = async () => {
    if (onMarkReview) await onMarkReview();
    else onUpdate({ ...milestone, status: "REVIEW" });
  };

  const handleComplete = async () => {
    if (onComplete) await onComplete();
    else onUpdate({ ...milestone, status: "APPROVED" });
  };

  const handleRelease = async () => {
    if (onRelease) await onRelease();
    else onUpdate({ ...milestone, status: "COMPLETED" });
  };

  const handleCancel = async () => {
    if (onCancel) await onCancel();
    else onUpdate({ ...milestone, status: "CANCELLED" });
  };

  const handleExtend = async () => {
    if (onExtendDeadline) await onExtendDeadline();
  };

  const handleAddTasks = async () => {
    if (onAddTasks) await onAddTasks();
  };

  const isLockedByProject = Boolean(isProjectCompleted);
  const canEdit = !milestone.editLocked && isAdmin && !isLockedByProject;
  const canFund = milestone.status === "INITIALIZED" && Boolean(isInitializer) && !isLockedByProject;
  const canMark = milestone.status === "FUNDED" && Boolean(isPayee) && !isLockedByProject;
  const canApprove = milestone.status === "REVIEW" && (Boolean(isInitializer) || Boolean(isAdmin)) && !isLockedByProject;
  const canComplete = milestone.status === "REVIEW" && (Boolean(isInitializer) || Boolean(isAdmin)) && !isLockedByProject;
  const canWithdraw = milestone.status === "APPROVED" && (Boolean(isInitializer) || isAdmin) && !isLockedByProject;
  const canRelease = milestone.status === "APPROVED" && (Boolean(isInitializer) || isAdmin) && !isLockedByProject;
  const canCancel = milestone.status === "INITIALIZED" && Boolean(isInitializer) && !isLockedByProject;
  const canExtend = (milestone.status === "INITIALIZED" || milestone.status === "FUNDED") && Boolean(isInitializer) && !isLockedByProject;
  const canAddTasks = (milestone.status === "INITIALIZED" || milestone.status === "FUNDED") && Boolean(isInitializer) && !isLockedByProject;

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
                <h3 className="text-lg font-semibold text-foreground">Milestone {milestone.index + 1}</h3>
                <div className="mt-1">
                  <StatusBadge status={milestone.status} />
                </div>
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
                {formatTokenAmount(milestone.amount, tokenDecimals, 4)} {projectToken}
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
            {canMark && (
              <Button variant="default" size="sm" onClick={handleMarkReview}>
                <Check className="h-3 w-3 mr-1" />
                Mark for Review
              </Button>
            )}
            {canApprove && (
              <Button variant="default" size="sm" onClick={() => setApproveOpen(true)}>
                <Check className="h-3 w-3 mr-1" />
                Approve
              </Button>
            )}
            {canComplete && (
              <Button variant="outline" size="sm" onClick={handleComplete}>
                <Check className="h-3 w-3 mr-1" />
                Complete
              </Button>
            )}
            {canWithdraw && (
              <Button variant="default" size="sm" onClick={() => setWithdrawOpen(true)}>
                <ArrowDownToLine className="h-3 w-3 mr-1" />
                Withdraw
              </Button>
            )}
            {canRelease && (
              <Button variant="default" size="sm" onClick={handleRelease}>
                <ArrowDownToLine className="h-3 w-3 mr-1" />
                Release Payment
              </Button>
            )}
            {canCancel && (
              <Button variant="destructive" size="sm" onClick={handleCancel}>
                <XCircle className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            )}
            {canExtend && (
              <Button variant="outline" size="sm" onClick={handleExtend}>
                <TimerReset className="h-3 w-3 mr-1" />
                Extend Deadline
              </Button>
            )}
            {canAddTasks && (
              <Button variant="outline" size="sm" onClick={handleAddTasks}>
                <Plus className="h-3 w-3 mr-1" />
                Add Tasks
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
              <h4 className="text-sm font-semibold mb-3 text-foreground">Approvals</h4>
              <div className="space-y-2">
                {milestone.approvers.length === 0 && (
                  <p className="text-xs text-muted-foreground">No approvers</p>
                )}
                {/* Placeholder approval UI: mark all approvers as pending (extend when on-chain approvals list is available) */}
                {milestone.approvers.map((approver, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                    <p className="font-mono text-xs text-foreground">{approver}</p>
                    <Badge variant="outline" className="bg-muted/50">Pending</Badge>
                  </div>
                ))}
                {Boolean(milestone.initializerApprovalRequired) && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                    <p className="font-mono text-xs text-foreground">Initializer</p>
                    <Badge variant="outline" className={cn("", milestone.initializerHasApproved ? "bg-success/10 text-success" : "bg-muted/50")}>{milestone.initializerHasApproved ? "Approved" : "Pending"}</Badge>
                  </div>
                )}
                {/* Basic approval progress until per-approver data is available */}
                <p className="text-xs text-muted-foreground pt-1">
                  Approvals: {milestone.initializerHasApproved ? 1 : 0} / {milestone.approvers.length + (milestone.initializerApprovalRequired ? 1 : 0)}
                </p>
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
