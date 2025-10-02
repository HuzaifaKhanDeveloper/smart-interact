import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Wallet, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProjectCard } from "@/components/ProjectCard";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Mock data - replace with actual contract data
const mockProjects = [
  {
    id: 1,
    title: "Website Redesign Project",
    description: "Complete redesign of company website with modern UI/UX",
    initializer: "0x1234...5678",
    payee: "0x8765...4321",
    vaultAddress: "0xabcd...efgh",
    token: "USDC",
    completed: false,
    milestoneCount: 3,
    activeMilestones: 1,
    totalAmount: 15000,
  },
  {
    id: 2,
    title: "Mobile App Development",
    description: "React Native app for iOS and Android platforms",
    initializer: "0x2345...6789",
    payee: "0x9876...5432",
    vaultAddress: "0xbcde...fghi",
    token: "USDT",
    completed: false,
    milestoneCount: 5,
    activeMilestones: 2,
    totalAmount: 45000,
  },
];

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const navigate = useNavigate();

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
            
            <Button
              onClick={() => setIsConnected(!isConnected)}
              variant={isConnected ? "outline" : "default"}
              className="gap-2"
            >
              <Wallet className="h-4 w-4" />
              {isConnected ? "0x1234...5678" : "Connect Wallet"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 border-none shadow-card backdrop-blur-sm bg-gradient-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Projects</p>
                <p className="text-3xl font-bold text-foreground">12</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">📁</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-none shadow-card backdrop-blur-sm bg-gradient-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Milestones</p>
                <p className="text-3xl font-bold text-foreground">8</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-none shadow-card backdrop-blur-sm bg-gradient-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Value Locked</p>
                <p className="text-3xl font-bold text-foreground">$60K</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
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
          >
            <Plus className="h-4 w-4" />
            Create Project
          </Button>
        </div>

        {/* Projects Grid */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Your Projects</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
