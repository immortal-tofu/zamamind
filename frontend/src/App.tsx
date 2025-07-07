import { Game } from './components/Game';
import { Header } from './components/Header';
import { FhevmProvider } from './providers/FhevmProvider';
import { ConnectWrapper } from './components/Connect';

import './App.css';
import { Footer } from './components/Footer';

function App() {
  if (!window.ethereum)
    return (
      <>
        <div className="App">
          You need to use a browser with an Ethereum wallet.
        </div>
      </>
    );

  return (
    <>
      <ConnectWrapper>
        <FhevmProvider>
          <Header />
          <div className="App">
            <Game />
          </div>
        </FhevmProvider>
      </ConnectWrapper>
      <Footer />
    </>
  );
}

export default App;
