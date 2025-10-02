import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Clock,
  DollarSign,
  Users,
  ChevronDown,
  Calendar,
  CircleDot,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

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

export const MilestoneCard = ({ milestone, projectToken }: MilestoneCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = statusConfig[milestone.status as keyof typeof statusConfig];
  const StatusIcon = config.icon;

  const daysRemaining = Math.ceil((milestone.endingAt - Date.now()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysRemaining < 0;

  return (
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

        {/* Action Buttons based on status */}
        <div className="flex flex-wrap gap-2">
          {milestone.status === "INITIALIZED" && (
            <>
              <Button size="sm" variant="default">Fund Milestone</Button>
              <Button size="sm" variant="outline">Add Tasks</Button>
              <Button size="sm" variant="outline">Cancel</Button>
            </>
          )}
          {milestone.status === "FUNDED" && (
            <Button size="sm" variant="default">Mark for Review</Button>
          )}
          {milestone.status === "REVIEW" && (
            <>
              <Button size="sm" variant="default">Approve</Button>
              <Button size="sm" variant="outline">View Approvals</Button>
            </>
          )}
          {milestone.status === "APPROVED" && (
            <Button size="sm" variant="default">Release Funds</Button>
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
  );
};
