// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import {Functions, FunctionsClient} from "./dev/functions/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/ConfirmedOwner.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./Verifier.sol";
import "./MerkleTree.sol";
import "./VRFv2SubscriptionManager.sol";

struct Proof {
    uint256[2] a;
    uint256[2][2] b;
    uint256[2] c;
}

error SnapshotV2__RandomWordsNotUpdated(string message);
error SnapshotV2__CommitmentAlreadyUsed(string message);
error SnapshotV2__InvalidProof(string message);
error SnapshotV2__NullifierAlreadyUsed(string message);
error SnapshotV2__RootNotKnown(string message);
error SnapshotV2__TimeInterval(string message);

interface IVRFv2SubscriptionManager {
    function requestRandomWords() external;

    function getRandomWords() external view returns (uint256[] memory);
}

interface IVerifier {
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[2] memory input
    ) external returns (bool r);
}

contract SnapshotV2 is
    FunctionsClient,
    ConfirmedOwner,
    AutomationCompatibleInterface,
    MerkleTree,
    ReentrancyGuard
{
    using Functions for Functions.Request;

    // Chainlink Automation variables
    bytes public requestCBOR;
    uint64 public subscriptionId;
    uint32 public fulfillGasLimit;
    uint256 public constant updateInterval = 2 weeks;
    uint256 public lastUpkeepTimeStamp;
    uint256 public upkeepCounter;
    uint256 public responseCounter;

    // Chainlink functions variables
    bytes32 public latestRequestId;
    bytes public latestResponse;
    bytes public latestError;
    event OCRResponse(bytes32 indexed requestId, bytes result, bytes err);

    // Contract Variables
    IVerifier public verifier;
    IVRFv2SubscriptionManager public subscriptionManager;
    mapping(bytes32 => bool) public nullifiers;
    mapping(bytes32 => bool) public commitments;
    string[] private messages;
    event Inserted(bytes32 commitment, uint32 insertedIndex, address wallet);
    event messagePosted(string message, bytes32 nullifier);
    event messagesCleared();

    constructor(
        address oracle,
        IVerifier _verifier,
        uint32 _merkleTreeHeight,
        address _hasher,
        address _subscriptionManager,
        uint64 _subscriptionId,
        uint32 _fulfillGasLimit
    )
        FunctionsClient(oracle)
        ConfirmedOwner(msg.sender)
        MerkleTree(_merkleTreeHeight, _hasher)
    {
        messages = new string[](0);
        verifier = _verifier;
        subscriptionManager = IVRFv2SubscriptionManager(_subscriptionManager);
        subscriptionId = _subscriptionId;
        fulfillGasLimit = _fulfillGasLimit;
        lastUpkeepTimeStamp = block.timestamp;
    }

    /**
     * @notice Generates a new Functions.Request. This pure function allows the request CBOR to be generated off-chain, saving gas.
     *
     * @param source JavaScript source code
     * @param secrets Encrypted secrets payload
     * @param args List of arguments accessible from within the source code
     */
    function generateRequest(
        string calldata source,
        bytes calldata secrets,
        string[] calldata args
    ) public pure returns (bytes memory) {
        Functions.Request memory req;
        req.initializeRequest(
            Functions.Location.Inline,
            Functions.CodeLanguage.JavaScript,
            source
        );
        if (secrets.length > 0) {
            req.addRemoteSecrets(secrets);
        }
        if (args.length > 0) req.addArgs(args);

        return req.encodeCBOR();
    }

    /**
     * @notice Sets the bytes representing the CBOR-encoded Functions.Request that is sent when performUpkeep is called

    * @param _subscriptionId The Functions billing subscription ID used to pay for Functions requests
    * @param _fulfillGasLimit Maximum amount of gas used to call the client contract's `handleOracleFulfillment` function
    * @param newRequestCBOR Bytes representing the CBOR-encoded Functions.Request
    */
    // function setRequest(
    //     uint64 _subscriptionId,
    //     uint32 _fulfillGasLimit,
    //     bytes calldata newRequestCBOR
    // ) external onlyOwner {
    //     subscriptionId = _subscriptionId;
    //     fulfillGasLimit = _fulfillGasLimit;
    //     requestCBOR = newRequestCBOR;
    // }

    /**
     * @notice Used by Automation to check if performUpkeep should be called.
     *
     * Returns a tuple where the first element is a boolean which determines if upkeep is needed and the
     * second element contains custom bytes data which is passed to performUpkeep when it is called by Automation.
     */
    function checkUpkeep(
        bytes memory
    ) public view override returns (bool upkeepNeeded, bytes memory) {
        upkeepNeeded = (block.timestamp - lastUpkeepTimeStamp) > updateInterval;
    }

    /**
     * @notice Called by Automation to trigger a Functions request
     */
    function performUpkeep(bytes calldata) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded)
            revert SnapshotV2__TimeInterval("Time interval not met");
        lastUpkeepTimeStamp = block.timestamp;
        upkeepCounter = upkeepCounter + 1;

        bytes32 requestId = s_oracle.sendRequest(
            subscriptionId,
            requestCBOR,
            fulfillGasLimit
        );

        s_pendingRequests[requestId] = s_oracle.getRegistry();
        emit RequestSent(requestId);
        latestRequestId = requestId;
    }

    /**
     * * @notice Callback that is invoked once the DON has resolved the request or hit an error
   *
   * @param requestId The request ID, returned by sendRequest()
   * @param response Aggregated response from the user code
   * @param err Aggregated error from the user code or from the execution pipeline
    @dev Gets the list of wallets and generates a commitment for each
    and inserts them into the merkle tree.
  */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        latestResponse = response;
        latestError = err;
        emit OCRResponse(requestId, response, err);
        uint temp = subscriptionManager.getRandomWords()[0];
        subscriptionManager.requestRandomWords();
        uint[] memory randomWords = subscriptionManager.getRandomWords();
        if (temp == randomWords[0])
            revert SnapshotV2__RandomWordsNotUpdated(
                "Random words not updated"
            );

        for (uint i = 0; i < randomWords.length; i++) {
            // generate commitment on-chain using vrf
            uint randomNum = randomWords[i];
            bytes32 _commitment = keccak256(abi.encodePacked(randomNum));
            // TODO: Replace with wallet address
            address wallet = abi.decode(response, (address));
            insertIntoTree(_commitment, wallet);
        }
    }

    /**
    @dev Calls insert function on merkle tree and emits Inserted event
  */
    function insertIntoTree(
        bytes32 _commitment,
        address wallet
    ) public nonReentrant {
        if (commitments[_commitment])
            revert SnapshotV2__CommitmentAlreadyUsed("Commitment already used");

        uint32 insertedIndex = _insert(_commitment);
        commitments[_commitment] = true;
        emit Inserted(_commitment, insertedIndex, wallet);
    }

    /**
    @dev Posts a message to the merkle tree, emits messagePosted event,
    and verifies the proof
  */
    function postMessageWithProof(
        string memory _message,
        bytes32 _nullifierHash,
        bytes32 _root,
        Proof memory _proof
    ) external nonReentrant {
        if (nullifiers[_nullifierHash])
            revert SnapshotV2__NullifierAlreadyUsed("Nullifier already used");

        if (!isKnownRoot(_root))
            revert SnapshotV2__RootNotKnown("Root not known");

        uint[2] memory publicInputs = [uint(_root), uint(_nullifierHash)];
        if (!verifier.verifyProof(_proof.a, _proof.b, _proof.c, publicInputs))
            revert SnapshotV2__InvalidProof("Invalid proof");

        nullifiers[_nullifierHash] = true;
        messages.push(_message);
        emit messagePosted(_message, _nullifierHash);
    }

    /**
    @dev Returns the list of messages
  */
    function getMessages() external view returns (string[] memory) {
        return messages;
    }

    /**
    @dev Deletes the list of messages and emits messagesCleared event
  */
    function clearMessages() public {
        delete messages;
        messages = new string[](0);
        emit messagesCleared();
    }

    /**
    @dev Checks if a nullifier has been used
  */
    function isNullifierUsed(bytes32 _nullifier) public view returns (bool) {
        return nullifiers[_nullifier];
    }
}
