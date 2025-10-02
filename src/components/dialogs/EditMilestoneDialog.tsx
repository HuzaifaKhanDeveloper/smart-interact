import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EditMilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestone: any;
  onSave: (milestone: any) => void;
}

export const EditMilestoneDialog = ({ open, onOpenChange, milestone, onSave }: EditMilestoneDialogProps) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tasks, setTasks] = useState<Array<{ title: string; description: string }>>([]);
  const [approvers, setApprovers] = useState<string[]>([]);

  useEffect(() => {
    if (milestone) {
      setAmount(milestone.amount?.toString() || "");
      setStartDate(milestone.startingAt ? new Date(milestone.startingAt).toISOString().split('T')[0] : "");
      setEndDate(milestone.endingAt ? new Date(milestone.endingAt).toISOString().split('T')[0] : "");
      setTasks(milestone.tasks || [{ title: "", description: "" }]);
      setApprovers(milestone.approvers || [""]);
    }
  }, [milestone]);

  const handleAddTask = () => {
    setTasks([...tasks, { title: "", description: "" }]);
  };

  const handleRemoveTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleTaskChange = (index: number, field: 'title' | 'description', value: string) => {
    const newTasks = [...tasks];
    newTasks[index][field] = value;
    setTasks(newTasks);
  };

  const handleAddApprover = () => {
    setApprovers([...approvers, ""]);
  };

  const handleRemoveApprover = (index: number) => {
    setApprovers(approvers.filter((_, i) => i !== index));
  };

  const handleApproverChange = (index: number, value: string) => {
    const newApprovers = [...approvers];
    newApprovers[index] = value;
    setApprovers(newApprovers);
  };

  const handleSubmit = () => {
    if (!amount || !startDate || !endDate) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const updatedMilestone = {
      ...milestone,
      amount: parseFloat(amount),
      startingAt: new Date(startDate).getTime(),
      endingAt: new Date(endDate).getTime(),
      tasks: tasks.filter(t => t.title),
      approvers: approvers.filter(a => a)
    };

    onSave(updatedMilestone);
    toast({
      title: "Milestone Updated",
      description: "Milestone has been updated successfully"
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Milestone</DialogTitle>
          <DialogDescription>
            Update milestone details, tasks, and approvers
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USDC)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Tasks</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddTask}>
                <Plus className="h-4 w-4 mr-1" />
                Add Task
              </Button>
            </div>
            {tasks.map((task, index) => (
              <div key={index} className="space-y-2 p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Task {index + 1}</Label>
                  {tasks.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTask(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Input
                  placeholder="Task title"
                  value={task.title}
                  onChange={(e) => handleTaskChange(index, 'title', e.target.value)}
                />
                <Textarea
                  placeholder="Task description"
                  value={task.description}
                  onChange={(e) => handleTaskChange(index, 'description', e.target.value)}
                  rows={2}
                />
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Approvers (Wallet Addresses)</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddApprover}>
                <Plus className="h-4 w-4 mr-1" />
                Add Approver
              </Button>
            </div>
            {approvers.map((approver, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="0x..."
                  value={approver}
                  onChange={(e) => handleApproverChange(index, e.target.value)}
                  className="font-mono text-sm"
                />
                {approvers.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveApprover(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
