import './Line.css';
import { Color } from '../Color';

export type LineProps = {
  colors: number[];
  onChange?: (index: number, value: number) => void;
  validation?: number[];
};

export function Line({ onChange, colors, validation = [] }: LineProps) {
  const changeColor = (index: number) => {
    if (!onChange) return;
    const value = colors[index] + 1 > 7 ? 0 : colors[index] + 1;
    onChange(index, value);
  };
  return (
    <>
      <div className="Line">
        {colors.map((c, i) => (
          <Color
            color={c}
            onClick={() => changeColor(i)}
            validation={validation[i]}
            key={i}
          />
        ))}
      </div>
    </>
  );
}
