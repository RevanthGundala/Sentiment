import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Box, Button, ButtonGroup, Input } from "@chakra-ui/react";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import { writeContract } from "@wagmi/core";
import Navbar from "../../components/Navbar";
import SearchBar from "../../components/SearchBar";

export default function Home() {
  const [isSelected, setIsSelected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAddresses, setSelectedAddresses] = useState(["hello", "goodbye"]);
  const { addresss, isConnected } = useAccount();

  return (
    <>
    <Navbar />
    <SearchBar />
    <Box display="flex" alignItems="center" justifyContent="center">
      <Box display="flex" flexDirection="column" alignItems="center">
        <Box alignSelf="flex-end" marginTop="20px" marginRight="20px">
          <ConnectButton />
        </Box>
      </Box>
    </Box>
    </>
  );
}
