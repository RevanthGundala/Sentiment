const express = require('express');
const { ethers } = require('hardhat');
const { MerkleTreeJS } = require('../constants/merkleTree.js');
const { MERKLE_TREE_HEIGHT } = require('../constants/index.js');
const { buildPoseidon } = require('circomlibjs');

const app = express();
app.use(express.json());

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

async function initialize() {
  const poseidon = await buildPoseidon();

  const hasher = new PoseidonHasher(poseidon);
  let tree = new MerkleTreeJS(MERKLE_TREE_HEIGHT, 'Tree', hasher);

  app.get('/api/get', (req, res) => {
    res.send(tree);
  });

  app.post('/api/post', (req, res) => {
    tree.insert(req.body);
    res.send('Inserted into tree');
  });

  app.delete('/api/delete', (req, res) => {
    const hasher = new PoseidonHasher(poseidon);
    tree = new MerkleTreeJS(MERKLE_TREE_HEIGHT, 'Tree', hasher);
    res.send('Deleted tree');
  });

  app.listen(5002, () => {
    console.log('Server started on port 5002');
  });
}

initialize();
