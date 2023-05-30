import { useState } from "react";
import { useRouter } from "next/router";
import { Input, Button, Flex } from "@chakra-ui/react";

export default function SearchBar() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchText.trim() !== "") {
      router.push(`/s/${encodeURIComponent(searchText)}`);
    }
  };

  const handleChange = (e) => {
    setSearchText(e.target.value);
  };

  return (
    <Flex align="center" justify="center" mt={4}>
      <form onSubmit={handleSearch}>
        <Input
          type="text"
          placeholder="Enter search term"
          value={searchText}
          onChange={handleChange}
          mr={2}
        />
        <Button colorScheme="blue" type="submit">
          Search
        </Button>
      </form>
    </Flex>
  );
}
