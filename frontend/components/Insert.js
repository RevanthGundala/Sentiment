import { useState } from "react";
import { writeContract } from "@wagmi/core";
import path from "path"
import { Box, Input, Button } from "@chakra-ui/react";
import {ethers} from "ethers"; 
import { buildPoseidon } from "circomlibjs";
import PostMessage from "./PostMessage";
import { SENTIMENT_ABI, SENTIMENT_ADDRESS } from "../constants";

export default function Insert({_isSelected}){
    const [isSelected, setIsSelected] = useState(_isSelected);
    const [isLoading, setIsLoading] = useState(false);
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
        console.log("Inserting... ");
        setIsLoading(true);
        const insert = Insert.new(poseidon);
        const tx = await writeContract({
            address: SENTIMENT_ADDRESS,
            abi: SENTIMENT_ABI,
            functionName: "insertIntoTree",
            args: [insert.commitment]
        })
        const response = await fetch("/api/post", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(insert.commitment),
        })
        if(!response.ok){
            throw new Error(response.status);
        }
        const result = await response.text();
        console.log(result);
        const tree = await fetch("/api/get", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
        console.log(tree);
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
        console.log(root);
        console.log(nullifierHash);
        console.log(witness);
        setIsLoading(false);
    }

    return(
        <>
         {isSelected ? (
        <Button
          colorScheme="blue"
          isLoading={isLoading}
          loadingText="Inserting commitment into the tree"
          onClick={insertIntoTree}
        >
          Generate Proof
        </Button>
      ) : (
        <Button isDisabled>
          Not Selected
        </Button>)}
        </>
    )
}