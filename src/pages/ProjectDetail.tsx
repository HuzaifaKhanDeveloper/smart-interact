import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { MilestoneCard } from "@/components/MilestoneCard";
import { MilestoneTimeline } from "@/components/MilestoneTimeline";
import { ArrowLeft, Plus, CheckCircle2, ExternalLink, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AddMilestoneDialog } from "@/components/dialogs/AddMilestoneDialog";
import { AddTaskDialog } from "@/components/dialogs/AddTaskDialog";
import { useParams } from "react-router-dom";
import { useActiveAccount, useReadContract, useSendTransaction } from "thirdweb/react";
import { readContract, prepareContractCall } from "thirdweb";
import { getDealblockContract, getErc20Contract, TOKEN_ADDRESSES } from "@/lib/thirdweb";
import { formatTokenAmount, DEFAULT_TOKEN_DECIMALS, parseTxErrorToMessage } from "@/lib/utils";
import { toast } from "sonner";
import { parseUnits } from "viem";

const parseMilestone = (raw: any, idx: number) => {
  const [amount, startingAt, endingAt, status, approversLen, editLocked, vault, token, payee, tasks, initializerApprovalRequired, initializerHasApproved] = raw;
  return {
    index: idx,
    amount: BigInt(amount ?? 0n),
    startingAt: Number(startingAt ?? 0n) * 1000,
    endingAt: Number(endingAt ?? 0n) * 1000,
    status: ["INITIALIZED","FUNDED","REVIEW","APPROVED","COMPLETED","CANCELLED"][Number(status ?? 0)] ?? "INITIALIZED",
    approvers: Array(approversLen ?? 0).fill(0).map((_, i) => `Approver ${i+1}`),
    tasks: (tasks ?? []).map((t: any) => ({ title: t.title, description: t.description })),
    editLocked: Boolean(editLocked),
    vaultAddress: vault,
    token,
    payee,
    initializerApprovalRequired: Boolean(initializerApprovalRequired),
    initializerHasApproved: Boolean(initializerHasApproved),
  } as any;
};

const ProjectDetail = () => {
  const navigate = useNavigate();
  const params = useParams();
  const account = useActiveAccount();
  const contract = useMemo(() => getDealblockContract(), []);
  const [project, setProject] = useState<any | null>(null);
  const { mutateAsync: sendTx } = useSendTransaction();

  const projectId = Number(params.id ?? 0);

  const { data: projectView } = useReadContract({
    contract,
    method: "getProject",
    params: [BigInt(projectId || 0)],
  });

  const load = async () => {
      if (!projectView) return;
      const [vault, initializer, payee, token, completed, milestoneCount] = projectView as any;
      const milestones: any[] = [];
      for (let i = 0; i < Number(milestoneCount ?? 0n); i++) {
        const m = await readContract({
          contract,
          method: "getMilestone",
          params: [BigInt(projectId), BigInt(i)],
        });
        milestones.push(parseMilestone(m, i));
      }
      setProject({
        id: projectId,
        title: `Project #${projectId}`,
        description: "",
        initializer,
        payee,
        vaultAddress: vault,
        token,
        completed: Boolean(completed),
        milestones,
      });
  };

  useEffect(() => {
    load();
  }, [projectView, contract, projectId]);

  // Lightweight polling for real-time-ish updates
  useEffect(() => {
    const id = setInterval(() => {
      load();
    }, 15000);
    return () => clearInterval(id);
  }, [projectId, contract, projectView]);
  const [addMilestoneOpen, setAddMilestoneOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  // derive admin from initializer (project creator)
  const isAdmin = useMemo(() => {
    if (!project || !account?.address) return false;
    return String(project.initializer).toLowerCase() === account.address.toLowerCase();
  }, [project, account]);

  const tokenDecimals = DEFAULT_TOKEN_DECIMALS;

  const tokenSymbol = useMemo(() => {
    if (!project?.token) return "";
    const entry = Object.entries(TOKEN_ADDRESSES).find(([, addr]) => addr.toLowerCase() === String(project.token).toLowerCase());
    return entry?.[0] || project.token;
  }, [project?.token]);

  const totalAmount: bigint = project ? project.milestones.reduce((sum: bigint, m: any) => sum + BigInt(m.amount), 0n) : 0n;
  const completedMilestones = project ? project.milestones.filter((m: any) => m.status === "COMPLETED").length : 0;
  const progress = project && project.milestones.length > 0 ? (completedMilestones / project.milestones.length) * 100 : 0;

  const handleAddMilestone = async (newMilestone: { amount: string; endingAt: number; tasks: Array<{ title: string; description: string }>; approvers: string[]; }) => {
    if (!project) return;
    try {
      if (!account?.address) throw new Error("Connect wallet");
      const titles = newMilestone.tasks.map((t) => t.title);
      const descriptions = newMilestone.tasks.map((t) => t.description);
      const amountWei = parseUnits(newMilestone.amount, 18);
      const tx = prepareContractCall({
        contract,
        method: "add_Milestone",
        params: [
          BigInt(project.id),
          BigInt(Math.floor(newMilestone.endingAt / 1000)),
          titles,
          descriptions,
          amountWei,
          newMilestone.approvers as unknown as `0x${string}`[],
        ],
      });
      await sendTx(tx);
      toast.success("Milestone created on-chain");
    } catch (e: any) {
      toast.error(e?.shortMessage || e?.message || "Create milestone failed");
    }
  };

  const handleUpdateMilestone = (index: number, updatedMilestone: any) => {
    if (!project) return;
    const newMilestones = [...project.milestones];
    newMilestones[index] = updatedMilestone;
    setProject({ ...project, milestones: newMilestones });
  };

  const ensureAllowance = async (tokenAddress: string, owner: string, spender: string, required: bigint) => {
    const token = getErc20Contract(tokenAddress);
    const current = await readContract({
      contract: token,
      method: "allowance",
      params: [owner as `0x${string}` , spender as `0x${string}`],
    });
    const allowance = BigInt(current as any);
    if (allowance < required) {
      const approveTx = prepareContractCall({
        contract: token,
        method: "approve",
        params: [spender as `0x${string}`, required],
      });
      await sendTx(approveTx);
    }
  };

  // Deposit functionality removed in favor of fund_Milestone

  const callFundMilestone = async (milestoneIndex: number) => {
    if (!project) return;
    try {
      if (!account?.address) throw new Error("Connect wallet");
      // Enforce EXACT balance and allowance equals milestone amount
      const required = BigInt(project.milestones[milestoneIndex].amount);
      // balance check
      const token = getErc20Contract(project.token);
      const bal = await readContract({ contract: token, method: "balanceOf", params: [account.address as `0x${string}`] });
      if (BigInt(bal as any) < required) {
        throw new Error("Insufficient token balance for this milestone amount");
      }
      await ensureAllowance(
        project.token,
        account.address,
        contract.address,
        required
      );
    const tx = prepareContractCall({
      contract,
      method: "fund_Milestone",
      params: [BigInt(project.id), BigInt(milestoneIndex)],
    });
    await sendTx(tx);
    await load();
    toast.success("Milestone funded");
    } catch (e: any) {
      toast.error(parseTxErrorToMessage(e));
    }
  };

  const callApproveMilestone = async (milestoneIndex: number) => {
    if (!project) return;
    try {
      const tx = prepareContractCall({
        contract,
        method: "approve_Milestone",
        params: [BigInt(project.id), BigInt(milestoneIndex)],
      });
      await sendTx(tx);
      toast.success("Milestone approved");
    } catch (e: any) {
      toast.error(parseTxErrorToMessage(e));
    }
  };

  const callMarkForReview = async (milestoneIndex: number) => {
    if (!project) return;
    try {
      const tx = prepareContractCall({
        contract,
        method: "mark_Milestone_For_Review",
        params: [BigInt(project.id), BigInt(milestoneIndex)],
      });
      await sendTx(tx);
      await load();
      toast.success("Marked for review");
    } catch (e: any) {
      toast.error(parseTxErrorToMessage(e));
    }
  };

  const callCompleteMilestone = async (milestoneIndex: number) => {
    if (!project) return;
    try {
      const tx = prepareContractCall({
        contract,
        method: "complete_Milestone",
        params: [BigInt(project.id), BigInt(milestoneIndex)],
      });
      await sendTx(tx);
      await load();
      toast.success("Milestone completed");
    } catch (e: any) {
      toast.error(parseTxErrorToMessage(e));
    }
  };
  const callAddTask = async (milestoneIndex: number, tasks: Array<{ title: string; description: string }>) => {
    if (!project) return;
    try {
      const titles = tasks.map((t) => t.title);
      const descriptions = tasks.map((t) => t.description);
      const tx = prepareContractCall({
        contract,
        method: "add_Task",
        params: [BigInt(project.id), BigInt(milestoneIndex), titles, descriptions],
      });
      await sendTx(tx);
      toast.success("Tasks added");
    } catch (e: any) {
      toast.error(parseTxErrorToMessage(e));
    }
  };

  const callFundRelease = async (milestoneIndex: number) => {
    if (!project) return;
    try {
      const tx = prepareContractCall({
        contract,
        method: "fund_Release",
        params: [BigInt(project.id), BigInt(milestoneIndex)],
      });
      await sendTx(tx);
      await load();
      toast.success("Funds released");
    } catch (e: any) {
      toast.error(parseTxErrorToMessage(e));
    }
  };

  const callCancelMilestone = async (milestoneIndex: number) => {
    if (!project) return;
    try {
      const tx = prepareContractCall({
        contract,
        method: "cancel_Milestone",
        params: [BigInt(project.id), BigInt(milestoneIndex)],
      });
      await sendTx(tx);
      await load();
      toast.success("Milestone cancelled");
    } catch (e: any) {
      toast.error(parseTxErrorToMessage(e));
    }
  };

  const callIncreaseDeadline = async (milestoneIndex: number, newEndingAt: number) => {
    if (!project) return;
    try {
      const tx = prepareContractCall({
        contract,
        method: "increase_Deadline",
        params: [BigInt(project.id), BigInt(milestoneIndex), BigInt(Math.floor(newEndingAt / 1000))],
      });
      await sendTx(tx);
      await load();
      toast.success("Deadline extended");
    } catch (e: any) {
      toast.error(parseTxErrorToMessage(e));
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <header className="border-b border-border/50 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" className="gap-2" onClick={() => navigate("/")}> 
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-6 py-8">
          <Card className="p-8 border-none shadow-elevated backdrop-blur-sm bg-gradient-card">
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-48 bg-muted rounded" />
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-2/3 bg-muted rounded" />
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" className="gap-2" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Button variant="default" className="gap-2" onClick={() => setAddMilestoneOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Add Milestone
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Project Header */}
        <Card className="p-8 border-none shadow-elevated backdrop-blur-sm bg-gradient-card mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-3xl font-bold text-foreground">{project.title}</h1>
                <Badge variant={project.completed ? "default" : "secondary"}>
                  {project.completed ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Completed
                    </span>
                  ) : (
                    "Active"
                  )}
                </Badge>
              </div>
              <p className="text-muted-foreground mb-6">{project.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Token</p>
                  <Badge variant="outline" className="font-mono">{tokenSymbol}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total Value</p>
                  <p className="text-lg font-semibold text-foreground">{formatTokenAmount(totalAmount, tokenDecimals, 4)} {tokenSymbol}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Vault Address</p>
                  <div className="flex items-center gap-1">
                    <a
                      href={`https://sepolia.etherscan.io/address/${project.vaultAddress}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-mono text-foreground hover:underline"
                    >
                      {project.vaultAddress.slice(0, 10)}...
                    </a>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:w-80">
              <Card className="p-4 bg-background/50">
                <p className="text-sm text-muted-foreground mb-2">Overall Progress</p>
                <div className="flex items-center gap-3 mb-2">
                  <Progress value={progress} className="flex-1 h-2" />
                  <span className="text-sm font-medium">{Math.round(progress)}%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {completedMilestones} of {project.milestones.length} milestones completed
                </p>
                {project && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>
                      <p className="uppercase tracking-wide">Initializer</p>
                      <p className="font-mono text-foreground truncate">{project.initializer}</p>
                    </div>
                    <div>
                      <p className="uppercase tracking-wide">Payee</p>
                      <p className="font-mono text-foreground truncate">{project.payee}</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="milestones" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="milestones" className="space-y-6">
            {project.milestones.map((milestone, index) => (
              <MilestoneCard
                key={milestone.index}
                milestone={milestone}
                projectToken={project.token}
                isInitializer={String(project.initializer).toLowerCase() === (account?.address || "").toLowerCase()}
                isPayee={String(project.payee).toLowerCase() === (account?.address || "").toLowerCase()}
                onUpdate={(updated) => handleUpdateMilestone(index, updated)}
                onFund={() => callFundMilestone(index)}
                onApprove={() => callApproveMilestone(index)}
                onMarkReview={() => callMarkForReview(index)}
                onComplete={() => callCompleteMilestone(index)}
                onWithdraw={() => callFundRelease(index)}
                onRelease={() => callFundRelease(index)}
                onCancel={() => callCancelMilestone(index)}
                onExtendDeadline={() => {
                  const current = milestone.endingAt;
                  const next = current + 7 * 24 * 60 * 60 * 1000; // +7 days
                  return callIncreaseDeadline(index, next);
                }}
                onAddTasks={() => setAddTaskOpen(true)}
                isAdmin={isAdmin}
                isProjectCompleted={project.completed}
              />
            ))}
            {/* Add tasks to first milestone when initialized/funded */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAddTaskOpen(true)}>Add Tasks</Button>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <MilestoneTimeline milestones={project.milestones} projectToken={tokenSymbol} />
          </TabsContent>

          <TabsContent value="details">
            <Card className="p-6 border-none shadow-card backdrop-blur-sm bg-gradient-card">
              <h3 className="text-lg font-semibold mb-4">Project Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Project ID</p>
                    <p className="font-mono text-sm">{project.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Initializer</p>
                    <p className="font-mono text-sm">{project.initializer}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Payee</p>
                    <p className="font-mono text-sm">{project.payee}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Vault Address</p>
                    <p className="font-mono text-sm">{project.vaultAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Payment Token</p>
                    <p className="font-mono text-sm">{project.token}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <p className="text-sm">{project.completed ? "Completed" : "In Progress"}</p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card className="p-6 border-none shadow-card backdrop-blur-sm bg-gradient-card">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <p className="text-muted-foreground">Activity timeline will appear here...</p>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <AddMilestoneDialog
        open={addMilestoneOpen}
        onOpenChange={setAddMilestoneOpen}
        onAdd={handleAddMilestone}
      />
      {/* Deposit dialog removed */}
      <AddTaskDialog
        open={addTaskOpen}
        onOpenChange={setAddTaskOpen}
        onAdd={(tasks) => callAddTask(0, tasks)}
      />
    </div>
  );
};

export default ProjectDetail;
