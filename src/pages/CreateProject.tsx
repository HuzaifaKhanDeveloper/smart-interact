import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { prepareContractCall } from "thirdweb";
import { getDealblockContract, TOKEN_ADDRESSES } from "@/lib/thirdweb";
import { parseUnits } from "viem";
import { toast } from "sonner";
import { DEFAULT_TOKEN_DECIMALS, parseAddress, ZERO_ADDRESS } from "@/lib/utils";

interface Task {
  title: string;
  description: string;
}

const CreateProject = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([{ title: "", description: "" }]);
  const [approvers, setApprovers] = useState<string[]>([""]);
  const account = useActiveAccount();
  const { mutateAsync: sendTx, isPending } = useSendTransaction();

  const addTask = () => {
    setTasks([...tasks, { title: "", description: "" }]);
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const updateTask = (index: number, field: keyof Task, value: string) => {
    const newTasks = [...tasks];
    newTasks[index][field] = value;
    setTasks(newTasks);
  };

  const addApprover = () => {
    setApprovers([...approvers, ""]);
  };

  const removeApprover = (index: number) => {
    setApprovers(approvers.filter((_, i) => i !== index));
  };

  const updateApprover = (index: number, value: string) => {
    const newApprovers = [...approvers];
    newApprovers[index] = value;
    setApprovers(newApprovers);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const payeeInput = String(formData.get("payee") || "").trim();
    const tokenSymbol = String(formData.get("token") || "").trim();
    const amountStr = String(formData.get("amount") || "0").trim();
    const deadlineStr = String(formData.get("deadline") || "").trim();

    if (!account) {
      toast.error("Please connect your wallet");
      return;
    }
    if (!title || !description || !payeeInput || !tokenSymbol || !deadlineStr) {
      toast.error("Please fill all required fields");
      return;
    }
    const token = TOKEN_ADDRESSES[tokenSymbol as keyof typeof TOKEN_ADDRESSES];
    if (!token) {
      toast.error("Invalid token selected");
      return;
    }

    let amount: bigint;
    try {
      amount = parseUnits(amountStr || "0", DEFAULT_TOKEN_DECIMALS);
      if (amount <= 0n) throw new Error("amount");
    } catch {
      toast.error("Enter a valid milestone amount");
      return;
    }
    const deadline = BigInt(Math.floor(new Date(deadlineStr).getTime() / 1000));
    const now = BigInt(Math.floor(Date.now() / 1000));
    if (deadline <= now) {
      toast.error("Deadline must be in future");
      return;
    }
    const taskTitles = tasks.map((t) => t.title);
    const taskDescriptions = tasks.map((t) => t.description);
    const validApprovers = approvers
      .map((a) => parseAddress(a || ""))
      .filter((a): a is string => Boolean(a));
    if (validApprovers.length === 0) {
      toast.error("Add at least one approver");
      return;
    }
    if (new Set(validApprovers.map((a) => a.toLowerCase())).size !== validApprovers.length) {
      toast.error("Duplicate approvers");
      return;
    }

    const payee = parseAddress(payeeInput);
    if (!payee || payee === ZERO_ADDRESS) {
      toast.error("Invalid payee address");
      return;
    }
    if (taskTitles.length !== taskDescriptions.length) {
      toast.error("Tasks mismatch");
      return;
    }

    const contract = getDealblockContract();
    const tx = prepareContractCall({
      contract,
      method: "initialize_Project",
      params: [
        payee,
        token,
        deadline,
        title,
        description,
        taskTitles,
        taskDescriptions,
        amount,
        validApprovers,
      ],
    });
    try {
      await sendTx(tx);
      toast.success("Project created on-chain");
      navigate("/");
    } catch (err: any) {
      toast.error(err?.shortMessage || err?.message || "Transaction failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <Button variant="ghost" className="gap-2" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Create New Project</h1>
          <p className="text-muted-foreground">
            Initialize a new project with milestones and tasks
          </p>
        </div>

        <form className="space-y-6" onSubmit={onSubmit}>
          {/* Project Details */}
          <Card className="p-6 border-none shadow-card backdrop-blur-sm bg-gradient-card">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Project Details</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Project Title *</Label>
                <Input id="title" name="title" placeholder="Enter project title" className="mt-1.5" />
              </div>

              <div>
                <Label htmlFor="description">Project Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe the project objectives and deliverables"
                  rows={4}
                  className="mt-1.5"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="payee">Payee Address *</Label>
                  <Input
                    id="payee"
                    name="payee"
                    placeholder="0x..."
                    className="mt-1.5 font-mono text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="token">Payment Token *</Label>
                  <Select name="token">
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select token" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USDC">USDC</SelectItem>
                      <SelectItem value="USDT">USDT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Card>

          {/* First Milestone */}
          <Card className="p-6 border-none shadow-card backdrop-blur-sm bg-gradient-card">
            <h2 className="text-xl font-semibold mb-4 text-foreground">First Milestone</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Milestone Amount *</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    placeholder="5000"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="deadline">Deadline *</Label>
                  <Input
                    id="deadline"
                    name="deadline"
                    type="date"
                    className="mt-1.5"
                  />
                </div>
              </div>

              {/* Tasks */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Tasks *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addTask} className="gap-1">
                    <Plus className="h-3 w-3" />
                    Add Task
                  </Button>
                </div>

                <div className="space-y-3">
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
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTask(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Approvers */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Approvers *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addApprover} className="gap-1">
                    <Plus className="h-3 w-3" />
                    Add Approver
                  </Button>
                </div>

                <div className="space-y-2">
                  {approvers.map((approver, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="0x..."
                        value={approver}
                        onChange={(e) => updateApprover(index, e.target.value)}
                        className="font-mono text-sm"
                      />
                      {approvers.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeApprover(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="submit" size="lg" className="flex-1" disabled={isPending || !account}>
              {isPending ? "Initializing..." : "Initialize Project"}
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => navigate("/")}>
              Cancel
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateProject;
