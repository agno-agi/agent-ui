import * as React from "react";

import { cn } from "@/utils/cn";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
};

const MIN_HEIGHT = 40;
const MAX_HEIGHT = 96;

const ChatTextArea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, value, onChange, ...props }, forwardedRef) => {
    const [showScroll, setShowScroll] = React.useState(false);
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      textarea.style.height = `${MIN_HEIGHT}px`;
      const { scrollHeight } = textarea;
      const newHeight = Math.min(
        Math.max(scrollHeight, MIN_HEIGHT),
        MAX_HEIGHT,
      );
      textarea.style.height = `${newHeight}px`;
      setShowScroll(scrollHeight > MAX_HEIGHT);
    }, []);

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const cursorPosition = e.target.selectionStart;
        onChange?.(e);
        requestAnimationFrame(() => {
          adjustHeight();
          if (textareaRef.current) {
            textareaRef.current.setSelectionRange(
              cursorPosition,
              cursorPosition,
            );
          }
        });
      },
      [onChange, adjustHeight],
    );

    const handleRef = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        const ref = forwardedRef as
          | React.MutableRefObject<HTMLTextAreaElement | null>
          | ((instance: HTMLTextAreaElement | null) => void)
          | null;

        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }

        textareaRef.current = node;
      },
      [forwardedRef],
    );

    React.useEffect(() => {
      if (textareaRef.current) {
        adjustHeight();
      }
    }, [value, adjustHeight]);

    return (
      <textarea
        className={cn(
          "w-full resize-none bg-transparent shadow-sm",
          "rounded-xl border border-border",
          "py-2 px-3 ",
          "text-sm leading-5",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          showScroll ? "overflow-y-auto" : "overflow-hidden",
          className,
        )}
        style={{
          minHeight: `${MIN_HEIGHT}px`,
          height: `${MIN_HEIGHT}px`,
          maxHeight: `${MAX_HEIGHT}px`,
        }}
        ref={handleRef}
        value={value}
        onChange={handleChange}
        {...props}
      />
    );
  },
);

ChatTextArea.displayName = "ChatTextArea";

export type { TextareaProps };
export { ChatTextArea };
