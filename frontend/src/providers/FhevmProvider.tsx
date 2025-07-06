import { useEffect, useState, type ReactNode } from 'react';
import {
  initSDK,
  createInstance,
  SepoliaConfig,
} from '@zama-fhe/relayer-sdk/bundle';
import type { EIP712, FhevmInstance } from '@zama-fhe/relayer-sdk/bundle';
import { GAME_ADDRESS } from '../constants';

import { FhevmContext } from '../hooks/useFhevm';
import { useWallet } from '../hooks/useWallet';
import { getAddress } from 'viem';

export function FhevmProvider({ children }: { children: ReactNode }) {
  const { account } = useWallet();
  const [instance, setInstance] = useState<FhevmInstance | undefined>(
    undefined,
  );
  const [eip712, setEip712] = useState<EIP712>();
  const [startTimestamp, setStartTimestamp] = useState<number | undefined>(
    undefined,
  );
  const [keypair, setKeypair] = useState<
    { publicKey: string; privateKey: string } | undefined
  >(undefined);

  const [signature, setSignature] = useState<string | undefined>(undefined);

  const durationDays = 365;

  // Handle initial FHEVM library initialization
  useEffect(() => {
    initSDK()
      .then(async () => {
        console.log('SDK loaded');
        const i = await createInstance({
          ...SepoliaConfig,
          network: window.ethereum,
        });
        if (!keypair || !eip712) {
          setSignature(undefined);
          const timestamp = Date.now();
          setStartTimestamp(timestamp);
          const kp = i.generateKeypair();
          setKeypair(kp);
          const eip = i.createEIP712(
            kp.publicKey,
            [GAME_ADDRESS],
            timestamp,
            durationDays,
          );
          setEip712(eip);
        }
        console.log(i);
        setInstance(i);
      })
      .catch((e) => {
        console.error('Failed to initialize FHEVM:', e);
      });
  }, []); // Only run once on mount

  const decrypt = async (
    handle: string,
    requestSignature: (eip712: any) => Promise<string>,
  ) => {
    if (!instance) return;
    let s = signature;
    let timestamp = startTimestamp;
    let kp = keypair;
    if (!s) {
      timestamp = Math.floor(Date.now() / 1000) - 1000;
      setStartTimestamp(timestamp);
      kp = instance.generateKeypair();
      setKeypair(kp);
      const eip = instance.createEIP712(
        kp.publicKey,
        [GAME_ADDRESS],
        timestamp,
        durationDays,
      );
      setEip712(eip);
      const signature = await requestSignature(eip);
      setSignature(signature);
      s = signature;
    }
    const r = await instance.userDecrypt(
      [{ handle, contractAddress: GAME_ADDRESS }],
      kp!.privateKey,
      kp!.publicKey,
      s,
      [GAME_ADDRESS],
      getAddress(account!),
      timestamp!,
      durationDays,
    );
    return r[handle] as bigint;
  };

  if (!instance) return <div>Initializing Fhevm</div>;

  return (
    <>
      <FhevmContext.Provider
        value={{
          instance,
          setSignature,
          eip712: eip712!,
          decrypt,
        }}
      >
        {children}
      </FhevmContext.Provider>
    </>
  );
}
