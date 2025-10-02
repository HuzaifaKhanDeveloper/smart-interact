import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { formatTokenAmount, DEFAULT_TOKEN_DECIMALS } from "@/lib/utils";
import { CheckCircle2, Clock, DollarSign, Circle, XCircle, Calendar, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface Milestone {
  index: number;
  amount: bigint;
  startingAt: number;
  endingAt: number;
  status: string;
  approvers: string[];
  tasks: Array<{ title: string; description: string }>;
  editLocked: boolean;
  initializerApprovalRequired?: boolean;
  initializerHasApproved?: boolean;
}

interface MilestoneTimelineProps {
  milestones: Milestone[];
  projectToken: string;
  className?: string;
}

const statusIcons = {
  INITIALIZED: Circle,
  FUNDED: DollarSign,
  REVIEW: Clock,
  APPROVED: CheckCircle2,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
};

const statusColors = {
  INITIALIZED: "text-muted-foreground bg-muted/20",
  FUNDED: "text-primary bg-primary/10",
  REVIEW: "text-warning bg-warning/10",
  APPROVED: "text-success bg-success/10",
  COMPLETED: "text-success bg-success/20",
  CANCELLED: "text-destructive bg-destructive/10",
};

export const MilestoneTimeline = ({ milestones, projectToken, className }: MilestoneTimelineProps) => {
  if (!milestones || milestones.length === 0) {
    return (
      <Card className="p-6 border-none shadow-card backdrop-blur-sm bg-gradient-card">
        <div className="text-center text-muted-foreground">
          <Circle className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No milestones yet</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("p-6 border-none shadow-card backdrop-blur-sm bg-gradient-card", className)}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">Project Timeline</h3>
        <p className="text-sm text-muted-foreground">
          Track milestone progression and completion status
        </p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/20 via-primary/40 to-primary/20" />
        
        <div className="space-y-8">
          {milestones.map((milestone, index) => {
            const StatusIcon = statusIcons[milestone.status as keyof typeof statusIcons] || Circle;
            const isLast = index === milestones.length - 1;
            const isCompleted = milestone.status === "COMPLETED";
            const isActive = milestone.status === "FUNDED" || milestone.status === "REVIEW" || milestone.status === "APPROVED";
            const isOverdue = milestone.endingAt < Date.now();
            
            return (
              <div key={milestone.index} className="relative flex items-start gap-6 group">
                {/* Timeline node */}
                <div className="relative z-10 flex-shrink-0">
                  <div
                    className={cn(
                      "w-16 h-16 rounded-full border-4 border-background shadow-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                      statusColors[milestone.status as keyof typeof statusColors],
                      isActive && "animate-pulse",
                      isCompleted && "ring-2 ring-success/30"
                    )}
                  >
                    <StatusIcon className="h-6 w-6" />
                  </div>
                  
                  {/* Milestone number badge */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shadow-md">
                    {milestone.index + 1}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-8">
                  <div className="bg-background/50 backdrop-blur-sm rounded-xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 group-hover:border-primary/20">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-foreground mb-2">
                          Milestone {milestone.index + 1}
                        </h4>
                        <StatusBadge status={milestone.status} />
                      </div>
                      
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">
                          {formatTokenAmount(milestone.amount, DEFAULT_TOKEN_DECIMALS, 2)} {projectToken}
                        </p>
                        <p className="text-xs text-muted-foreground">Amount</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">
                            {new Date(milestone.endingAt).toLocaleDateString()}
                          </p>
                          <p className={cn(
                            "text-xs",
                            isOverdue ? "text-destructive" : "text-muted-foreground"
                          )}>
                            {isOverdue ? "Overdue" : "Deadline"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">
                            {milestone.approvers.length} approvers
                          </p>
                          <p className="text-xs text-muted-foreground">Required</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">
                            {milestone.tasks.length} tasks
                          </p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                      </div>
                    </div>

                    {/* Approval progress */}
                    {milestone.status === "REVIEW" && (
                      <div className="bg-warning/5 border border-warning/20 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-warning font-medium">Pending Approvals</span>
                          <span className="text-warning">
                            {milestone.initializerHasApproved ? 1 : 0} / {milestone.approvers.length + (milestone.initializerApprovalRequired ? 1 : 0)}
                          </span>
                        </div>
                        <div className="mt-2 w-full bg-warning/10 rounded-full h-2">
                          <div 
                            className="bg-warning h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${((milestone.initializerHasApproved ? 1 : 0) / (milestone.approvers.length + (milestone.initializerApprovalRequired ? 1 : 0))) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Task preview */}
                    {milestone.tasks.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">Tasks:</p>
                        <div className="space-y-1">
                          {milestone.tasks.slice(0, 2).map((task, taskIndex) => (
                            <div key={taskIndex} className="flex items-center gap-2 text-sm">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                              <span className="text-muted-foreground truncate">{task.title}</span>
                            </div>
                          ))}
                          {milestone.tasks.length > 2 && (
                            <p className="text-xs text-muted-foreground ml-3">
                              +{milestone.tasks.length - 2} more tasks
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
