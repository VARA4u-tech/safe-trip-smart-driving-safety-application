import { ReactNode } from "react";
import vintageBg from "@/assets/vintage-map-bg.jpg";

interface VintageLayoutProps {
  children: ReactNode;
  className?: string;
  showFrame?: boolean;
}

const VintageLayout = ({
  children,
  className = "",
  showFrame = true,
}: VintageLayoutProps) => {
  return (
    <div
      className="min-h-screen w-full bg-cover bg-center transition-all duration-1000 ease-in-out paper-grain md:bg-fixed"
      style={{ backgroundImage: `url(${vintageBg})` }}
    >
      {/* Dynamic Overlay for Dark Mode / Night Vision */}
      <div className="min-h-screen w-full bg-background/60 dark:bg-black/80 backdrop-blur-[1px] md:backdrop-blur-[2px] flex flex-col transition-colors duration-1000">
        {showFrame ? (
          <main
            className={`flex-1 flex flex-col items-center justify-start px-4 py-8 md:px-12 md:py-16 ${className}`}
          >
            <div className="w-full max-w-4xl animate-fade-in">{children}</div>
          </main>
        ) : (
          <main className={`flex-1 ${className}`}>{children}</main>
        )}
      </div>
    </div>
  );
};

export default VintageLayout;
