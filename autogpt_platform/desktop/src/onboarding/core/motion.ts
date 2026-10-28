import { useReducedMotion, type Transition, type Variants } from "framer-motion";

/*
 * Motion shared by the variants. Springs never bounce; enters and exits follow better-ui:
 * enter 300ms with 12px rise and 4px blur, staggered 100ms; exit 150ms with -12px and 4px blur.
 * Under reduced motion everything falls back to an opacity cross-fade.
 */

export const spring: Transition = { type: "spring", duration: 0.5, bounce: 0 };
export const springSlow: Transition = { type: "spring", duration: 0.8, bounce: 0 };
export const springFast: Transition = { type: "spring", duration: 0.3, bounce: 0 };

const easeOut = [0.2, 0, 0, 1] as const;

export function useEnterExit(distance = 12): Variants {
  const reduce = useReducedMotion();
  if (reduce) {
    return {
      hidden: { opacity: 0 },
      show: { opacity: 1, transition: { duration: 0.2 } },
      exit: { opacity: 0, transition: { duration: 0.15 } },
    };
  }
  return {
    hidden: { opacity: 0, y: distance, filter: "blur(4px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.3, ease: easeOut } },
    exit: { opacity: 0, y: -distance, filter: "blur(4px)", transition: { duration: 0.15, ease: "easeOut" } },
  };
}

/** Parent variants that stagger their children 100ms apart */
export const stagger = (delay = 0.1, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: delay, delayChildren } },
  exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
});

/** Icon swap: scale 0.25→1, opacity, blur 4px→0 */
export function useIconSwap() {
  const reduce = useReducedMotion();
  return reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }
    : {
        initial: { opacity: 0, scale: 0.25, filter: "blur(4px)" },
        animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
        exit: { opacity: 0, scale: 0.25, filter: "blur(4px)" },
        transition: { type: "spring", duration: 0.3, bounce: 0 } as Transition,
      };
}
