const { assert, expect } = require("chai");
const {SnapShotV2, Verifier, Poseidon, VRFv2SubscriptionManager} = require("../deployed-contracts.json");
const { ethers, network } = require("hardhat");
const { poseidonContract, buildPoseidon } = require("circomlibjs");
const {MerkleTreeJS} = require("../constants/merkleTree.js");
const { groth16 } = require("snarkjs");
const path = require("path");
const {MERKLE_TREE_HEIGHT, NUM_INPUTS, SEPOLIA_FUNCTIONS_ORACLE_ADDRESS, SUB_ID, FULFILL_GAS_LIMIT} = require("../constants/index.js");

function poseidonHash(poseidon, inputs) {
  const hash = poseidon(inputs.map((x) => ethers.BigNumber.from(x).toBigInt()));
  const hashStr = poseidon.F.toString(hash);
  const hashHex = ethers.BigNumber.from(hashStr).toHexString();
  const bytes32 = ethers.utils.hexZeroPad(hashHex, 32);
  return bytes32;
}

class PoseidonHasher {
    poseidon;

  constructor(poseidon) {
    this.poseidon = poseidon;
  }

  hash(left, right) {
    return poseidonHash(this.poseidon, [left, right]);
  }
}

class Insert {
    nullifier;
    poseidon;
    leafIndex;

  constructor(nullifier, poseidon, leafIndex) {
    this.nullifier = nullifier;
    this.poseidon = poseidon;
    this.leafIndex = leafIndex;
  }

  static new(poseidon) {
    const nullifier = ethers.utils.randomBytes(15);
    return new this(nullifier, poseidon);
  }

  get commitment() {
    return poseidonHash(this.poseidon, [this.nullifier, 0]);
  }

  get nullifierHash() {
    if (this.leafIndex === undefined)
      throw new Error("leafIndex is unset yet");
    return poseidonHash(this.poseidon, [this.nullifier, 1, this.leafIndex]);
  }
}

async function prove(witness) {
  const wasmPath = path.join(__dirname, "../circuits/build/post_js/post.wasm");
  const zkeyPath = path.join(__dirname, "../circuits/build/post_js/post_0001.zkey");
  const { proof } = await groth16.fullProve(witness, wasmPath, zkeyPath);
  const solProof = {
    a: [proof.pi_a[0], proof.pi_a[1]],
    b: [
      [proof.pi_b[0][1], proof.pi_b[0][0]],
      [proof.pi_b[1][1], proof.pi_b[1][0]],
    ],
    c: [proof.pi_c[0], proof.pi_c[1]],
  };
  return solProof;
}

describe("SnapshotV2", () => {
    let snapshotV2;
   // let verifier;
    let provider;
    let signer;
    let poseidon;
    let poseidonContractInstance;
    let VerifierABI;
    let PoseidonABI;
    // let SnapShotV2ABI;

    before(async () => {
        console.log("Testing on " + network.name + "\n");
        poseidon = await buildPoseidon();
        // SnapShotV2ABI = require("../artifacts/contracts/SnapshotV2.sol/SnapshotV2.json").abi;
        VerifierABI = require("../artifacts/contracts/Verifier.sol/Verifier.json").abi;
        PoseidonABI = poseidonContract.generateABI(NUM_INPUTS);
    });

    beforeEach(async () => {
        if(network.name === "localhost" || network.name === "hardhat") {
            provider = ethers.getDefaultProvider();
            signer = (await ethers.getSigners())[0];
        }
        else{
             provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
              // Get private wallet key from the .env file
              let signerPrivateKey = process.env.PRIVATE_KEY;
            signer = new ethers.Wallet(signerPrivateKey, provider);
        }
        //verifier = new ethers.Contract(Verifier, VerifierABI, signer);
        poseidonContractInstance = new ethers.Contract(Poseidon, PoseidonABI, signer);

        const snapShotV2ContractFactory = await ethers.getContractFactory("SnapshotV2");
        args = [SEPOLIA_FUNCTIONS_ORACLE_ADDRESS, Verifier, MERKLE_TREE_HEIGHT, Poseidon, VRFv2SubscriptionManager, SUB_ID, FULFILL_GAS_LIMIT]
        snapshotV2 = await snapShotV2ContractFactory.deploy(...args);
        await snapshotV2.deployed();
    });

    // it("generates same poseidon hash", async function () {
    //     const res = await poseidonContractInstance["poseidon(uint256[2])"]([1, 2]);
    //     const res2 = poseidon([1, 2]);
    //     assert.equal(res.toString(), poseidon.F.toString(res2));
    // });

    // describe("Constructor", () => {
    //     it("should create new messages array", async () => {
    //         const messages = await snapshotV2.getMessages();
    //         assert.equal(messages.length, 0);
    //     });
    //     it("should instantiate verifier contract", async () => {
    //         const verifier = await snapshotV2.verifier();
    //         assert.equal(verifier, Verifier);
    //     });
    // });

    //describe("insertIntoTree", () => {
        // it("should emit an event", async () => {
        //     const insert = Insert.new(poseidon);
        //     const tx = await snapshotV2.insertIntoTree(insert.commitment, signer.address);
        //     const txReceipt = await tx.wait(1);
        //     assert.equal(txReceipt.events[0].event, "Inserted");
        // });
        // it("should emit the correct commitment", async () => {
        //     const insert = Insert.new(poseidon);
        //     const tx = await snapshotV2.insertIntoTree(insert.commitment, signer.address);
        //     const txReceipt = await tx.wait(1);
        //     assert.equal(txReceipt.events[0].args.commitment, insert.commitment);
        // });

        // it("should insert a new leaf into the tree", async () => {
        //     const insert = Insert.new(poseidon);
        //     const tx = await snapshotV2.insertIntoTree(insert.commitment, signer.address);
        //     const txReceipt = await tx.wait(1);
        //     insert.leafIndex = txReceipt.events[0].args.insertedIndex;
        //     const rootFromContract = await snapshotV2.getLastRoot();
        //     const tree = new MerkleTreeJS(MERKLE_TREE_HEIGHT, "test", new PoseidonHasher(poseidon));
        //     await tree.insert(insert.commitment);
        //     const rootJS = await tree.root();
        //     assert.equal(rootFromContract.toString(), rootJS.toString());
        // });
//         it("should reset the tree if it is full", async () => {
//             const tree = new MerkleTreeJS(MERKLE_TREE_HEIGHT, "test", new PoseidonHasher(poseidon));
//             for(let i = 0; i <= Math.pow(2, MERKLE_TREE_HEIGHT); i++) {
//                 const insert = Insert.new(poseidon);
//                 const tx = await snapshotV2.insertIntoTree(insert.commitment, signer.address);
//                 const txReceipt = await tx.wait(1);
//                 insert.leafIndex = txReceipt.events[0].args.insertedIndex;
//                 const rootFromContract = await snapshotV2.getLastRoot();
//                 await tree.insert(insert.commitment);
//                 const rootJS = await tree.root();
//                 assert.equal(rootFromContract.toString(), rootJS.toString());
//                 if(i === Math.pow(2, MERKLE_TREE_HEIGHT)) {
//                     assert.equal(await snapshotV2.nextIndex(), 1);
//                 }
//             }
//         });
//    });

    describe("postMessageWithProof", () => {
        // it("should add the message to the messages array and emit an event", async () => {
        //     // Insert a message
        //     const insert = Insert.new(poseidon);
        //     let tx = await snapshotV2.insertIntoTree(insert.commitment, signer.address);
        //     let txReceipt = await tx.wait(1);
        //     assert.equal(txReceipt.events[0].args.commitment, insert.commitment);
        //     insert.leafIndex = txReceipt.events[0].args.insertedIndex;
        //     const tree = new MerkleTreeJS(MERKLE_TREE_HEIGHT, "test", new PoseidonHasher(poseidon));
        //     assert.equal(await tree.root(), await snapshotV2.roots(0));
        //     await tree.insert(insert.commitment);
        //     assert.equal(tree.totalElements, await snapshotV2.nextIndex());
        //     assert.equal(await tree.root(), await snapshotV2.roots(1));
        //     // Post
        //     const message = "Hello world";
        //     const nullifierHash = insert.nullifierHash;
        //     const {root, path_elements, path_index} = await tree.path(
        //         insert.leafIndex
        //     );
        //     const witness = {
        //         root: root,
        //         nullifierHash: nullifierHash,
        //         // Private
        //         nullifier: ethers.BigNumber.from(insert.nullifier).toString(),
        //         pathElements: path_elements,
        //         pathIndices: path_index
        //     }
        //     const solProof = await prove(witness);
        //     const postMessageWithProoftx = await snapshotV2.postMessageWithProof(
        //         message,
        //         nullifierHash,
        //         root,
        //         solProof
        //     );
        //     txReceipt = await postMessageWithProoftx.wait(1);
        //     const messages = await snapshotV2.getMessages();
        //     assert.equal(messages[0], message);
        //     assert.equal(txReceipt.events[0].event, "messagePosted");
        // });
        // it("should prevent a user from posting more than one message", async () => {
        //     // Insert a message
        //     const insert = Insert.new(poseidon);
        //     let tx = await snapshotV2.insertIntoTree(insert.commitment, signer.address);
        //     let txReceipt = await tx.wait(1);
        //     assert.equal(txReceipt.events[0].args.commitment, insert.commitment);
        //     insert.leafIndex = txReceipt.events[0].args.insertedIndex;
        //     const tree = new MerkleTreeJS(MERKLE_TREE_HEIGHT, "test", new PoseidonHasher(poseidon));
        //     assert.equal(await tree.root(), await snapshotV2.roots(0));
        //     await tree.insert(insert.commitment);
        //     assert.equal(tree.totalElements, await snapshotV2.nextIndex());
        //     assert.equal(await tree.root(), await snapshotV2.roots(1));
        //     // Post
        //     const nullifierHash = insert.nullifierHash;
        //     const {root, path_elements, path_index} = await tree.path(
        //         insert.leafIndex
        //     );
        //     const witness = {
        //         root: root,
        //         nullifierHash: nullifierHash,
        //         // Private
        //         nullifier: ethers.BigNumber.from(insert.nullifier).toString(),
        //         pathElements: path_elements,
        //         pathIndices: path_index
        //     }
        //     const solProof = await prove(witness);
        //     const message1 = "Hello world";
        //     const message2 = "Goodbye world";
        //     await snapshotV2.postMessageWithProof(
        //         message1,
        //         nullifierHash,
        //         root,
        //         solProof
        //     );
        //     try{
        //         await snapshotV2.postMessageWithProof(
        //             message2,
        //             nullifierHash,
        //             root,
        //             solProof
        //         );
        //         assert.fail("Expect tx to fail");
        //     }
        //     catch(error){
        //         expect(error.message).to.have.string(
        //             "Nullifier already used"
        //         );
        //     }
        // });
        // it("should prevent a user from posting from a non-existent root", async () => {
        //     // Insert a message
        //     const insert = Insert.new(poseidon);
        //     let tx = await snapshotV2.insertIntoTree(insert.commitment, signer.address);
        //     let txReceipt = await tx.wait(1);
        //     assert.equal(txReceipt.events[0].args.commitment, insert.commitment);
        //     insert.leafIndex = txReceipt.events[0].args.insertedIndex;
        //     const insertAttacker = Insert.new(poseidon);
        //     insertAttacker.leafIndex = 1;
        //     const tree = new MerkleTreeJS(MERKLE_TREE_HEIGHT, "test", new PoseidonHasher(poseidon));
        //     await tree.insert(insert.commitment);
        //     await tree.insert(insertAttacker.commitment);
        //     // Post
        //     const nullifierHash = insertAttacker.nullifierHash;
        //     const {root, path_elements, path_index} = await tree.path(
        //         insertAttacker.leafIndex
        //     );
        //     const witness = {
        //         root: root,
        //         nullifierHash: nullifierHash,
        //         // Private
        //         nullifier: ethers.BigNumber.from(insertAttacker.nullifier).toString(),
        //         pathElements: path_elements,
        //         pathIndices: path_index
        //     }
        //     const solProof = await prove(witness);
        //     const message = "Hello world";
        //     try{
        //         await snapshotV2.postMessageWithProof(
        //             message,
        //             nullifierHash,
        //             root,
        //             solProof
        //         );
        //         assert.fail("Expect tx to fail");
        //     }
        //     catch(error){
        //         expect(error.message).to.have.string(
        //             "Root not known"
        //         );
        //     }
        // });
        it("should work even if we have passed the max number of leaves by resetting the tree", async () => {
            // Insert a message
            const tree = new MerkleTreeJS(MERKLE_TREE_HEIGHT, "test", new PoseidonHasher(poseidon));
            let insert;
            let message;
            let messages;
            const lastMessage = "Goodbye world";
            for(let i = 0; i <= Math.pow(2, MERKLE_TREE_HEIGHT); i++) {
                insert = Insert.new(poseidon);
                const tx = await snapshotV2.insertIntoTree(insert.commitment, signer.address);
                const txReceipt = await tx.wait(1);
                insert.leafIndex = txReceipt.events[0].args.insertedIndex;
                const rootFromContract = await snapshotV2.getLastRoot();
                await tree.insert(insert.commitment);
                const rootJS = await tree.root();
                assert.equal(rootFromContract.toString(), rootJS.toString());
                // Post
                message = "Hello world" + i.toString();
                if(i == Math.pow(2, MERKLE_TREE_HEIGHT)) {
                    await snapshotV2.clearMessages();
                    message = "Goodbye world";
                }
                const nullifierHash = insert.nullifierHash;
                const {root, path_elements, path_index} = await tree.path(
                    insert.leafIndex
                );
                const witness = {
                    root: root,
                    nullifierHash: nullifierHash,
                    // Private
                    nullifier: ethers.BigNumber.from(insert.nullifier).toString(),
                    pathElements: path_elements,
                    pathIndices: path_index
                }
                const solProof = await prove(witness);
                const postMessageWithProoftx = await snapshotV2.postMessageWithProof(
                    message,
                    nullifierHash,
                    root,
                    solProof
                );
                await postMessageWithProoftx.wait(1);
                messages = await snapshotV2.getMessages();
                assert.equal(messages[i], message);
            }
            messages = await snapshotV2.getMessages();
            assert.equal(messages[0], lastMessage);
        }).timeout(1000000);
    });

    // describe("isNullifierUsed", () => {
    //     it("should check if the nullifier is used", async () => {
    //         let nullifier = poseidonHash(poseidon, [1, 2])
    //         let isUsed = await snapshotV2.isNullifierUsed(nullifier);
    //         assert.equal(isUsed, false);

    //         // Insert a message
    //         const insert = Insert.new(poseidon);
    //         let tx = await snapshotV2.insertIntoTree(insert.commitment, signer.address);
    //         let txReceipt = await tx.wait(1);
    //         assert.equal(txReceipt.events[0].args.commitment, insert.commitment);
    //         insert.leafIndex = txReceipt.events[0].args.insertedIndex;
    //         const tree = new MerkleTreeJS(MERKLE_TREE_HEIGHT, "test", new PoseidonHasher(poseidon));
    //         assert.equal(await tree.root(), await snapshotV2.roots(0));
    //         await tree.insert(insert.commitment);
    //         assert.equal(tree.totalElements, await snapshotV2.nextIndex());
    //         assert.equal(await tree.root(), await snapshotV2.roots(1));
    //         // Post
    //         const message = "Hello world";
    //         const nullifierHash = insert.nullifierHash;
    //         const {root, path_elements, path_index} = await tree.path(
    //             insert.leafIndex
    //         );
    //         const witness = {
    //             root: root,
    //             nullifierHash: nullifierHash,
    //             // Private
    //             nullifier: ethers.BigNumber.from(insert.nullifier).toString(),
    //             pathElements: path_elements,
    //             pathIndices: path_index
    //         }
    //         const solProof = await prove(witness);
    //         const postMessageWithProoftx = await snapshotV2.postMessageWithProof(
    //             message,
    //             nullifierHash,
    //             root,
    //             solProof
    //         );
    //         isUsed = await snapshotV2.isNullifierUsed(nullifierHash);
    //         assert.equal(isUsed, true);
    //     })
    // });

    // describe("clearMessages", () => {
    //     it("should emit an event", async () => {
    //         const tx = await snapshotV2.clearMessages();
    //         const receipt = await tx.wait();
    //         const event = receipt.events[0];
    //         assert.equal(event.event, "messagesCleared");
    //     });
    //     // it("should deploy a new Merkle Tree contract", async () => {
    //     //     let tempAddress = MerkleTree;
    //     //     const tx = await snapshotV2.clearMessages();
    //     //     const receipt = await tx.wait();
    //     //     const event = receipt.events[0];
    //     //     const newMerkleTree = event.args[1];
    //     //     assert(newMerkleTree !== null);
    //     // });
    //     it("should clear the messages array", async () => {
    //         // Insert a message
    //         const insert = Insert.new(poseidon);
    //         let tx = await snapshotV2.insertIntoTree(insert.commitment, signer.address);
    //         let txReceipt = await tx.wait(1);
    //         assert.equal(txReceipt.events[0].args.commitment, insert.commitment);
    //         insert.leafIndex = txReceipt.events[0].args.insertedIndex;
    //         const tree = new MerkleTreeJS(MERKLE_TREE_HEIGHT, "test", new PoseidonHasher(poseidon));
    //         assert.equal(await tree.root(), await snapshotV2.roots(0));
    //         await tree.insert(insert.commitment);
    //         assert.equal(tree.totalElements, await snapshotV2.nextIndex());
    //         assert.equal(await tree.root(), await snapshotV2.roots(1));
    //         // Post
    //         const message = "Hello world";
    //         const nullifierHash = insert.nullifierHash;
    //         const {root, path_elements, path_index} = await tree.path(
    //             insert.leafIndex
    //         );
    //         const witness = {
    //             root: root,
    //             nullifierHash: nullifierHash,
    //             // Private
    //             nullifier: ethers.BigNumber.from(insert.nullifier).toString(),
    //             pathElements: path_elements,
    //             pathIndices: path_index
    //         }
    //         const solProof = await prove(witness);
    //         const postMessageWithProoftx = await snapshotV2.postMessageWithProof(
    //             message,
    //             nullifierHash,
    //             root,
    //             solProof
    //         );
    //         let messages = await snapshotV2.getMessages();
    //         assert.equal(messages.length, 1);
    //         tx = await snapshotV2.clearMessages();
    //         await tx.wait(1);
    //         messages = await snapshotV2.getMessages();
    //         assert.equal(messages.length, 0);
    //     });
    // });

    // TODO: Test VRF, AUTOMATION, FUNCTIONS

    // STILL NEED TO FIGURE OUT CLEAR MESSAGES() AND HOW TO CREATE
    // NEW MERKLE TREE CONTRACTS
    // INHERITED CONTRACTS DEPLOT ALL CONTRACTS IN IT --> MEANING
    // THAT I SHOULDNT CREATE NEW MERKLE TREE CONTRACT, BUT
    // NEED TO FIGURE OUT HOW TO DELETE ALL LEAVES OR REPLACE THEM
    if(network.name !== "localhost" && network.name !== "hardhat") {
        describe("fulfullRequest", () => {
            it("should emit an event", async () => {
                const tx = await snapshotV2.getWallets();
            });
        });
    }

});
