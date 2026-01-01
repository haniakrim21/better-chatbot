"use client";

import Particles from "./ui/particles";
import LightRays from "./ui/light-rays";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function BackgroundAnimated() {
  const { theme } = useTheme();
  const [color, setColor] = useState("#ffffff");

  useEffect(() => {
    setColor(theme === "dark" ? "#ffffff" : "#000000");
  }, [theme]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none opacity-100">
      <LightRays
        className="absolute inset-0"
        raysOrigin="top-center"
        raysSpeed={2.0}
        raysColor={color}
      />
      <Particles
        className="absolute inset-0"
        particleCount={150}
        particleSpread={10}
        speed={0.8}
        particleColors={[color]}
        moveParticlesOnHover={false}
        particleHoverFactor={1}
        alphaParticles={false}
        particleBaseSize={100}
        sizeRandomness={1}
        cameraDistance={20}
        disableRotation={false}
      />
    </div>
  );
}
