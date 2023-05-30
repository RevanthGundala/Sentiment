import { useState } from "react";
import { writeContract } from "@wagmi/core";
import path from "path"
import { Box, Input, Button } from "@chakra-ui/react";
import {ethers} from "ethers"; 

export default function Insert({_isSelected, _tree}){
    const [isSelected, setIsSelected] = useState(_isSelected);
    const [isLoading, setIsLoading] = useState(false);
    const [tree, setTree] = useState(_tree);
    const [nullifierHash, setNullifierHash] = useState("");
    const [root, setRoot] = useState("");
    const [witness, setWitness] = useState("");


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

    async function insertIntoTree(e){
        e.preventDefault();
        setIsLoading(true);
        const insert = Insert.new(poseidon);
        const tx = await writeContract({
            address: "",
            abi: "",
            functionName: "insertIntoTree",
            args: [insert.commitment]
        })
        await tree.insert(insert.commitment);
        const {_root, _path_elements, _path_index} = await tree.path(insert.leafIndex);
        setRoot(_root);
        setNullifierHash(insert.nullifierHash);
        let _witness = {
            root: root,
            nullifierHash: nullifierHash,
            nullifier: ethers.BigNumber.from(insert.nullifier).toString(),
            pathElements: _path_elements,
            pathIndicies: _path_index
        }
        // TODO: Show on main screen
        setWitness(_witness);
        console.log(witness);
        setIsLoading(false);
    }

    return(
        <>
         <Button
            colorScheme="blue"
            disabled={!isSelected}
            isLoading={isLoading}
            loadingText="Inserting commitment into the tree"
            onClick={insertIntoTree}
        >
            Generate Token
        </Button>
        </>
    )
}