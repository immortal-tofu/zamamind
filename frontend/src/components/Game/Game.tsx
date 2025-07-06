import { Line } from '../Line';
import { Button } from '../Button';
import useGame from '../../hooks/useGame';

import './Game.css';
import { useEffect, useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { saveGuess, getGuesses, type Guess } from './gameStorage';
import { Leaderboard } from '../Leaderboard';

export function Game() {
  const { getGame, play, claim, refreshScore, gameResults, startGame } =
    useGame();
  const { isConnected } = useWallet();
  const [loaded, setLoaded] = useState(false);
  const [gameHandle, setGameHandle] = useState<string>();
  const [guess, setGuess] = useState<number[]>([0, 0, 0, 0]);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [playing, setPlaying] = useState<string | false>(false);
  const [correct, setCorrect] = useState<number[] | false>(false);
  const [refreshable, setRefreshable] = useState(false);

  useEffect(() => {
    if (isConnected) {
      getGame().then((game) => {
        if (game && Number(game) !== 0) {
          setGameHandle(game);
          const guesses = getGuesses(game);
          setGuesses(guesses);
          if (guesses.length > 0) {
            setGuess(guesses[guesses.length - 1].guess);
            guesses.forEach((g) => {
              if (g.validation.every((v) => v == 1)) {
                setGuess(g.guess);
                setCorrect(g.guess);
              }
            });
          }
        }
        setLoaded(true);
      });
    }
  }, [isConnected]);

  const onStart = async () => {
    setPlaying('transaction');
    await startGame();
    const gh = await getGame();
    setGameHandle(gh);
    setPlaying(false);
  };

  const retrieveResults = async (counter: number = 0) => {
    if (counter >= 10) return;
    try {
      const validation = await gameResults();
      if (!validation) return;
      if (validation.every((v) => v == 1)) {
        setCorrect(guess);
      }
      saveGuess(gameHandle!, guess, validation);
      setGuesses([...guesses, { guess, validation }]);
    } catch (e) {
      console.log(e);
      await retrieveResults(counter + 1);
    }
  };

  const onPlay = async () => {
    if (!gameHandle) return;
    try {
      setPlaying('input');
      setTimeout(async () => {
        try {
          setPlaying('transaction');
          await play(guess);
          setPlaying('results');
          setTimeout(async () => {
            await retrieveResults();
            setPlaying(false);
          }, 5000);
        } catch (e) {
          console.log(e);
          setPlaying(false);
        }
      }, 0);
    } catch (e) {
      setPlaying(false);
      console.log(e);
    }
  };

  const onClaim = async () => {
    if (!gameHandle) return;
    try {
      setPlaying('input');
      setTimeout(async () => {
        try {
          setPlaying('transaction');
          await claim(guess);
          setRefreshable(true);
          setTimeout(async () => {
            setPlaying('refreshscore');
            await refreshScore();
            setPlaying(false);
          }, 10000);
        } catch (e) {
          console.log(e);
          setPlaying(false);
        }
      }, 0);
    } catch (e) {
      setPlaying(false);
      console.log(e);
    }
  };

  const onLineChange = (index: number, value: number) => {
    if (playing || correct) return null;
    const newGuess = [...guess];
    newGuess[index] = value;
    setGuess(newGuess);
  };

  const onRefresh = async () => {
    const game = await getGame();
    if (game && Number(game) !== 0) {
      setGameHandle(game);
    } else {
      setGameHandle(undefined);
    }
    await refreshScore();
  };

  const displayStatus = (val: string | false) => {
    switch (val) {
      case 'input':
        return 'Encrypting input...';
      case 'transaction':
        return 'Sending transaction...';
      case 'results':
        return 'Decrypting your validation...';
      case 'refreshscore':
        return 'Refreshing your score...';
      default:
        return null;
    }
  };

  if (!loaded) {
    return <div>Loading game</div>;
  }

  return (
    <div className="Game">
      <div className="Game__container">
        <div className="Game__play">
          {!gameHandle && (
            <>
              <p>Welcome to Zamamind! You want to start a game?</p>
              <Button onClick={onStart}>Start game</Button>
              {playing && (
                <p className="Game__status">{displayStatus(playing)}</p>
              )}
            </>
          )}
          {gameHandle && (
            <>
              <Line colors={guess} onChange={onLineChange} />
              {!correct && (
                <>
                  <Button onClick={onPlay} disabled={playing !== false}>
                    Play!
                  </Button>
                  {playing && (
                    <p className="Game__status">{displayStatus(playing)}</p>
                  )}
                </>
              )}
              {correct && (
                <>
                  {!refreshable && (
                    <Button onClick={onClaim} disabled={playing !== false}>
                      Get your points!
                    </Button>
                  )}
                  {refreshable && (
                    <Button onClick={onRefresh} disabled={playing !== false}>
                      Refresh
                    </Button>
                  )}
                  {playing && (
                    <p className="Game__status">{displayStatus(playing)}</p>
                  )}
                </>
              )}
            </>
          )}
        </div>
        {gameHandle && (
          <>
            <h2>History</h2>
            {guesses
              .slice()
              .reverse()
              .map((g, i) => (
                <Line colors={g.guess} validation={g.validation} key={i} />
              ))}
          </>
        )}
      </div>
      <div className="Game__leaderboard">
        <h2>Leaderboard</h2>
        <Leaderboard />
      </div>
    </div>
  );
}
