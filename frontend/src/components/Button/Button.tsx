import React from 'react';
import './Button.css';

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ onClick, ...props }, ref) => {
  return <button className="Button" onClick={onClick} ref={ref} {...props} />;
});
Button.displayName = 'Button';
