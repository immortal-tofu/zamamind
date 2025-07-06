import { type EIP712, type FhevmInstance } from '@zama-fhe/relayer-sdk/bundle';
import { useContext, createContext } from 'react';

export type FhevmContextType = {
  instance: FhevmInstance;
  eip712: EIP712;
  setSignature: (signature: string) => void;
  decrypt: (
    handle: string,
    requestSignature: (eip712: any) => Promise<string>,
  ) => Promise<bigint | undefined>;
};

export const FhevmContext = createContext<FhevmContextType | undefined>(
  undefined,
);

export const useFhevm = () => {
  const context = useContext(FhevmContext);
  if (context === undefined) {
    throw new Error('useFhevm must be used within a FhevmProvider');
  }
  return context;
};
