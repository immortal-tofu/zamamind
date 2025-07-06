import type { ExternalProvider } from '@ethersproject/providers'; // facultatif

/** Minimal EIP-1193 provider typing (MetaMask, Coinbase Wallet, etc.) */
export interface EthereumProvider extends ExternalProvider {
  /** Signale la présence de MetaMask */
  isMetaMask?: boolean;

  /** EIP-1193 request */
  request<T = any>(args: {
    method: string;
    params?: unknown[] | object;
  }): Promise<T>;

  /** Souscription / désabonnement d’événements */
  on(event: string, listener: (...args: any[]) => void): void;
  removeListener(event: string, listener: (...args: any[]) => void): void;

  /** Chaîne courante (hex string, ex : \"0x1\") */
  chainId?: string;
}

/** Étend l’objet global Window pour inclure ethereum */
declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export {};
