import React from 'react';
import { Header } from './Header';

export interface NavbarProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Navbar component:
 * Top navigation bar that sits flush against the sidebar border with zero left gap.
 * Provides global search, real-time clock, role telemetry, joint handback interlock trigger,
 * and user quick profile.
 */
export const Navbar: React.FC<NavbarProps> = (props) => {
  return <Header {...props} />;
};

export default Navbar;
