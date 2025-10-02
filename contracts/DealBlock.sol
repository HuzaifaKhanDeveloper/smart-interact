// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./data/DB_Variables.sol";

contract DealBlock is DB_Variables {

        address internal immutable SAFE_SINGLETON;
    address internal immutable SAFE_PROXY_FACTORY;
    address internal immutable FALLBACK_HANDLER;
    address internal immutable admin;
    // INITIALIZE THE DEALBLOCK CONTRACT WITH GNOSIS SAFE INTEGRATION
    constructor(
        address _safeSingleton,
        address _safeProxyFactory,
        address _fallbackHandler,
        address _admin
    ) {
        if (
            _safeSingleton == address(0) ||
            _safeProxyFactory == address(0) ||
            _fallbackHandler == address(0) ||
            _admin == address(0)
        ) revert ZERO_ADDRESS();

        SAFE_SINGLETON = _safeSingleton;
        SAFE_PROXY_FACTORY = _safeProxyFactory;
        FALLBACK_HANDLER = _fallbackHandler;
        admin = _admin;
    }

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NOT_ADMIN();
        _;
    }

    /// Initialize a new project with a Safe owned by ADMIN and a first milestone
    function initialize_Project(
        address payee,
        address token,
        uint256 milestone_Ending_At,
        string calldata project_Title,
        string calldata project_Description,
        string[] calldata task_Titles,
        string[] calldata task_Descriptions,
        uint256 amount,
        address[] calldata approvers
    ) external returns (uint256 project_Id, address safe) {
        if (payee == address(0)) revert ZERO_ADDRESS();
        if (amount == 0) revert INVALID_AMOUNT();
        if (task_Titles.length != task_Descriptions.length)
            revert INVALID_TASK();
        if (token != USDC && token != USDT) revert INVALID_TOKEN();
        if (milestone_Ending_At <= block.timestamp) revert INVALID_DEADLINE();

        // Validate approvers for empty addresses and duplicates
        _validateApprovers(approvers);

        // Safe owned solely by ADMIN with threshold 1
        address[] memory owners = new address[](1);
        owners[0] = admin;

        uint256 nextId = PROJECTS_COUNTER + 1;
        safe = _deploySafeWallet(owners, 1, nextId);

        project_Id = nextId;
        PROJECTS_COUNTER = nextId;

        Project storage project = projects[project_Id];
        project.title = project_Title;
        project.description = project_Description;
        project.vault_Address = safe;
        project.initializer = msg.sender;
        project.paid_To = payee;
        project.token = token;
        project.completed = false;

        // First milestone setup (status = INITIALIZED)
        MileStone storage milestone = project.milestones.push();
        milestone.starting_At = block.timestamp;
        milestone.ending_At = milestone_Ending_At;
        milestone.amount = amount;
        milestone.status = Status.INITIALIZED;
        milestone.threshold = approvers.length;
        milestone.approvers = approvers;
        milestone.edit_Locked = false;

        for (uint256 i = 0; i < task_Titles.length; i++) {
            milestone.milestone_Tasks.push(
                Task({title: task_Titles[i], description: task_Descriptions[i]})
            );
        }

        // emit ProjectInitialized(project_Id, msg.sender, payee, safe, token, amount);
    }

    function add_Task(
        uint256 project_Id,
        uint256 index,
        string[] calldata task_Titles,
        string[] calldata task_Descriptions
    ) external {
        Project storage project = projects[project_Id];

        if (project.vault_Address == address(0)) revert INVALID_PROJECT();
        if (project.initializer != msg.sender) revert NOT_INITIATOR();
        if (project.completed) revert PROJECT_INACTIVE();
        if (task_Titles.length != task_Descriptions.length)
            revert INVALID_TASK();

        MileStone storage milestone = project.milestones[index];

        // Only allow adding tasks if milestone is INITIALIZED or FUNDED
        if (index > project.milestones.length) revert INVALID_MILESTONE();
        if (
            milestone.status != Status.INITIALIZED &&
            milestone.status != Status.FUNDED
        ) revert STATUS_INVAILD();

        // Add each task to the milestone
        for (uint256 i = 0; i < task_Titles.length; i++) {
            milestone.milestone_Tasks.push(
                Task({title: task_Titles[i], description: task_Descriptions[i]})
            );
        }
    }

    /// @notice Add a new milestone (initializer only)
    function add_Milestone(
        uint256 project_Id,
        uint256 ending_At,
        string[] calldata task_Titles,
        string[] calldata task_Descriptions,
        uint256 amount,
        address[] calldata approvers
    ) external returns (uint256 milestone_Index) {
        Project storage project = projects[project_Id];
        if (project.vault_Address == address(0)) revert INVALID_PROJECT();
        if (project.initializer != msg.sender) revert NOT_INITIATOR();
        if (project.completed) revert PROJECT_INACTIVE();
        if (amount == 0) revert INVALID_AMOUNT();
        if (task_Titles.length != task_Descriptions.length)
            revert INVALID_TASK();
        if (ending_At <= block.timestamp) revert INVALID_DEADLINE();

        // Validate approvers for empty addresses and duplicates
        _validateApprovers(approvers);

        MileStone storage milestone = project.milestones.push();
        milestone.starting_At = block.timestamp;
        milestone.ending_At = ending_At;
        milestone.amount = amount;
        milestone.status = Status.INITIALIZED;
        milestone.threshold = approvers.length;
        milestone.approvers = approvers;
        milestone.edit_Locked = false;

        for (uint256 i = 0; i < task_Titles.length; i++) {
            milestone.milestone_Tasks.push(
                Task({title: task_Titles[i], description: task_Descriptions[i]})
            );
        }
        // Length counts elements starting at 1, but array indexes start at 0, so we do length - 1 to get the last element’s index.
        milestone_Index = project.milestones.length - 1;
    }

    /// @notice Update an existing milestone once (cannot update if status is not INITIALIZED)
    /// @dev Deadline cannot be updated here - use increaseDeadline function instead
    // function update_Task(
    //     uint256 project_Id,
    //     uint256 index,
    //     string[] calldata task_Titles,
    //     string[] calldata task_Descriptions
    //     // uint256 amount
    //      // address[] calldata approvers
    // ) external
    // {
    //     Project storage project = projects[project_Id];
    //     if (project.vault_Address == address(0)) revert INVALID_PROJECT();
    //     if (project.initializer != msg.sender) revert NOT_INITIATOR();
    //     if (project.completed) revert PROJECT_INACTIVE();
    //     if (index >= project.milestones.length) revert INVALID_MILESTONE();
    //     if (task_Titles.length != task_Descriptions.length)
    //         revert INVALID_TASK();
    //     MileStone storage milestone = project.milestones[index];
    //     if (milestone.status != Status.INITIALIZED) revert STATUS_INVAILD();
    //     if (milestone.edit_Locked) revert EDIT_LOCKED();
    //     // if (amount == 0) revert INVALID_AMOUNT();

    //     // Validate approvers for empty addresses and duplicates
    //     // _validateApprovers(approvers);

    //     // milestone.amount = amount;
    //     // milestone.threshold = approvers.length;
    //     // milestone.approvers = approvers;

    //     // replace tasks
    //     delete milestone.milestone_Tasks;
    //     for (uint256 i = 0; i < task_Titles.length; i++) {
    //         milestone.milestone_Tasks.push(
    //             Task({title: task_Titles[i], description: task_Descriptions[i]})
    //         );
    //     }
    //     milestone.edit_Locked = true;
    // }

    /// @notice Remove a milestone (only when status is INITIALIZED and not edited/locked)
    /// @notice Remove the last milestone (only when status is INITIALIZED)
    // function remove_Milestone(uint256 project_Id, uint256 index) external {
    //     Project storage project = projects[project_Id];
    //     if (project.vault_Address == address(0)) revert INVALID_PROJECT();
    //     if (project.initializer != msg.sender) revert NOT_INITIATOR();
    //     if (index >= project.milestones.length) revert INVALID_MILESTONE();

    //     uint256 lastIndex = project.milestones.length;
    //     if (index != lastIndex) revert NOT_LAST_MILESTONE();

    //     MileStone storage milestone = project.milestones[index];
    //     if (milestone.status != Status.INITIALIZED) {
    //         revert FUNDED_MILESTONE_CANNOT_BE_REMOVED();
    //     }
    //     if (milestone.edit_Locked) revert EDIT_LOCKED();

    //     project.milestones.pop();
    // }

    /// @notice Fund a milestone by transferring USDC/USDT to the project's Safe (initializer only)
    function fund_Milestone(uint256 project_Id, uint256 index) external {
        Project storage project = projects[project_Id];
        if (project.vault_Address == address(0)) revert INVALID_PROJECT();
        if (project.initializer != msg.sender) revert NOT_INITIATOR();
        if (index >= project.milestones.length) revert INVALID_MILESTONE();
        if (project.token != USDC && project.token != USDT)
            revert INVALID_TOKEN();
        MileStone storage milestone = project.milestones[index];
        if (milestone.status == Status.FUNDED) revert ALREADY_FUNDED();

        IERC20 token = IERC20(project.token);
        // Check both balance and allowance to ensure full milestone amount can be funded
        uint256 balance = token.balanceOf(msg.sender);
        uint256 allowance = token.allowance(msg.sender, address(this));
        if (balance < milestone.amount) revert INSUFFICIENT_BALANCE();
        if (allowance < milestone.amount) revert INSUFFICIENT_ALLOWANCE();

        _safeTransferFrom(
            project.token,
            msg.sender,
            project.vault_Address,
            milestone.amount
        );

        milestone.status = Status.FUNDED;
        milestone.edit_Locked = true;
    }

    /// @notice Payee marks milestone as completed and ready for review
    function mark_Milestone_For_Review(
        uint256 project_Id,
        uint256 index
    ) external {
        Project storage project = projects[project_Id];
        if (project.vault_Address == address(0)) revert INVALID_PROJECT();
        if (project.paid_To != msg.sender) revert NOT_PAYEE();
        if (index >= project.milestones.length) revert INVALID_MILESTONE();
        MileStone storage milestone = project.milestones[index];
        if (milestone.status != Status.FUNDED) revert NOT_FUNDED();
        // Allow marking for review even after deadline
        milestone.status = Status.REVIEW;
    }

    /// @notice Approver or initializer signs milestone completion (only for milestones in REVIEW status)
    function approve_Milestone(uint256 project_Id, uint256 index) external {
        Project storage project = projects[project_Id];
        if (project.vault_Address == address(0)) revert INVALID_PROJECT();

        if (index >= project.milestones.length) revert INVALID_MILESTONE();
        MileStone storage milestone = project.milestones[index];
        if (milestone.status != Status.REVIEW) revert NOT_IN_REVIEW();
        // Allow approving even after deadline
        // Allow both approvers and initializer to approve
        bool canApprove = msg.sender == project.initializer;
        if (!canApprove) {
            for (uint256 i = 0; i < milestone.approvers.length; i++) {
                if (milestone.approvers[i] == msg.sender) {
                    canApprove = true;
                    break;
                }
            }
        }
        if (!canApprove) revert NOT_APPROVER();
        if (milestone.approvals[msg.sender]) revert ALREADY_APPROVED();
        milestone.approvals[msg.sender] = true;
    }

    /// @notice Finalize milestone approval once all approvers + initializer have signed (REVIEW -> APPROVED)
    /// @dev Can be called by initializer or admin
    function complete_Milestone(uint256 project_Id, uint256 index) external {
        Project storage project = projects[project_Id];
        if (project.vault_Address == address(0)) revert INVALID_PROJECT();
        // Allow both initializer and admin to complete
        if (msg.sender != project.initializer && msg.sender != admin)
            revert NOT_AUTHORIZED();
        if (index >= project.milestones.length) revert INVALID_MILESTONE();
        MileStone storage milestone = project.milestones[index];
        if (milestone.status != Status.REVIEW) revert NOT_IN_REVIEW();

        // Check all approvers have approved
        for (uint256 i = 0; i < milestone.approvers.length; i++) {
            if (!milestone.approvals[milestone.approvers[i]])
                revert APPROVALS_PENDING();
        }
        // Also require initializer approval
        if (!milestone.approvals[project.initializer])
            revert APPROVALS_PENDING();

        milestone.status = Status.APPROVED;
    }

    /// @notice Release funded milestone to payee using the project's Safe, after all approvals (APPROVED -> COMPLETED)
    /// @dev Can be called by initializer or admin
    function fund_Release(uint256 project_Id, uint256 index) external {
        Project storage project = projects[project_Id];
        if (project.vault_Address == address(0)) revert INVALID_PROJECT();
        if (msg.sender != project.initializer && msg.sender != admin)
            revert NOT_AUTHORIZED();
        if (index >= project.milestones.length) revert INVALID_MILESTONE();
        MileStone storage milestone = project.milestones[index];
        if (milestone.status != Status.APPROVED) revert NOT_APPROVED();

        // Require unanimous approvals
        for (uint256 i = 0; i < milestone.approvers.length; i++) {
            if (!milestone.approvals[milestone.approvers[i]])
                revert APPROVALS_PENDING();
        }

        // Instruct the Safe to transfer tokens to payee
        bytes memory data = abi.encodeWithSelector(
            IERC20.transfer.selector,
            project.paid_To,
            milestone.amount
        );
        bool ok = IGnosisSafe(payable(project.vault_Address))
            .execTransactionFromModule(
                project.token,
                0,
                data,
                0 // CALL
            );
        if (!ok) revert SAFE_TRANSACTION_FAILED();

        milestone.status = Status.COMPLETED;
    }

    /// @notice Increase deadline for a milestone (initializer only)
    function increase_Deadline(
        uint256 project_Id,
        uint256 index,
        uint256 new_Ending_At
    ) external {
        Project storage project = projects[project_Id];
        if (project.vault_Address == address(0)) revert INVALID_PROJECT();
        if (project.initializer != msg.sender) revert NOT_INITIATOR();
        if (index >= project.milestones.length) revert INVALID_MILESTONE();
        MileStone storage milestone = project.milestones[index];
        // Can only increase, not decrease deadline
        if (new_Ending_At <= milestone.ending_At) revert INVALID_DEADLINE();

        milestone.ending_At = new_Ending_At;
    }

    /// @notice Cancel a milestone - only INITIALIZED milestones can be cancelled
    function cancel_Milestone(uint256 project_Id, uint256 index) external {
        Project storage project = projects[project_Id];
        if (project.vault_Address == address(0)) revert INVALID_PROJECT();
        if (project.initializer != msg.sender) revert NOT_INITIATOR();
        if (index >= project.milestones.length) revert INVALID_MILESTONE();
        MileStone storage milestone = project.milestones[index];

        // Can only cancel if milestone is still INITIALIZED (not funded)
        if (milestone.status != Status.INITIALIZED) revert STATUS_INVAILD();

        milestone.status = Status.CANCELLED;
    }

    function complete_Project(uint256 project_Id) external {
        Project storage project = projects[project_Id];
        if (project.vault_Address == address(0)) revert INVALID_PROJECT();
        if (project.initializer != msg.sender) revert NOT_INITIATOR();
        if (project.completed) revert ALREADY_COMPLETED();

        // Ensure all milestones are completed
        for (uint256 i = 0; i < project.milestones.length; i++) {
            if (project.milestones[i].status != Status.COMPLETED) {
                revert PREVIOUS_MILESTONES_NOT_COMPLETE();
            }
        }
        project.completed = true;
    }

    // function cancelProject(uint256 project_Id) external {
    //        Project storage project = projects[project_Id];
    //     if (project.vault_Address == address(0)) revert INVALID_PROJECT();
    //     if (project.initializer != msg.sender) revert NOT_INITIATOR();
    //     if (project.completed) revert ALREADY_COMPLETED();
    // }

    /// @notice Admin-only withdrawal from project's Safe to admin for a given milestone amount
    function withdraw_Assets(
        uint256 project_Id,
        uint256 index
    ) external onlyAdmin {
        Project storage project = projects[project_Id];
        if (project.vault_Address == address(0)) revert INVALID_PROJECT();
        if (index >= project.milestones.length) revert INVALID_MILESTONE();
        if (project.token != USDC && project.token != USDT)
            revert INVALID_TOKEN();

        MileStone storage milestone = project.milestones[index];

        // Instruct the Safe to transfer tokens back to the admin
        bytes memory data = abi.encodeWithSelector(
            IERC20.transfer.selector,
            msg.sender,
            milestone.amount
        );
        bool ok = IGnosisSafe(payable(project.vault_Address))
            .execTransactionFromModule(
                project.token,
                0,
                data,
                0 // CALL
            );
        if (!ok) revert SAFE_TRANSACTION_FAILED();
    }

    /// @notice Admin-only deposit from admin to project's Safe for a given milestone amount
    function deposit_Assets(
        uint256 project_Id,
        uint256 index
    ) external onlyAdmin {
        Project storage project = projects[project_Id];
        if (project.vault_Address == address(0)) revert INVALID_PROJECT();
        if (index >= project.milestones.length) revert INVALID_MILESTONE();
        if (project.token != USDC && project.token != USDT)
            revert INVALID_TOKEN();

        MileStone storage milestone = project.milestones[index];

        IERC20 t = IERC20(project.token);
        if (t.allowance(msg.sender, address(this)) < milestone.amount)
            revert INSUFFICIENT_ALLOWANCE();
        _safeTransferFrom(
            project.token,
            msg.sender,
            project.vault_Address,
            milestone.amount
        );
    }

    /// @notice Minimal view helper for tests and UI
    function getMilestone(
        uint256 project_Id,
        uint256 index
    )
        external
        view
        returns (
            uint256 amount,
            uint256 starting_At,
            uint256 ending_At,
            Status status,
            uint256 approversLen,
            bool edit_Locked,
            address vault,
            address token,
            address payee,
            Task[] memory tasks,
            bool initializerApprovalRequired,
            bool initializerHasApproved
        )
    {
        Project storage project = projects[project_Id];
        MileStone storage milestone = project.milestones[index];

        // Copy tasks from storage to memory
        tasks = new Task[](milestone.milestone_Tasks.length);
        for (uint256 i = 0; i < milestone.milestone_Tasks.length; i++) {
            tasks[i] = milestone.milestone_Tasks[i];
        }

        return (
            milestone.amount,
            milestone.starting_At,
            milestone.ending_At,
            milestone.status,
            milestone.approvers.length,
            milestone.edit_Locked,
            project.vault_Address,
            project.token,
            project.paid_To,
            tasks,
            true, // initializer approval is always required
            milestone.approvals[project.initializer] // whether initializer has approved
        );
    }

    /// @notice Get project info.
    function getProject(
        uint256 project_Id
    )
        external
        view
        returns (
            address vault_Address,
            address initializer,
            address paid_To,
            address token,
            bool completed,
            uint256 milestoneCount
        )
    {
        Project storage project = projects[project_Id];
        return (
            project.vault_Address,
            project.initializer,
            project.paid_To,
            project.token,
            project.completed,
            project.milestones.length
        );
    }

       // Module (smart contract) is enabled in the Safe. When enough approvers approve a milestone inside your module, the module triggers the Safe to execute. From the Safe’s point of view, this is a valid execution because the module is authorized.
    function __enableModuleOnSetup(address module) external {
        IGnosisSafe(payable(address(this))).enableModule(module);
    }

    /// @dev Internal function to validate approvers array
    function _validateApprovers(address[] calldata approvers) internal pure {
        // Check for empty approvers array if needed
        if (approvers.length == 0) revert NO_APPROVERS();

        for (uint256 i = 0; i < approvers.length; i++) {
            // Check for zero address
            if (approvers[i] == address(0)) revert ZERO_ADDRESS();

            // Check for duplicates
            for (uint256 j = i + 1; j < approvers.length; j++) {
                if (approvers[i] == approvers[j]) revert DUPLICATE_APPROVER();
            }
        }
    }

    /// @dev Safe ERC20.transferFrom that supports tokens.
    function _safeTransferFrom(
        address token,
        address from,
        address to,
        uint256 amount
    ) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(
                IERC20.transferFrom.selector,
                from,
                to,
                amount
            )
        );
        if (!success) revert TRANSFER_FAILED();
        if (data.length > 0) {
            // Tokens may or may not return a bool
            bool ok = abi.decode(data, (bool));
            if (!ok) revert TRANSFER_FAILED();
        }
    }

    // SAFE WALLET CREATION FOR MILESTONE FUNDS.
    function _deploySafeWallet(
        address[] memory owners,
        uint256 threshold,
        uint256 project_Id
    ) internal returns (address safe) {
        if (owners.length == 0 || threshold == 0 || threshold > owners.length)
            revert INVALID_AMOUNT();

        bytes memory enableModuleData = abi.encodeWithSignature(
            "__enableModuleOnSetup(address)",
            address(this)
        );
        bytes memory initializer = abi.encodeWithSelector(
            IGnosisSafe.setup.selector,
            owners,
            threshold,
            address(this),
            enableModuleData,
            FALLBACK_HANDLER,
            address(0),
            0,
            payable(address(0))
        );

        // Deploy Safe
        safe = IGnosisSafeProxyFactory(SAFE_PROXY_FACTORY).createProxyWithNonce(
            SAFE_SINGLETON,
            initializer,
            project_Id
        );

        // CRITICAL FIX: Comprehensive module validation after deployment
        if (!IGnosisSafe(safe).isModuleEnabled(address(this))) {
            revert MODULE_NOT_ENABLED();
        }

        // Additional validation: Test module execution with meaningful function
        // Use getThreshold() which requires actual execution permissions
        bytes memory testData = abi.encodeWithSelector(
            IGnosisSafe.getThreshold.selector
        );
        try
            IGnosisSafe(safe).execTransactionFromModule(safe, 0, testData, 0)
        returns (bool success) {
            if (!success) {
                revert MODULE_EXECUTION_FAILED();
            }
            // Module can execute transactions successfully
        } catch {
            revert MODULE_EXECUTION_FAILED();
        }
    }
}
