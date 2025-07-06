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
      <footer>
        <p>
          <a href="https://github.com/immortal-tofu/zamamind/">
            Want to see the source code?
          </a>
        </p>
        <p>
          <img src="./zama.png" alt="Zama" width="16" /> Powered by{' '}
          <a href="https://docs.zama.ai/protocol">the Zama Protocol</a>.
        </p>
      </footer>
    </>
  );
}

export default App;
