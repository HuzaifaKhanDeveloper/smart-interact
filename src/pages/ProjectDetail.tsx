import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { MilestoneCard } from "@/components/MilestoneCard";
import { ArrowLeft, Plus, CheckCircle2, ExternalLink, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AddMilestoneDialog } from "@/components/dialogs/AddMilestoneDialog";
import { DepositDialog } from "@/components/dialogs/DepositDialog";

// Mock data
const mockProject = {
  id: 1,
  title: "Website Redesign Project",
  description: "Complete redesign of company website with modern UI/UX, including responsive design, performance optimization, and accessibility improvements.",
  initializer: "0x1234567890abcdef1234567890abcdef12345678",
  payee: "0x8765432109fedcba8765432109fedcba87654321",
  vaultAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
  token: "USDC",
  completed: false,
  milestones: [
    {
      index: 0,
      amount: 5000,
      startingAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
      endingAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      status: "REVIEW",
      approvers: ["0x1111111111111111111111111111111111111111", "0x2222222222222222222222222222222222222222"],
      tasks: [
        { title: "Design System Setup", description: "Create comprehensive design system with components" },
        { title: "Homepage Redesign", description: "Design and implement new homepage" },
        { title: "Mobile Responsiveness", description: "Ensure all pages are mobile-friendly" },
      ],
      editLocked: true,
    },
    {
      index: 1,
      amount: 5000,
      startingAt: Date.now(),
      endingAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
      status: "FUNDED",
      approvers: ["0x1111111111111111111111111111111111111111", "0x2222222222222222222222222222222222222222"],
      tasks: [
        { title: "About Page", description: "Redesign about page with team section" },
        { title: "Contact Form", description: "Implement new contact form with validation" },
      ],
      editLocked: true,
    },
    {
      index: 2,
      amount: 5000,
      startingAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
      endingAt: Date.now() + 28 * 24 * 60 * 60 * 1000,
      status: "INITIALIZED",
      approvers: ["0x1111111111111111111111111111111111111111", "0x2222222222222222222222222222222222222222"],
      tasks: [
        { title: "Testing & QA", description: "Comprehensive testing across browsers" },
        { title: "Documentation", description: "Create user and developer documentation" },
        { title: "Deployment", description: "Deploy to production environment" },
      ],
      editLocked: false,
    },
  ],
};

const ProjectDetail = () => {
  const navigate = useNavigate();
  const [project, setProject] = useState(mockProject);
  const [addMilestoneOpen, setAddMilestoneOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [isAdmin] = useState(true); // Mock admin status

  const totalAmount = project.milestones.reduce((sum, m) => sum + m.amount, 0);
  const completedMilestones = project.milestones.filter(m => m.status === "COMPLETED").length;
  const progress = (completedMilestones / project.milestones.length) * 100;

  const handleAddMilestone = (newMilestone: any) => {
    setProject({
      ...project,
      milestones: [...project.milestones, { ...newMilestone, index: project.milestones.length }]
    });
  };

  const handleUpdateMilestone = (index: number, updatedMilestone: any) => {
    const newMilestones = [...project.milestones];
    newMilestones[index] = updatedMilestone;
    setProject({ ...project, milestones: newMilestones });
  };

  const handleDeposit = (amount: number) => {
    console.log("Deposited:", amount);
  };

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
                <>
                  <Button variant="outline" className="gap-2" onClick={() => setDepositOpen(true)}>
                    <Wallet className="h-4 w-4" />
                    Deposit Funds
                  </Button>
                  <Button variant="default" className="gap-2" onClick={() => setAddMilestoneOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Add Milestone
                  </Button>
                </>
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
                  <Badge variant="outline" className="font-mono">{project.token}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total Value</p>
                  <p className="text-lg font-semibold text-foreground">${totalAmount.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Vault Address</p>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-mono text-foreground">{project.vaultAddress.slice(0, 10)}...</p>
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
              </Card>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="milestones" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="milestones" className="space-y-6">
            {project.milestones.map((milestone, index) => (
              <MilestoneCard
                key={milestone.index}
                milestone={milestone}
                projectToken={project.token}
                onUpdate={(updated) => handleUpdateMilestone(index, updated)}
                isAdmin={isAdmin}
              />
            ))}
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
      <DepositDialog
        open={depositOpen}
        onOpenChange={setDepositOpen}
        projectId={project.id}
        token={project.token}
        onDeposit={handleDeposit}
      />
    </div>
  );
};

export default ProjectDetail;
