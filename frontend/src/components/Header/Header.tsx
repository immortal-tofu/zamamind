import { Connect } from '../Connect';
import './Header.css';
import title from './title.png';

export function Header() {
  return (
    <header className="Header">
      <h1>
        <img src={title} alt="Zamamind" width="300" />
      </h1>
      <Connect />
    </header>
  );
}
