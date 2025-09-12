import { HStack, StackProps } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';

interface NavItemProps extends StackProps {
  to: string;
  children: React.ReactNode;
}

export function NavItem({ to, children, ...props }: NavItemProps) {
  return (
    <NavLink to={to}>
      {({ isActive }) => (
        <HStack
          px='1'
          h='10'
          pl={2}
          borderRadius='lg'
          w='100%'
          whiteSpace='nowrap'
          bg={isActive ? '#ef4444' : 'gray.500'}
          fontWeight={isActive ? '600' : '500'}
          color='white'
          _hover={{ opacity: 0.9 }}
          {...props}
        >
          {children}
        </HStack>
      )}
    </NavLink>
  );
}
