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
    </>
  );
}
