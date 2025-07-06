import { Game } from './components/Game';
import { Header } from './components/Header';
import { FhevmProvider } from './providers/FhevmProvider';
import { ConnectWrapper } from './components/Connect';

import './App.css';

function App() {
  return (
    <>
      <FhevmProvider>
        <>
          <Header />
          <div className="App">
            <ConnectWrapper>
              <Game />
            </ConnectWrapper>
          </div>
        </>
      </FhevmProvider>
    </>
  );
}

export default App;
