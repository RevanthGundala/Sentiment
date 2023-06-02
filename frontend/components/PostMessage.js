import { useState } from "react";
import { Box, Textarea, IconButton, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton } from "@chakra-ui/react";
import { writeContract } from "@wagmi/core";
import { BsSendFill } from "react-icons/bs";
import { SENTIMENT_ABI, SENTIMENT_ADDRESS } from "../constants/index";

export default function PostMessage() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [root, setRoot] = useState("");
  const [nullifierHash, setNullifierHash] = useState("");
  const [witness, setWitness] = useState("");

  async function prove() {
    // ... your existing code for the `prove` function
  }

  async function submitProof() {
    setIsModalOpen(true);
  }

  async function post() {
    setIsLoading(true);
    const solProof = await prove(witness);
    await writeContract({
      address: SENTIMENT_ADDRESS,
      abi: SENTIMENT_ABI,
      method: "postMessageWithProof",
      args: [message, nullifierHash, root, solProof],
    });
    console.log("Posted message");
    setIsLoading(false);
    setIsModalOpen(false);
  }

  return (
    <>
      <Box position="relative" width="300px" margin="20px">
        <Textarea
          placeholder="Type your message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          width="100%"
          paddingRight="70px" // Adjust the padding to make space for the button
          resize="vertical" // Allow vertical resizing
          minHeight="50px" // Set the minimum height
        />
        <IconButton
          colorScheme="blue"
          isLoading={isLoading}
          onClick={submitProof}
          aria-label="Post Message"
          icon={<BsSendFill />}
          position="absolute"
          right="10px" // Adjust the position of the button
          top="50%" // Center the button vertically
          transform="translateY(-50%)" // Center the button vertically
        />
      </Box>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Submit Proof</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Textarea
              placeholder="Enter your root"
              value={root}
              onChange={(e) => setRoot(e.target.value)}
              resize="vertical"
              minHeight="100px"
            />
            <Textarea
              placeholder="Enter your nullifier hash"
              value={nullifierHash}
              onChange={(e) => setNullifierHash(e.target.value)}
              resize="vertical"
              minHeight="100px"
            />
            <Textarea
              placeholder="Enter your witness"
              value={witness}
              onChange={(e) => setWitness(e.target.value)}
              resize="vertical"
              minHeight="100px"
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={post}>
              Submit
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
