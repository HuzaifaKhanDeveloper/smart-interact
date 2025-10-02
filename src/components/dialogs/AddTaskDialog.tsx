import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { Card } from "@/components/ui/card";

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (tasks: Array<{ title: string; description: string }>) => void;
}

export const AddTaskDialog = ({ open, onOpenChange, onAdd }: AddTaskDialogProps) => {
  const [tasks, setTasks] = useState([{ title: "", description: "" }]);

  const addTask = () => setTasks([...tasks, { title: "", description: "" }]);
  const removeTask = (index: number) => setTasks(tasks.filter((_, i) => i !== index));
  const updateTask = (index: number, field: "title" | "description", value: string) => {
    const next = [...tasks];
    next[index][field] = value;
    setTasks(next);
  };

  const submit = () => {
    const filtered = tasks.filter((t) => t.title.trim());
    onAdd(filtered);
    onOpenChange(false);
    setTasks([{ title: "", description: "" }]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Tasks</DialogTitle>
          <DialogDescription>Add additional tasks to this milestone</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Tasks</Label>
            <Button type="button" variant="outline" size="sm" onClick={addTask} className="gap-1">
              <Plus className="h-3 w-3" /> Add Task
            </Button>
          </div>

          {tasks.map((task, index) => (
            <Card key={index} className="p-4 bg-background/50 border-border/50">
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-3">
                  <Input
                    placeholder="Task title"
                    value={task.title}
                    onChange={(e) => updateTask(index, "title", e.target.value)}
                  />
                  <Textarea
                    placeholder="Task description"
                    value={task.description}
                    onChange={(e) => updateTask(index, "description", e.target.value)}
                    rows={2}
                  />
                </div>
                {tasks.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeTask(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Add Tasks</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


