import { useEffect, type ReactNode } from 'react';
import { Button } from '../Button';

import { useWallet } from '../../hooks/useWallet';
import blockies from 'ethereum-blockies';
import useGame from '../../hooks/useGame';

import './Connect.css';

export const Connect = () => {
  const { connect, isConnected, account } = useWallet();

  const { refreshScore, score } = useGame();

  useEffect(() => {
    if (account) {
      refreshScore(account);
    }
  }, [account]);

  const handleConnect = async () => {
    try {
      connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const generateBlockie = (address: string) => {
    return blockies.create({ seed: address }).toDataURL();
  };

  return (
    <>
      {!isConnected ? (
        <Button onClick={handleConnect}>Connect</Button>
      ) : (
        <>
          <div className="Connect__box Connect_score">
            <strong>{score}</strong>&nbsp;points
          </div>

          <div className="Connect__box">
            <img
              src={account ? generateBlockie(account) : ''}
              alt="Address Blockie"
              className="w-5 h-5"
            />
            {account && formatAddress(account)}
          </div>
        </>
      )}
    </>
  );
};

export const ConnectWrapper = ({ children }: { children: ReactNode }) => {
  const { isConnected } = useWallet();
  if (isConnected) {
    return children;
  } else {
    return <div>You must be connected</div>;
  }
};
