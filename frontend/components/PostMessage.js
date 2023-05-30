import { useState } from "react";
import { Box, Input, Button } from "@chakra-ui/react";
import { writeContract } from "@wagmi/core";

export default function PostMessage({ _nullifierHash, _root, _witness }) {
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

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

  async function post() {
    setIsLoading(true);
    const solProof = await prove(_witness);
    await writeContract({
      address: "",
      abi: "",
      method: "postMessageWithProof",
      args: [message, _nullifierHash, _root, solProof],
    });
    console.log("Posted message")
    setIsLoading(false);
  }

  return (
    <>
      <Box
        width="300px"
        height="300px"
        display="flex"
        justifyContent="center"
        alignItems="center"
        border="1px solid gray"
        borderRadius="8px"
        margin="20px"
      >
        <Input
          placeholder="Type your message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          width="80%"
        />
      </Box>
      <Button
        colorScheme="blue"
        isLoading={isLoading}
        loadingText="Submitting Proof"
        onClick={post}
      >
        Post Message
      </Button>
    </>
  );
}
