import React from 'react';
import {
  Box,
  Flex,
  IconButton,
  Spacer,
  useColorMode,
  Text,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { 
  HamburgerIcon, 
  MoonIcon, 
  SunIcon, 
  SettingsIcon,
  ChevronDownIcon
} from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';

const Header = ({ toggleSidebar }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();

  return (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      py={2}
      px={4}
      bg={colorMode === 'dark' ? 'gray.900' : 'white'}
      borderBottomWidth="1px"
      borderColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
    >
      <Flex align="center">
        <IconButton
          aria-label="Toggle Sidebar"
          icon={<HamburgerIcon />}
          variant="ghost"
          onClick={toggleSidebar}
          mr={2}
        />
        <Text fontSize="lg" fontWeight="bold" color={colorMode === 'dark' ? 'brand.300' : 'brand.500'}>
          Candy AI
        </Text>
      </Flex>

      <Spacer />

      <Flex>
        <Menu>
          <MenuButton as={Button} rightIcon={<ChevronDownIcon />} variant="ghost">
            Možnosti
          </MenuButton>
          <MenuList>
            <MenuItem onClick={() => navigate('/characters')}>Postavy</MenuItem>
            <MenuItem onClick={() => navigate('/settings')}>Nastavení</MenuItem>
          </MenuList>
        </Menu>

        <IconButton
          ml={4}
          aria-label="Toggle Color Mode"
          icon={colorMode === 'dark' ? <SunIcon /> : <MoonIcon />}
          onClick={toggleColorMode}
          variant="ghost"
        />

        <IconButton
          ml={2}
          aria-label="Settings"
          icon={<SettingsIcon />}
          onClick={() => navigate('/settings')}
          variant="ghost"
        />
      </Flex>
    </Flex>
  );
};

export default Header;