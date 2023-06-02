import Navbar from "../../../components/Navbar";
import Insert from "../../../components/Insert";
import PostMessage from "../../../components/PostMessage";
import { useState, useEffect } from "react";
import { Box, VStack, Input } from "@chakra-ui/react";
import { useAccount } from "wagmi";
import { writeContract } from "@wagmi/core";
import { useRouter } from "next/router";
import { SNAPSHOTV2_ABI, SNAPSHOTV2_ADDRESS } from "../../../constants";

export default function Uniswap() {
  const [selectedAddresses, setSelectedAddresses] = useState(["0x1", "0x2"]);
  const [isSelected, setIsSelected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState(["hello", "goodbye"]);

  const { address } = useAccount();
  const { pathname } = useRouter();

  async function deleteTree() {
    console.log("Clearing tree and messages...");
    const response = await fetch("/api/delete", {
      method: "DELETE",
    });
  }

  async function getSelectedAddresses() {
    setIsLoading(true);
    console.log("Requesting selected addresses");
    let addressesList = await writeContract({
      address: SNAPSHOTV2_ADDRESS,
      abi: SNAPSHOTV2_ABI,
      method: "getSelectedAddresses",
    });
    setSelectedAddresses(addressesList);
    setIsLoading(false);
  }

  async function getMessages() {
    setIsLoading(true);
    let messagesList = await writeContract({
      address: SNAPSHOTV2_ADDRESS,
      abi: SNAPSHOTV2_ABI,
      method: "getMessages",
      params: [pathname.substring(1)],
    });
    setMessages(messagesList);
    setIsLoading(false);
  }

  useEffect(() => {
    // getMessages();
    if (selectedAddresses.length === 0) {
      getSelectedAddresses();
    }
    if (selectedAddresses.includes(address)) {
      setIsSelected(true);
    }

    const interval = setInterval(deleteTree, 1209600000);
    return () => clearInterval(interval);
  }, []);


  return (
    <>
      <Navbar />
      <Box display="flex" alignItems="flex-start" justifyContent="space-between" mt="20px">
        <Box>
          <VStack spacing="20px">
            <Box marginLeft={"20px"}>
              <Box>
                <Input
                  value="Selected"
                  fontWeight="bold"
                  variant="unstyled"
                  isDisabled
                />
              </Box>
              {selectedAddresses.map((address, index) => (
                <Input
                  key={index}
                  value={address}
                  isDisabled
                  variant="unstyled"
                  borderBottom="1px solid gray"
                  pl="0"
                />
              ))}
            </Box>
          </VStack>
        </Box>
        <Box>
          <VStack spacing="20px">
            <Box>
              <Input
                value="Posts"
                fontWeight="bold"
                variant="unstyled"
                isDisabled
              />
            </Box>
            {messages.map((message, index) => (
              <Input
                key={index}
                value={message}
                isDisabled
                variant="unstyled"
                borderBottom="1px solid gray"
                pl="0"
              />
            ))}
          </VStack>
        </Box>
        <Box>
          <Insert _isSelected={isSelected} />
          <PostMessage />
        </Box>
      </Box>
    </>
  );
}

