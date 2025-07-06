import { useCallback, useState } from 'react';
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type PublicClient,
} from 'viem';
import { sepolia } from 'viem/chains';
import CompiledGame from '../abi/Zamamind.json';
import { useFhevm } from './useFhevm';
import { toHexString } from '../utils';
import { useWallet } from './useWallet';
import { GAME_ADDRESS } from '../constants';

const GAME_ABI = CompiledGame.abi;

const decodeResults = (decryptedResults: bigint) => {
  const results = Number(decryptedResults.toString());
  const correct = [];
  for (let j = 0; j < 4; j += 1) {
    const block = (results >> (2 * j)) & 0b11; // isole les 2 bits du bloc i
    correct[j] = block;
  }
  return correct.slice().reverse();
};

/**
 * React hook that exposes `start` and `play` helpers connected to the Sepolia contract.
 */
export default function useGame() {
  const { account, isConnected } = useWallet();
  const { instance, decrypt } = useFhevm();
  const [score, setScore] = useState(0n);

  const publicClient: PublicClient = createPublicClient({
    chain: sepolia,
    transport: http('https://0xrpc.io/sep'),
  });

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: custom(window.ethereum!),
  });

  const requestSignature = async (eip712: any) => {
    if (!account) return '';
    const signature = await walletClient.signTypedData({
      account,
      domain: eip712.domain,
      types: eip712.types,
      primaryType: eip712.primaryType,
      message: eip712.message,
    });
    return signature;
  };

  const refreshScore = async (acc = account) => {
    if (!walletClient || !acc) return;
    const data = await getScore(acc);
    setScore(data);
  };

  const getScore = async (acc: `0x${string}`): Promise<bigint> => {
    const data = await publicClient.readContract({
      address: GAME_ADDRESS,
      abi: GAME_ABI,
      functionName: 'getScore',
      args: [acc],
      account,
    });
    return data as bigint;
  };

  const getEnsName = async (address: `0x${string}`) => {
    return await publicClient.getEnsName({
      address,
    });
  };

  const getTop = useCallback(async () => {
    if (!walletClient) return;
    const data = await publicClient.readContract({
      address: GAME_ADDRESS,
      abi: GAME_ABI,
      functionName: 'getTop',
      account,
    });
    console.log(data, typeof data);
    return data as `0x${string}`[];
  }, [account, isConnected, walletClient]);

  const getGame = useCallback(async () => {
    if (!walletClient) return;
    const data = await publicClient.readContract({
      address: GAME_ADDRESS,
      abi: GAME_ABI,
      functionName: 'getGame',
      account,
    });
    console.log(data, typeof data);
    return data as string;
  }, [account, isConnected, walletClient]);

  const gameResults = useCallback(async () => {
    if (!walletClient) return;
    const data = await publicClient.readContract({
      address: GAME_ADDRESS,
      abi: GAME_ABI,
      functionName: 'gameResults',
      args: [account],
      account,
    });
    // console.log(data);
    const decryption = await decrypt(data as string, requestSignature);
    return decodeResults(decryption!);
  }, [account, isConnected, walletClient]);

  const startGame = useCallback(async () => {
    if (!walletClient) return;
    const hash = await walletClient.writeContract({
      address: GAME_ADDRESS,
      abi: GAME_ABI,
      functionName: 'start',
      account: account || null,
      chain: sepolia,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return receipt;
  }, [account, isConnected, walletClient]);

  /**
   * Call play(uint256) on the contract.
   * @param guess Number to send to the play function (example argument).
   */
  const claim = useCallback(
    async (combinaison: number[]) => {
      if (!walletClient) return;
      const cleartext = combinaison.reduce((bytes, v) => {
        return bytes + v.toString(2).padStart(3, '0');
      }, '0b');
      const input = instance.createEncryptedInput(GAME_ADDRESS, account!);
      const { handles, inputProof } = await input
        .add16(Number(cleartext))
        .encrypt();

      const hash = await walletClient.writeContract({
        address: GAME_ADDRESS,
        abi: GAME_ABI,
        functionName: 'claim',
        args: [toHexString(handles[0], true), toHexString(inputProof, true)],
        account: account || null,
        chain: sepolia,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      return receipt;
    },
    [account, isConnected, walletClient],
  );

  const play = useCallback(
    async (combinaison: number[]) => {
      if (!walletClient) return;
      const cleartext = combinaison.reduce((bytes, v) => {
        return bytes + v.toString(2).padStart(3, '0');
      }, '0b');
      const input = instance.createEncryptedInput(GAME_ADDRESS, account!);
      const { handles, inputProof } = await input
        .add16(Number(cleartext))
        .encrypt();

      const hash = await walletClient.writeContract({
        address: GAME_ADDRESS,
        abi: GAME_ABI,
        functionName: 'play',
        args: [toHexString(handles[0], true), toHexString(inputProof, true)],
        account: account || null,
        chain: sepolia,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      return receipt;
    },
    [account, isConnected, walletClient],
  );

  return {
    getEnsName,
    walletClient,
    getScore,
    gameResults,
    getTop,
    getGame,
    refreshScore,
    score,
    startGame,
    claim,
    play,
  };
}
