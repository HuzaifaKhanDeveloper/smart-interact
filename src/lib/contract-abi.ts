// Simplified ABI for DealBlock contract
// In production, import the full ABI from your contract artifacts

export const DEALBLOCK_ABI = [
  // View functions
  {
    inputs: [{ name: "project_Id", type: "uint256" }],
    name: "getProject",
    outputs: [
      { name: "vault_Address", type: "address" },
      { name: "initializer", type: "address" },
      { name: "paid_To", type: "address" },
      { name: "token", type: "address" },
      { name: "completed", type: "bool" },
      { name: "milestoneCount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "project_Id", type: "uint256" },
      { name: "index", type: "uint256" },
    ],
    name: "getMilestone",
    outputs: [
      { name: "amount", type: "uint256" },
      { name: "starting_At", type: "uint256" },
      { name: "ending_At", type: "uint256" },
      { name: "status", type: "uint8" },
      { name: "approversLen", type: "uint256" },
      { name: "edit_Locked", type: "bool" },
      { name: "vault", type: "address" },
      { name: "token", type: "address" },
      { name: "payee", type: "address" },
      {
        name: "tasks",
        type: "tuple[]",
        components: [
          { name: "title", type: "string" },
          { name: "description", type: "string" },
        ],
      },
      { name: "initializerApprovalRequired", type: "bool" },
      { name: "initializerHasApproved", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // Write functions
  {
    inputs: [
      { name: "payee", type: "address" },
      { name: "token", type: "address" },
      { name: "milestone_Ending_At", type: "uint256" },
      { name: "project_Title", type: "string" },
      { name: "project_Description", type: "string" },
      { name: "task_Titles", type: "string[]" },
      { name: "task_Descriptions", type: "string[]" },
      { name: "amount", type: "uint256" },
      { name: "approvers", type: "address[]" },
    ],
    name: "initialize_Project",
    outputs: [
      { name: "project_Id", type: "uint256" },
      { name: "safe", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "project_Id", type: "uint256" },
      { name: "index", type: "uint256" },
    ],
    name: "fund_Milestone",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "project_Id", type: "uint256" },
      { name: "index", type: "uint256" },
    ],
    name: "mark_Milestone_For_Review",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "project_Id", type: "uint256" },
      { name: "index", type: "uint256" },
    ],
    name: "approve_Milestone",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "project_Id", type: "uint256" },
      { name: "index", type: "uint256" },
    ],
    name: "complete_Milestone",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "project_Id", type: "uint256" },
      { name: "index", type: "uint256" },
    ],
    name: "fund_Release",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "project_Id", type: "uint256" },
      { name: "ending_At", type: "uint256" },
      { name: "task_Titles", type: "string[]" },
      { name: "task_Descriptions", type: "string[]" },
      { name: "amount", type: "uint256" },
      { name: "approvers", type: "address[]" },
    ],
    name: "add_Milestone",
    outputs: [{ name: "milestone_Index", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "project_Id", type: "uint256" },
      { name: "index", type: "uint256" },
      { name: "task_Titles", type: "string[]" },
      { name: "task_Descriptions", type: "string[]" },
    ],
    name: "add_Task",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
