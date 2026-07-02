import React from 'react';
import { LocalAuthProvider } from '../context/LocalAuthContext';

interface LocalLoginGateProps {
  children: React.ReactNode;
}

export default function LocalLoginGate({ children }: LocalLoginGateProps) {
  return <LocalAuthProvider>{children}</LocalAuthProvider>;
}
