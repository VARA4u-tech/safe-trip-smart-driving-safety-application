import { ReactNode } from "react";

interface VintageFrameProps {
  children: ReactNode;
  className?: string;
}

const VintageFrame = ({ children, className = "" }: VintageFrameProps) => {
  return (
    <div className={`vintage-frame p-6 md:p-8 w-full max-w-lg mx-auto ${className}`}>
      {children}
    </div>
  );
};

export default VintageFrame;
