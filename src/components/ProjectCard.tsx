import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatTokenAmount } from "@/lib/utils";
import { ArrowRight, CheckCircle2, Clock, Briefcase, Users, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/StatusBadge";

interface ProjectCardProps {
  project: {
    id: number;
    title: string;
    description: string;
    initializer: string;
    payee: string;
    token: string;
    completed: boolean;
    milestoneCount: number;
    activeMilestones: number;
    totalAmount: bigint;
    isInitializer?: boolean;
    isPayee?: boolean;
    isApprover?: boolean;
    pendingApprovals?: number;
  };
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  const progress = ((project.milestoneCount - project.activeMilestones) / project.milestoneCount) * 100;
  const navigate = useNavigate();

  // Determine user's role in this project
  const userRoles = [];
  if (project.isInitializer) userRoles.push("Creator");
  if (project.isPayee) userRoles.push("Worker");
  if (project.isApprover) userRoles.push("Approver");

  return (
    <Card className="group p-6 border-none shadow-card backdrop-blur-sm bg-gradient-card hover:shadow-elevated transition-all duration-300 cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
              {project.title}
            </h3>
            {/* Role indicators */}
            <div className="flex items-center gap-1">
              {project.isInitializer && (
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                  <Briefcase className="h-3 w-3 mr-1" />
                  Creator
                </Badge>
              )}
              {project.isPayee && (
                <Badge variant="outline" className="text-xs bg-secondary/10 text-secondary border-secondary/20">
                  <Users className="h-3 w-3 mr-1" />
                  Worker
                </Badge>
              )}
              {project.isApprover && (project.pendingApprovals || 0) > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {project.pendingApprovals} pending
                </Badge>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description}
          </p>
        </div>
        <div className="ml-2">
          <StatusBadge status={project.completed ? "COMPLETED" : "INITIALIZED"} />
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium text-foreground">
            {project.milestoneCount - project.activeMilestones} / {project.milestoneCount} Milestones
          </span>
        </div>
        <Progress value={progress} className="h-2" />

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Token</p>
            <Badge variant="outline" className="font-mono">
              {project.token}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Value</p>
            <p className="text-sm font-semibold text-foreground">
              {formatTokenAmount(project.totalAmount, 18, 4)} {project.token}
            </p>
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        className="w-full group-hover:bg-primary/10 group-hover:text-primary transition-colors"
        onClick={() => navigate(`/project/${project.id}`)}
      >
        View Details
        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
      </Button>
    </Card>
  );
};
