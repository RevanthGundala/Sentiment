import { Box, Flex, Link, Text } from "@chakra-ui/react";
import NextLink from "next/link";

export default function Navbar() {
  return (
    <Box bg="gray.200" py={4}>
      <Flex maxW="container.lg" mx="auto" align="center" justify="space-between">
        <Text fontSize="xl" fontWeight="bold">
          SnapshotV2
        </Text>
        <Flex as="nav" spacing={4}>
          <NavItem href="/">Home</NavItem>
          <NavItem href="/Generate">Generate Token</NavItem>
        </Flex>
      </Flex>
    </Box>
  );
}

function NavItem({ href, children }) {
  return (
    <NextLink href={href} passHref>
      <Link px={2} py={1} rounded="md" fontWeight="bold" color="gray.700" _hover={{ textDecor: "underline" }}>
        {children}
      </Link>
    </NextLink>
  );
}
