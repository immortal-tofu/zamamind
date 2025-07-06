import { useState, useCallback, useEffect } from 'react';

export const useWallet = () => {
  const [account, setAccount] = useState<`0x${string}` | undefined>(undefined);
  const [isConnected, setIsConnected] = useState(false);

  /**
   * Opens the MetaMask popup and returns the selected address.
   * @returns {Promise<string|null>}
   */
  const connect = useCallback(async () => {
    if (!window?.ethereum?.request) {
      console.warn('MetaMask not detected ⛔️');
      return null;
    }

    try {
      const [selected] = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const CHAIN_ID = '0xaa36a7'; // = 11155111 (Sepolia)
      const current = await window.ethereum.request<string>({
        method: 'eth_chainId',
      });

      if (current !== CHAIN_ID) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: CHAIN_ID }],
        });
      }

      setAccount(selected);
      setIsConnected(true);
      return selected;
    } catch (err) {
      console.error('MetaMask connection cancelled or failed', err);
      setIsConnected(false);
      return null;
    }
  }, []);

  // Update address when the user switches accounts in MetaMask
  useEffect(() => {
    if (!window?.ethereum) return;

    const handleAccountsChanged = (accounts: `0x${string}`[]) => {
      setAccount(accounts.length ? accounts[0] : undefined);
      setIsConnected(accounts.length > 0);
    };

    const refresh = async () => {
      const accounts = await window.ethereum?.request({
        method: 'eth_accounts',
      });
      handleAccountsChanged(accounts);
    };
    refresh();

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  return { isConnected, account, connect };
};
