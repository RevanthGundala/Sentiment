import { Box, Flex, Link, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import SearchBar from "./SearchBar";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Navbar() {
  return (
    <Box bg="gray.200" py={4}>
      <Flex maxW="container.lg" mx="auto" align="center" justify="space-between">
        <Box>
          <NextLink href="/" passHref>
            <Link fontSize="xl" fontWeight="bold">
              SnapshotV2
            </Link>
          </NextLink>
        </Box>
        <Box>
          <SearchBar />
        </Box>
        <Box>
          <ConnectButton />
        </Box>
      </Flex>
    </Box>
  );
}
