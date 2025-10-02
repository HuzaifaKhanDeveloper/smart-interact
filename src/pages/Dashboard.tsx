import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, TrendingUp, Users, Briefcase, Clock, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProjectCard } from "@/components/ProjectCard";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConnectButton } from "thirdweb/react";
import { activeChain, thirdwebClient } from "@/lib/thirdweb";
import { getDealblockContract, TOKEN_ADDRESSES } from "@/lib/thirdweb";
import { readContract } from "thirdweb";
import { formatTokenAmount } from "@/lib/utils";
import { useActiveAccount } from "thirdweb/react";

type UiProject = {
  id: number;
  title: string;
  description: string;
  initializer: string;
  payee: string;
  vaultAddress: string;
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

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<UiProject[]>([]);
  const [activeFilter, setActiveFilter] = useState<"all" | "my-projects" | "work-assigned" | "pending-approvals">("all");
  const account = useActiveAccount();
  const contract = useMemo(() => getDealblockContract(), []);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMaxId = async (): Promise<number> => {
      let hi = 1;
      while (true) {
        const view = await readContract({ contract, method: "getProject", params: [BigInt(hi)] });
        const [vault] = view as any[];
        if (!vault || vault === "0x0000000000000000000000000000000000000000") break;
        hi *= 2;
        if (hi > 100000) break;
      }
      let lo = Math.floor(hi / 2);
      while (lo < hi) {
        const mid = Math.floor((lo + hi + 1) / 2);
        const view = await readContract({ contract, method: "getProject", params: [BigInt(mid)] });
        const [vault] = view as any[];
        if (vault && vault !== "0x0000000000000000000000000000000000000000") lo = mid;
        else hi = mid - 1;
      }
      return lo;
    };

    const load = async () => {
      if (!account?.address) {
        setProjects([]);
        return;
      }
      const maxId = await fetchMaxId();
      const list: UiProject[] = [];
      for (let id = 1; id <= maxId; id++) {
        const view = await readContract({ contract, method: "getProject", params: [BigInt(id)] });
        const [vault, initializer, payee, token, completed, milestoneCount] = view as any[];
        if (!vault || vault === "0x0000000000000000000000000000000000000000") continue;
        const isInitializer = String(initializer).toLowerCase() === account.address.toLowerCase();
        const isPayee = String(payee).toLowerCase() === account.address.toLowerCase();
        
        // Check if connected wallet is an approver on any milestone
        let isApprover = false;
        let pendingApprovals = 0;
        for (let i = 0; i < Number(milestoneCount ?? 0n); i++) {
          const m = await readContract({ contract, method: "getMilestone", params: [BigInt(id), BigInt(i)] });
          const [amount, , , status, approversLen, , , , , , initializerApprovalRequired, initializerHasApproved] = m as any[];
          const st = Number(status ?? 0);
          
          // If milestone is in REVIEW status, count pending approvals
          if (st === 2) { // REVIEW status
            if (!initializerHasApproved && initializerApprovalRequired) {
              pendingApprovals++;
            }
            // Note: Individual approver status not available in current ABI
            // This is a placeholder for when full approver data is available
          }
        }
        
        if (!(isInitializer || isPayee || isApprover)) continue;
          const tokenSymbol = Object.entries(TOKEN_ADDRESSES).find(([, addr]) => addr.toLowerCase() === String(token).toLowerCase())?.[0] || token;
        let activeMilestones = 0;
        let totalAmount = 0n;
        for (let i = 0; i < Number(milestoneCount ?? 0n); i++) {
          const m = await readContract({ contract, method: "getMilestone", params: [BigInt(id), BigInt(i)] });
          const [amount, , , status] = m as any[];
          totalAmount += BigInt(amount ?? 0n);
          const st = Number(status ?? 0);
          if (st !== 4) activeMilestones += 1;
        }
        list.push({
          id,
          title: `Project #${id}`,
          description: "",
          initializer,
          payee,
          vaultAddress: vault,
          token: tokenSymbol as string,
          completed: Boolean(completed),
          milestoneCount: Number(milestoneCount ?? 0n),
          activeMilestones,
          totalAmount,
          isInitializer,
          isPayee,
          isApprover,
          pendingApprovals,
        });
      }
      setProjects(list);
    };
    load();
  }, [account, contract]);

  // Filter projects based on active filter
  const filteredProjects = useMemo(() => {
    let filtered = projects;
    
    if (activeFilter === "my-projects") {
      filtered = projects.filter(p => p.isInitializer);
    } else if (activeFilter === "work-assigned") {
      filtered = projects.filter(p => p.isPayee);
    } else if (activeFilter === "pending-approvals") {
      filtered = projects.filter(p => p.isApprover && (p.pendingApprovals || 0) > 0);
    }
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toString().includes(searchQuery)
      );
    }
    
    return filtered;
  }, [projects, activeFilter, searchQuery]);

  // Calculate stats for each filter
  const stats = useMemo(() => {
    const myProjects = projects.filter(p => p.isInitializer).length;
    const workAssigned = projects.filter(p => p.isPayee).length;
    const pendingApprovals = projects.filter(p => p.isApprover && (p.pendingApprovals || 0) > 0).length;
    
    return { myProjects, workAssigned, pendingApprovals };
  }, [projects]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-white font-bold text-lg">DB</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                DealBlock
              </h1>
            </div>
            
            <ConnectButton client={thirdwebClient} chain={activeChain} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Enhanced Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 border-none shadow-card backdrop-blur-sm bg-gradient-card hover:shadow-elevated transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">My Projects</p>
                <p className="text-3xl font-bold text-foreground">{stats.myProjects}</p>
                <p className="text-xs text-muted-foreground mt-1">Projects I created</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-none shadow-card backdrop-blur-sm bg-gradient-card hover:shadow-elevated transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Work Assigned</p>
                <p className="text-3xl font-bold text-foreground">{stats.workAssigned}</p>
                <p className="text-xs text-muted-foreground mt-1">Projects I'm working on</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-none shadow-card backdrop-blur-sm bg-gradient-card hover:shadow-elevated transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Approvals</p>
                <p className="text-3xl font-bold text-foreground">{stats.pendingApprovals}</p>
                <p className="text-xs text-muted-foreground mt-1">Awaiting my review</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-warning" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-none shadow-card backdrop-blur-sm bg-gradient-card hover:shadow-elevated transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Value</p>
                <p className="text-3xl font-bold text-foreground">{formatTokenAmount(projects.reduce((sum, p) => sum + p.totalAmount, 0n), 18, 2)}</p>
                <p className="text-xs text-muted-foreground mt-1">Across all projects</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
            </div>
          </Card>
        </div>

        {/* Enhanced Actions Bar with Role Filters */}
        <div className="space-y-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Button
                onClick={() => navigate("/create")}
                className="gap-2 w-full sm:w-auto"
                size="lg"
              >
                <Plus className="h-4 w-4" />
                Create Project
              </Button>
            </div>
          </div>

          {/* Role-based Filter Tabs */}
          <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-muted/50">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                All Projects
              </TabsTrigger>
              <TabsTrigger value="my-projects" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                My Projects
                {stats.myProjects > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {stats.myProjects}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="work-assigned" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Work Assigned
                {stats.workAssigned > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {stats.workAssigned}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pending-approvals" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending Approvals
                {stats.pendingApprovals > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs">
                    {stats.pendingApprovals}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Enhanced Projects Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              {activeFilter === "all" && "All Projects"}
              {activeFilter === "my-projects" && "My Projects"}
              {activeFilter === "work-assigned" && "Work Assigned"}
              {activeFilter === "pending-approvals" && "Pending Approvals"}
            </h2>
            <div className="text-sm text-muted-foreground">
              {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredProjects.length === 0 ? (
              <div className="col-span-full">
                <Card className="p-12 border-none shadow-card backdrop-blur-sm bg-gradient-card text-center">
                  <div className="max-w-md mx-auto">
                    {activeFilter === "all" ? (
                      <>
                        <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
                          <Briefcase className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">No Projects Found</h3>
                        <p className="text-muted-foreground mb-6">
                          You don't have any projects yet. Create your first project to get started.
                        </p>
                        <Button onClick={() => navigate("/create")} className="gap-2">
                          <Plus className="h-4 w-4" />
                          Create Your First Project
                        </Button>
                      </>
                    ) : activeFilter === "my-projects" ? (
                      <>
                        <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                          <Briefcase className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">No Projects Created</h3>
                        <p className="text-muted-foreground mb-6">
                          You haven't created any projects yet. Start by creating your first project.
                        </p>
                        <Button onClick={() => navigate("/create")} className="gap-2">
                          <Plus className="h-4 w-4" />
                          Create Project
                        </Button>
                      </>
                    ) : activeFilter === "work-assigned" ? (
                      <>
                        <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-secondary/10 flex items-center justify-center">
                          <Users className="h-8 w-8 text-secondary" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">No Work Assigned</h3>
                        <p className="text-muted-foreground">
                          You're not assigned as a payee on any projects yet.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-warning/10 flex items-center justify-center">
                          <Clock className="h-8 w-8 text-warning" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">No Pending Approvals</h3>
                        <p className="text-muted-foreground">
                          You don't have any pending approvals at the moment.
                        </p>
                      </>
                    )}
                  </div>
                </Card>
              </div>
            ) : (
              filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project as any} />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
