import { type ElementType } from "react";

export type IconType =
  | "mistral"
  | "gemini"
  | "aws"
  | "azure"
  | "anthropic"
  | "groq"
  | "fireworks"
  | "deepseek"
  | "cohere"
  | "ollama"
  | "xai"
  | "agno"
  | "user"
  | "agent"
  | "open-ai"
  | "sheet"
  | "nextjs"
  | "shadcn"
  | "tailwind"
  | "agno-tag"
  | "refresh"
  | "edit"
  | "save"
  | "x"
  | "arrow-down"
  | "send"
  | "download"
  | "hammer"
  | "brain-circuit"
  | "check"
  | "chevron-down"
  | "chevron-up"
  | "plus-icon";

export interface IconProps {
  type: IconType;
  size?: "xs" | "sm" | "md" | "lg" | "dot" | "xxs" | "default";
  className?: string;
  color?: string;
  disabled?: boolean;
}

export type IconTypeMap = {
  [key in IconType]: ElementType;
};
