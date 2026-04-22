import claroLogo from "../assets/logo/claro.svg";
import type { CSSProperties } from "react";

type LogoProps = {
  size?: number | string;
  opacity?: number;
  className?: string;
  alt?: string;
  style?: CSSProperties;
};

export default function Logo({ size = 32, opacity = 1, className = "", alt = "Claro", style = {} }: LogoProps) {
  const height = typeof size === "number" ? `${size}px` : size;

  return (
    <img
      src={claroLogo}
      alt={alt}
      className={className}
      style={{
        height,
        width: "auto",
        maxWidth: "100%",
        objectFit: "contain",
        opacity,
        display: "block",
        ...style,
      }}
    />
  );
}
