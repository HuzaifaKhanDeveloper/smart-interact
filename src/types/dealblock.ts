// DealBlock Contract Types

export enum MilestoneStatus {
  INITIALIZED = 0,
  FUNDED = 1,
  REVIEW = 2,
  APPROVED = 3,
  COMPLETED = 4,
  CANCELLED = 5,
}

export interface Task {
  title: string;
  description: string;
}

export interface Milestone {
  index: number;
  amount: bigint;
  startingAt: bigint;
  endingAt: bigint;
  status: MilestoneStatus;
  approvers: string[];
  threshold: number;
  tasks: Task[];
  editLocked: boolean;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  vaultAddress: string;
  initializer: string;
  payee: string;
  token: string;
  completed: boolean;
  milestones: Milestone[];
}

export interface ContractAddresses {
  dealBlock: string;
  usdc: string;
  usdt: string;
}

// Contract function parameters
export interface InitializeProjectParams {
  payee: string;
  token: string;
  milestoneEndingAt: bigint;
  projectTitle: string;
  projectDescription: string;
  taskTitles: string[];
  taskDescriptions: string[];
  amount: bigint;
  approvers: string[];
}

export interface AddMilestoneParams {
  projectId: bigint;
  endingAt: bigint;
  taskTitles: string[];
  taskDescriptions: string[];
  amount: bigint;
  approvers: string[];
}

export interface AddTaskParams {
  projectId: bigint;
  milestoneIndex: bigint;
  taskTitles: string[];
  taskDescriptions: string[];
}
