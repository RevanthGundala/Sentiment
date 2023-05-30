import Navbar from "../../../components/Navbar";
import SearchBar from "../../../components/SearchBar";
import PostMessage from "../../../components/PostMessage";
import {useState} from "react";
import {Box} from "@chakra-ui/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

export default function uniswap(){
    const [message, setMessage] = useState("");
    const [nullifierHash, setNullifierHash] = useState("");
    const [root, setRoot] = useState("");
    const [proof, setProof] = useState("");
    const [selectedAddresses, setSelectedAddresses] = useState(["hello", "goodbye"]);

    return(
        <>
    <Navbar />
    <SearchBar />
    <Box display="flex" alignItems="center" justifyContent="center">
      <Box display="flex" flexDirection="column" alignItems="center">
      <PostMessage _message={message} _nullifierHash={nullifierHash} _root={root} _proof={proof}/>
        <Box alignSelf="flex-end" marginTop="20px" marginRight="20px">
          <ConnectButton />
        </Box>
      </Box>
      <Box marginLeft="20px">
        {selectedAddresses.map((address, index) => (
          <p key={index}>{address}</p>
        ))}
      </Box>
    </Box>
    </>
    )
}