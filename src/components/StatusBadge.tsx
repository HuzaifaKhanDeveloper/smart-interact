import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock, DollarSign, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig = {
  INITIALIZED: {
    label: "Initialized",
    icon: Circle,
    className: "bg-muted/50 text-muted-foreground border-muted-foreground/20",
  },
  FUNDED: {
    label: "Funded",
    icon: DollarSign,
    className: "bg-primary/10 text-primary border-primary/20",
  },
  REVIEW: {
    label: "In Review",
    icon: Clock,
    className: "bg-warning/10 text-warning border-warning/20",
  },
  APPROVED: {
    label: "Approved",
    icon: CheckCircle2,
    className: "bg-success/10 text-success border-success/20",
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-success/10 text-success border-success/20",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.INITIALIZED;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
};
