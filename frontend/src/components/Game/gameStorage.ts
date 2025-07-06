export type Guess = {
  guess: number[];
  validation: number[];
};

export type GlobalStorage = {
  [gameHandle: string]: GuessStorage;
};

export type GuessStorage = {
  guesses: Guess[];
};

const STORAGE_NAME_GUESS = 'zamamind_guess';

export const getGuesses = (gameHandle: string) => {
  const storage = readGameStorage(gameHandle);
  return storage.guesses;
};

export const saveGuess = (
  gameHandle: string,
  guess: number[],
  validation: number[],
) => {
  const storage = readGameStorage(gameHandle);
  storage.guesses.push({ guess, validation });
  writeGameStorage(gameHandle, storage);
};

const readGameStorage = (gameHandle: string): GuessStorage => {
  const json = readGlobalStorage();
  return json[gameHandle] || { guesses: [] };
};

const readGlobalStorage = () => {
  const raw = localStorage.getItem(STORAGE_NAME_GUESS);
  let json: GlobalStorage = {};
  if (raw) {
    json = JSON.parse(raw);
  }
  return json;
};

const writeGameStorage = (gameHandle: string, obj: GuessStorage): void => {
  const json = readGlobalStorage();
  json[gameHandle] = obj;
  localStorage.setItem(STORAGE_NAME_GUESS, JSON.stringify(json));
};
