import Navbar from "../../../components/Navbar";
import SearchBar from "../../../components/SearchBar";
import PostMessage from "../../../components/PostMessage";
import Insert from "../../../components/Insert";
import {useState, useEffect} from "react";
import {Box, Button} from "@chakra-ui/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

export default function uniswap(){
    const [message, setMessage] = useState("");
    const [nullifierHash, setNullifierHash] = useState("");
    const [root, setRoot] = useState("");
    const [proof, setProof] = useState("");
    const [selectedAddresses, setSelectedAddresses] = useState(["hello", "goodbye"]);
    const [isSelected, setIsSelected] = useState(false);
    const [tree, setTree] = useState(null);

    const {address} = useAccount();


    useEffect(() => {
      if(selectedAddresses.find(address)){
        setIsSelected(true);
      }
    }, [])

    return(
        <>
    <Navbar />
    <SearchBar />
    <Box display="flex" alignItems="center" justifyContent="center">
      <Box display="flex" flexDirection="column" alignItems="center">
        <Insert _isSelected={isSelected} _tree={tree}/>
      <PostMessage _message={message} _nullifierHash={nullifierHash} _root={root} _proof={proof}/>
        <Box alignSelf="flex-end" marginTop="20px" marginRight="20px">
          <ConnectButton />
        </Box>
      </Box>
      <Box marginLeft="20px">
        {selectedAddresses.map((_address, index) => (
          <p key={index}>{_address}</p>
        ))}
      </Box>
    </Box>
    </>
    )
}