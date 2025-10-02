# DealBlock Smart Contract Frontend Guide

This frontend prototype interfaces with the DealBlock smart contract for milestone-based escrow and project management.

## Contract Overview

**DealBlock** is a blockchain-based project management system that uses:
- **Gnosis Safe** for secure fund management
- **Milestone-based payments** with approval workflows
- **USDC/USDT** token support
- **Multi-signature approvals** for payment releases

## Contract Functions

### Project Management

#### `initialize_Project`
Creates a new project with the first milestone.

**Parameters:**
- `payee`: Address that receives payments
- `token`: USDC or USDT address
- `milestone_Ending_At`: Timestamp for milestone deadline
- `project_Title`: Project name
- `project_Description`: Project details
- `task_Titles[]`: Array of task titles
- `task_Descriptions[]`: Array of task descriptions
- `amount`: Milestone payment amount
- `approvers[]`: Array of approver addresses

**Returns:** `project_Id`, `safe` (vault address)

#### `add_Milestone`
Adds a new milestone to an existing project.

**Parameters:**
- `project_Id`: The project ID
- `ending_At`: Milestone deadline
- `task_Titles[]`, `task_Descriptions[]`: Tasks
- `amount`: Payment amount
- `approvers[]`: Approver addresses

#### `add_Task`
Adds tasks to an existing milestone.

**Parameters:**
- `project_Id`: Project ID
- `index`: Milestone index
- `task_Titles[]`, `task_Descriptions[]`: Task details

### Milestone Lifecycle

The milestone workflow follows these states:

```
INITIALIZED → FUNDED → REVIEW → APPROVED → COMPLETED
     ↓
  CANCELLED
```

#### `fund_Milestone`
Initializer funds a milestone by transferring tokens to the Safe.

**Parameters:**
- `project_Id`: Project ID
- `index`: Milestone index

**Requirements:**
- Caller must be initializer
- Milestone must be INITIALIZED
- Caller must approve tokens first

#### `mark_Milestone_For_Review`
Payee marks milestone as completed and ready for review.

**Parameters:**
- `project_Id`: Project ID
- `index`: Milestone index

**Requirements:**
- Caller must be payee
- Milestone must be FUNDED

#### `approve_Milestone`
Approvers (and initializer) sign off on milestone completion.

**Parameters:**
- `project_Id`: Project ID
- `index`: Milestone index

**Requirements:**
- Caller must be approver or initializer
- Milestone must be in REVIEW
- Can only approve once

#### `complete_Milestone`
Finalizes approval once all parties have approved.

**Parameters:**
- `project_Id`: Project ID
- `index`: Milestone index

**Requirements:**
- Caller must be initializer or admin
- All approvers + initializer must have approved

#### `fund_Release`
Releases funds from Safe to payee.

**Parameters:**
- `project_Id`: Project ID
- `index`: Milestone index

**Requirements:**
- Milestone must be APPROVED
- All approvals must be complete

### Additional Functions

#### `increase_Deadline`
Extends milestone deadline (initializer only).

#### `cancel_Milestone`
Cancels an INITIALIZED milestone (initializer only).

#### `complete_Project`
Marks entire project as complete once all milestones are COMPLETED.

#### View Functions

- `getProject(project_Id)`: Returns project details
- `getMilestone(project_Id, index)`: Returns milestone details

## Frontend Pages

### Dashboard (`/`)
- Overview of all projects
- Statistics (total projects, active milestones, TVL)
- Search and filter projects
- Create new project button

### Project Detail (`/project/:id`)
- Full project information
- List of all milestones with status
- Expandable milestone cards showing tasks
- Action buttons based on milestone status and user role

### Create Project (`/create`)
- Form to initialize new project
- Add multiple tasks
- Configure approvers
- Set payment amount and deadline

## Milestone Actions by Status

| Status | Available Actions | Who Can Execute |
|--------|------------------|-----------------|
| INITIALIZED | Fund, Add Tasks, Cancel | Initializer |
| FUNDED | Mark for Review | Payee |
| REVIEW | Approve, View Approvals | Approvers + Initializer |
| APPROVED | Release Funds | Initializer or Admin |
| COMPLETED | None (final state) | - |

## Integration Requirements

To connect this frontend to the smart contract:

1. **Web3 Provider**: Install ethers.js or viem
   ```bash
   npm install ethers
   # or
   npm install viem wagmi
   ```

2. **Contract Addresses**: Update with deployed addresses
   - DealBlock contract
   - USDC token
   - USDT token

3. **Wallet Connection**: Implement wallet connection (WalletConnect, MetaMask)

4. **Contract Calls**: Use the ABIs in `src/lib/contract-abi.ts`

5. **Token Approvals**: Before funding, users must approve tokens:
   ```typescript
   // Approve USDC/USDT for DealBlock contract
   await tokenContract.approve(dealBlockAddress, amount);
   await dealBlockContract.fund_Milestone(projectId, milestoneIndex);
   ```

## Security Considerations

1. **Input Validation**: All user inputs are validated client-side
2. **Token Approvals**: Check allowance before funding
3. **Role Checks**: UI shows actions based on user's role
4. **Safe Integration**: All payments go through Gnosis Safe
5. **Multi-sig**: Requires unanimous approval from all approvers + initializer

## Next Steps

1. Implement Web3 provider (ethers.js/viem)
2. Connect wallet functionality
3. Fetch real contract data
4. Implement transaction submission
5. Add transaction status monitoring
6. Add events listening for real-time updates
7. Implement error handling and loading states
