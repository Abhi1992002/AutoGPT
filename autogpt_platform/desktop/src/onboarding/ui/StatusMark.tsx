import { Alert02Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import type { LayerStatus, ServiceState } from "../core/backend";
import { AnimatePresence, motion } from "framer-motion";
import { Spinner } from "../../design-system/components/spinner";
import { useIconSwap } from "../core/motion";
import { Icon } from "./Icon";

export type Mark = "pending" | "active" | "done" | "error";

/** A 16px status glyph shared by every list in the flow: hollow ring, spinner, filled check or alert */
export function StatusMark({ mark, label }: { mark: Mark; label?: string }) {
  const swap = useIconSwap();
  return (
    <span className="ob-mark" data-mark={mark} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={mark} className="ob-mark__glyph" {...swap}>
          {mark === "active" ? (
            <Spinner size="sm" label="" />
          ) : mark === "done" ? (
            <Icon icon={Tick02Icon} size={10} strokeWidth={3} />
          ) : mark === "error" ? (
            <Icon icon={Alert02Icon} size={10} strokeWidth={2.5} />
          ) : null}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export const layerMark = (status: LayerStatus): Mark => (status === "done" ? "done" : status === "waiting" ? "pending" : "active");
export const serviceMark = (state: ServiceState): Mark =>
  state === "running" ? "done" : state === "starting" ? "active" : state === "error" ? "error" : "pending";
