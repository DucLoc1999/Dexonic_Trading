"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";

const logos = [
  { id: "ai16z", src: "/assets/logos-ext/ai16z.svg", alt: "AI16Z" },
  { id: "elizaos", src: "/assets/logos-ext/elizaos.svg", alt: "ElizaOS" },
  { id: "n8n", src: "/assets/logos-ext/n8n.svg", alt: "n8n" },
  { id: "defillama", src: "/assets/logos-ext/defillama.svg", alt: "DefiLlama" },
  { id: "coingecko", src: "/assets/logos-ext/coingecko.svg", alt: "CoinGecko" },
  {
    id: "geckoterminal",
    src: "/assets/logos-ext/geckoterminal.svg",
    alt: "GeckoTerminal",
  },
  { id: "injective", src: "/assets/logos-ext/injective.svg", alt: "Injective" },
  { id: "helix", src: "/assets/logos-ext/helix.svg", alt: "Helix" },
  { id: "hydro", src: "/assets/logos-ext/hydro.svg", alt: "Hydro" },
  { id: "dojoswap", src: "/assets/logos-ext/dojoswap.svg", alt: "DojoSwap" },
  { id: "discord", src: "/assets/logos-ext/discord.svg", alt: "Discord" },
  { id: "telegram", src: "/assets/logos-ext/telegram.svg", alt: "Telegram" },
  { id: "x_dark", src: "/assets/logos-ext/x_dark.svg", alt: "X" },
];

export function LogoCarousel() {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const scrollContainer = containerRef.current;
    const totalWidth = scrollContainer.scrollWidth / 2;
    let animationFrameId: number;

    const scroll = () => {
      if (!isHovered) {
        scrollPositionRef.current += 1;
        if (scrollPositionRef.current >= totalWidth) {
          scrollPositionRef.current = 0;
        }
        scrollContainer.style.transform = `translateX(-${scrollPositionRef.current}px)`;
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    scroll();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isHovered]);

  return (
    <div className="w-full overflow-hidden bg-background/80 backdrop-blur-sm border-y border-white/[0.08] py-12">
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          ref={containerRef}
          className="flex space-x-12 whitespace-nowrap"
          style={{
            willChange: "transform",
          }}
        >
          {/* First set of logos */}
          {logos.map((logo) => (
            <div
              key={`first-${logo.id}`}
              className="inline-block w-32 h-16 flex-shrink-0"
            >
              <Image
                src={logo.src}
                alt={logo.alt}
                className="w-full h-full object-contain filter brightness-75 hover:brightness-100 transition-all duration-300"
                title={logo.alt}
                width={1024}
                height={1024}
              />
            </div>
          ))}
          {/* Duplicate set for seamless loop */}
          {logos.map((logo) => (
            <div
              key={`second-${logo.id}`}
              className="inline-block w-32 h-16 flex-shrink-0"
            >
              <Image
                src={logo.src}
                alt={logo.alt}
                className="w-full h-full object-contain filter brightness-75 hover:brightness-100 transition-all duration-300"
                title={logo.alt}
                width={1024}
                height={1024}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
