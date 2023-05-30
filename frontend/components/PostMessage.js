import { useState } from "react";
import { Box, Input, Button } from "@chakra-ui/react";
import { writeContract } from "@wagmi/core";

export default function PostMessage({ _message, _nullifierHash, _root, _proof }) {
    const [message, setMessage] = useState(_message);
    const [nullifierHash, setNullifierHash] = useState(_nullifierHash);
    const [root, setRoot] = useState(_root);
    const [proof, setProof] = useState(_proof);
    const [isLoading, setIsLoading] = useState(false);
    const [isSelected, setIsSelected] = useState(false);

  async function calculateProof() {
    // Perform calculations
  }

  async function post() {
    let _proof = await calculateProof();
    setProof(_proof);
    await writeContract({
      address: "",
      abi: "",
      method: "postMessageWithProof",
      args: [message, nullifierHash, root, proof],
    });
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
        disabled={!isSelected}
        isLoading={isLoading}
        loadingText="Submitting Proof"
        onClick={post}
      >
        Post Message
      </Button>
    </>
  );
}
