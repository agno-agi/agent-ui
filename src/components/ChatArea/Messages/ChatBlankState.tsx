"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import Icon from "@/components/ui/icon";
import { IconType } from "@/components/ui/icon/types";
import React, { useState } from "react";

const EXTERNAL_LINKS = {
  documentation:
    "https://docs.agno.com/get-started/playground#agent-playground",
  playground: "https://app.agno.com/playground/chat",
  agno: "https://agno.com",
};

const TECH_ICONS = [
  {
    type: "nextjs" as IconType,
    position: "left-0",
    link: "https://nextjs.org",
    name: "Next.js",
    zIndex: 10,
  },
  {
    type: "shadcn" as IconType,
    position: "left-[15px]",
    link: "https://ui.shadcn.com",
    name: "shadcn/ui",
    zIndex: 20,
  },
  {
    type: "tailwind" as IconType,
    position: "left-[30px]",
    link: "https://tailwindcss.com",
    name: "Tailwind CSS",
    zIndex: 30,
  },
];

interface ActionButtonProps {
  href: string;
  variant?: "primary";
  text: string;
}

const ActionButton = ({ href, variant, text }: ActionButtonProps) => {
  const baseStyles =
    "px-4 py-2 text-sm transition-colors font-dmmono tracking-tight";
  const variantStyles = {
    primary: "border border-border hover:bg-neutral-800 rounded-xl",
  };

  return (
    <Link
      href={href}
      target="_blank"
      className={`${baseStyles} ${variant ? variantStyles[variant] : ""}`}
    >
      {text}
    </Link>
  );
};

export const ChatBlankState = () => {
  // Create state to track which icon is being hovered
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

  // Animation variants for the icon
  const iconVariants: Variants = {
    initial: { y: 0 },
    hover: {
      y: -8,
      transition: {
        type: "spring",
        stiffness: 150,
        damping: 10,
        mass: 0.5,
      },
    },
    exit: {
      y: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15,
        mass: 0.6,
      },
    },
  };

  // Animation variants for the tooltip
  const tooltipVariants: Variants = {
    hidden: {
      opacity: 0,
      transition: {
        duration: 0.15,
        ease: "easeInOut",
      },
    },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.15,
        ease: "easeInOut",
      },
    },
  };

  return (
    <section
      className="flex flex-col items-center text-center font-geist"
      aria-label="Welcome message"
    >
      <div className="max-w-3xl flex flex-col gap-y-8">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-3xl font-[600] tracking-tight"
        >
          <div className="flex items-center justify-center whitespace-nowrap gap-x-2 font-medium">
            <span className="flex items-center font-[600]">
              This is an open-source
            </span>
            <span className="inline-flex items-center translate-y-[10px] scale-125 hover:rotate-6 transition-transform duration-200">
              <Link
                href={EXTERNAL_LINKS.agno}
                target="_blank"
                rel="noopener"
                className="cursor-pointer"
              >
                <Icon type="agno-tag" size="default" />
              </Link>
            </span>
            <span className="flex items-center font-[600]">
              Agent UI, built with
            </span>
            <span className="inline-flex items-center translate-y-[5px] scale-125">
              <div className="relative w-[90px] h-[40px] ml-2">
                {TECH_ICONS.map((icon) => (
                  <motion.div
                    key={icon.type}
                    className={`absolute ${icon.position} top-0`}
                    style={{ zIndex: icon.zIndex }}
                    variants={iconVariants}
                    initial="initial"
                    whileHover="hover"
                    animate={hoveredIcon === icon.type ? "hover" : "exit"}
                    onHoverStart={() => setHoveredIcon(icon.type)}
                    onHoverEnd={() => setHoveredIcon(null)}
                  >
                    <Link
                      href={icon.link}
                      target="_blank"
                      rel="noopener"
                      className="block cursor-pointer relative"
                    >
                      <div>
                        <Icon type={icon.type} size="default" />
                      </div>
                      <motion.div
                        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-neutral-800 text-primary text-xs rounded whitespace-nowrap pointer-events-none"
                        variants={tooltipVariants}
                        initial="hidden"
                        animate={
                          hoveredIcon === icon.type ? "visible" : "hidden"
                        }
                      >
                        {icon.name}
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </span>
          </div>
          <p>You can learn more on the Agent Playground.</p>
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex gap-4 justify-center"
        >
          <ActionButton
            href={EXTERNAL_LINKS.documentation}
            variant="primary"
            text="GO TO OUR DOCS"
          />
          <ActionButton
            href={EXTERNAL_LINKS.playground}
            text="VISIT AGENT PLAYGROUND"
          />
        </motion.div>
      </div>
    </section>
  );
};
