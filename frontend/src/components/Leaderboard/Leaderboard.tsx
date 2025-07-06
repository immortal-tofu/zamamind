import { Button } from '../Button';
import useGame from '../../hooks/useGame';

import './Leaderboard.css';
import { useEffect, useState } from 'react';

export function Leaderboard() {
  const { getTop, getEnsName, getScore } = useGame();
  const [leaderboard, setLeaderboard] = useState<
    { label: string; score: bigint }[]
  >([]);
  useEffect(() => {
    onRefresh();
  }, []);

  const onRefresh = async () => {
    const l = await getTop();
    // console.log(l);
    const cleanListPromise = l!.map(async (address) => {
      if (Number(address) !== 0) {
        let label: string = address;
        const ens = await getEnsName(address);
        if (ens) {
          label = ens;
        }

        const score = await getScore(address);
        return { label, score };
      }
      return { label: 'None', score: 0n };
    });

    const cleanList = await Promise.all(cleanListPromise);
    setLeaderboard(cleanList);
  };

  return (
    <div className="Leaderboard">
      <ol>
        {leaderboard.map((player, i) => (
          <li key={`${player.label}-${i}`} title={player.label}>
            <div className="Leaderboard__line">
              <span className="Leaderboard__address">{player.label}</span>
              <span className="Leaderboard__score">{player.score}</span>
            </div>
          </li>
        ))}
      </ol>
      <Button onClick={onRefresh}>Refresh</Button>
    </div>
  );
}
