import Navbar from "../../../components/Navbar";
import Insert from "../../../components/Insert";
import {useState, useEffect} from "react";
import {Box, Button} from "@chakra-ui/react";
import { useAccount, writeContract } from "wagmi";
import { useRouter } from "next/router";

/*
num, field = make_field(fdp.ConsumeIntInRange(1, 4096), fdp.ConsumeUnicodeNoSurrogates(fdp.ConsumeIntInRange(1, 4096)), type, True)
*/

export default function Uniswap(){
    const [selectedAddresses, setSelectedAddresses] = useState([]);
    const [isSelected, setIsSelected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState([]);

    const {address} = useAccount();

    async function deleteTree(){
      console.log("Clearing tree and messages...");
      const response = await fetch("/api/delete", {
        method: "DELETE"
      });
      // upload messages to off-chain db

      // await writeContract({
      //   address: "",
      //   abi: "",
      //   method: "clearMessages"
      // });
    }

    async function getSelectedAddresses(){
      setIsLoading(true);
      console.log("Requesting selected addresses");
      let addressesList = await writeContract({
        address: "",
        abi: [],
        method: "getSelectedAddresses"
      })
      setSelectedAddresses(addressesList);
      setIsLoading(false);
    }

    async function getMessages(){
      setIsLoading(true);
      const router = useRouter();
      const {pathname} =  router;
      let messagesList = await writeContract({
        address: "",
        abi: [],
        method: "getMessages",
        params: [pathname.substring(1)]
      })
      setMessages(messagesList);
      setIsLoading(false);
    }

    useEffect(() => {
      //getMessages();
      if(selectedAddresses.length == 0){
        //getSelectedAddresses();
      }
      if(selectedAddresses.includes(address)){
        setIsSelected(true);
      }
      // Call requestSelectedAddresses every 2 weeks (1209600000 milliseconds)
      
    const interval = setInterval(deleteTree, 1209600000);
    return () => clearInterval(interval);
    }, [messages])

    return(
        <>
    <Navbar />
    <Box display="flex" alignItems="center" justifyContent="center">
      <Box display="flex" flexDirection="column" alignItems="center" marginTop="50px">
        <Insert _isSelected={isSelected}/>
      </Box>
      <Box marginLeft="20px" marginTop="20px">
        {selectedAddresses.map((_address, index) => (
          <p key={index}>{_address}</p>
        ))}
      </Box>
      <Box marginLeft="20px" marginTop="20px">
        {messages.map((message, index) => (
          <p key={index}>{message}</p>
        ))}
      </Box>
    </Box>
    </>
    )
}