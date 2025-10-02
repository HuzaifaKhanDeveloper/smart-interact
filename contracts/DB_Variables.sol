// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IGnosisSafeProxyFactory {
    function createProxy(
        address _singleton,
        bytes memory initializer
    ) external returns (address proxy);
    function createProxyWithNonce(
        address _singleton,
        bytes memory initializer,
        uint256 saltNonce
    ) external returns (address proxy);
}

interface IGnosisSafe {
    function setup(
        address[] calldata _owners,
        uint256 _threshold,
        address to,
        bytes calldata data,
        address fallbackHandler,
        address paymentToken,
        uint256 payment,
        address payable paymentReceiver
    ) external;

    function execTransaction(
        address to,
        uint256 value,
        bytes calldata data,
        uint8 operation,
        uint256 safeTxGas,
        uint256 baseGas,
        uint256 gasPrice,
        address gasToken,
        address payable refundReceiver,
        bytes memory signatures
    ) external payable returns (bool success);

    function execTransactionFromModule(
        address to,
        uint256 value,
        bytes memory data,
        uint8 operation
    ) external returns (bool success);

    function enableModule(address module) external;

    function getThreshold() external view returns (uint256);
    function getOwners() external view returns (address[] memory);
    function nonce() external view returns (uint256);
    function getTransactionHash(
        address to,
        uint256 value,
        bytes calldata data,
        uint8 operation,
        uint256 safeTxGas,
        uint256 baseGas,
        uint256 gasPrice,
        address gasToken,
        address refundReceiver,
        uint256 _nonce
    ) external view returns (bytes32);

    function isModuleEnabled(address module) external view returns (bool);
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);
    function decimals() external view returns (uint8);
}

contract DB_Variables {
    uint256 internal PROJECTS_COUNTER;
    address internal constant USDC = 0xE3F80d6Bf58794AD8d9d5E3Cb1BC6092b068108a;
    address internal constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;

    enum Status {
        INITIALIZED,
        FUNDED,
        REVIEW,
        APPROVED,
        COMPLETED,
        CANCELLED
    }

    struct Task {
        string title;
        string description;
    }

    struct MileStone {
        uint256 starting_At;
        uint256 ending_At;
        Task[] milestone_Tasks;
        uint256 amount;
        Status status;
        address[] approvers;
        uint256 threshold; // equals approvers.length
        mapping(address => bool) approvals; // approver => signed
        bool edit_Locked; // set true after first update or funding
    }

    // struct Arbitrator{
    // }

    struct Project {
        MileStone[] milestones; // dynamic array, stored separately
        string title;
        string description;
        address vault_Address; // 20 bytes
        address initializer; // 20 bytes
        address paid_To; // 20 bytes
        address token; // 20 bytes
        bool completed; // packed with token
    }

    mapping(uint256 => Project) internal projects;

    // // Project lifecyles events
    // event ProjectInitialized(uint256 indexed project_Id, address indexed initializer, address indexed payee, address safe, address token, uint256 amount);
    // event ProjectCompleted(uint256 indexed project_Id);
    // // event ProjectCancelled(uint256 indexed project_Id); -> Will be added when project cancel function will be implemented.
    // // Milestones lifecyles events
    // event MilestoneAdded(uint256 indexed milestone_Index, uint256 indexed project_Id, uint256 starting_At, uint256 ending_At, uint256 amount);
    // event MilestoneUpdated(uint256 indexed milestone_Index, uint256 indexed project_Id, uint256 starting_At, uint256 ending_At, uint256 amount);

  

       // Access Control Errors
    error NOT_ADMIN();
    error NOT_INITIATOR();
    error NOT_PAYEE();
    error NOT_AUTHORIZED();
    error APPROVALS_PENDING();
    error NOT_APPROVER();

    // Specific Status Errors
    error ALREADY_FUNDED();
    error STATUS_INVAILD();
    error NOT_FUNDED();
    error NOT_IN_REVIEW();
    error NOT_APPROVED();
    error ALREADY_APPROVED();
    error FUNDED_MILESTONE_CANNOT_BE_REMOVED();
    error NOT_LAST_MILESTONE();
    error EDIT_LOCKED();

    // Validation Errors
    error ZERO_ADDRESS();
    error INVALID_PROJECT();
    error INVALID_MILESTONE();
    error INVALID_TASK();
    error INVALID_AMOUNT();
    error INVALID_DEADLINE();
    error INVALID_TOKEN();

    // State Errors
    error ALREADY_COMPLETED();
    error PROJECT_INACTIVE();
    error PREVIOUS_MILESTONES_NOT_COMPLETE();
    error DUPLICATE_APPROVER();
    error NO_APPROVERS();

    // Financial Errors
    error INSUFFICIENT_BALANCE();
    error INSUFFICIENT_ALLOWANCE();
    error TRANSFER_FAILED();

    // System Errors
    error MODULE_NOT_ENABLED();
    error MODULE_EXECUTION_FAILED();
    error SAFE_TRANSACTION_FAILED();
}
