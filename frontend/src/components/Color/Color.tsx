import classNames from 'classnames';
import './Color.css';

export function Color({
  color,
  onClick,
  validation,
}: {
  color: number;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  validation: number;
}) {
  return (
    <div
      className={classNames(
        'Color',
        {
          Color__red: color == 0,
          Color__blue: color == 1,
          Color__green: color == 2,
          Color__yellow: color == 3,
          Color__orange: color == 4,
          Color__pink: color == 5,
          Color__white: color == 6,
          Color__black: color == 7,
        },
        {
          Color__invalid: validation == 0,
          Color__valid: validation == 1,
          Color__misposition: validation == 2,
        },
      )}
      onClick={onClick}
    ></div>
  );
}
