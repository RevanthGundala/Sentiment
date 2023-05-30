import Navbar from "../../../components/Navbar";
import SearchBar from "../../../components/SearchBar";
import PostMessage from "../../../components/PostMessage";
import Insert from "../../../components/Insert";
import {useState, useEffect} from "react";
import {Box, Button} from "@chakra-ui/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

export default function Uniswap(){
    const [selectedAddresses, setSelectedAddresses] = useState(["hello", "goodbye"]);
    const [isSelected, setIsSelected] = useState(false);
    const [tree, setTree] = useState(null);

    const {address} = useAccount();


    useEffect(() => {
      if(selectedAddresses.includes(address)){
        setIsSelected(true);
      }
    }, [])

    return(
        <>
    <Navbar />
    <Box display="flex" alignItems="center" justifyContent="center">
      <Box display="flex" flexDirection="column" alignItems="center" marginTop="50px">
        <Insert _isSelected={isSelected} _tree={tree}/>
      </Box>
      <Box marginLeft="20px" marginTop="20px">
        {selectedAddresses.map((_address, index) => (
          <p key={index}>{_address}</p>
        ))}
      </Box>
    </Box>
    </>
    )
}