"use client"

import { motion, type MotionStyle } from "motion/react"

interface BorderBeamProps {
  size?: number
  duration?: number
  delay?: number
  colorFrom?: string
  colorTo?: string
  reverse?: boolean
  initialOffset?: number
  borderWidth?: number
  /** border-radius of the parent container in px — must match the container */
  radius?: number
}

export function BorderBeam({
  size = 180,
  duration = 6,
  delay = 0,
  colorFrom = "#22d3ee",
  colorTo = "#a855f7",
  reverse = false,
  initialOffset = 0,
  borderWidth = 1.5,
  radius = 20,
}: BorderBeamProps) {
  return (
    <div
      style={{
        /* fill the parent exactly */
        position: "absolute",
        inset: 0,
        borderRadius: "inherit",
        pointerEvents: "none",

        /* transparent border occupies the border area */
        border: `${borderWidth}px solid transparent`,

        /*
         * Mask trick: show ONLY the border area.
         *
         * Two identical white-fill gradients:
         *   layer 1 (top)    — clipped to padding-box  = inner region
         *   layer 2 (bottom) — clipped to border-box   = full region including border
         *
         * WebKit: destination-out  →  bottom_layer WHERE NOT top_layer
         *                          =  border-box  MINUS  padding-box  = border strip ✓
         * Standard: exclude (xor) →  (A ∪ B) − (A ∩ B)
         *                          =  border-box  MINUS  padding-box  = border strip ✓
         */
        WebkitMaskImage:
          "linear-gradient(#fff 0 0), linear-gradient(#fff 0 0)",
        WebkitMaskClip: "padding-box, border-box" as string,
        WebkitMaskComposite: "destination-out" as string,
        maskImage:
          "linear-gradient(#fff 0 0), linear-gradient(#fff 0 0)",
        // @ts-expect-error — maskClip is valid CSS but missing from older @types
        maskClip: "padding-box, border-box",
        maskComposite: "exclude" as string,
      } as React.CSSProperties}
    >
      <motion.div
        style={
          {
            position: "absolute",
            /* square element — the mask will clip it to the border strip */
            width: size,
            height: size,
            /*
             * Gradient: transparent tail → colorTo → colorFrom (bright head)
             * Direction "to left" matches clockwise travel on the top edge.
             */
            background: `linear-gradient(to left, transparent, ${colorTo}, ${colorFrom})`,
            /* Travel along the rectangle border */
            offsetPath: `inset(0 round ${radius}px)`,
            /* Center the element's origin on the path */
            offsetAnchor: "50% 50%",
          } as MotionStyle
        }
        initial={{ offsetDistance: `${initialOffset}%` }}
        animate={{
          offsetDistance: reverse
            ? [`${100 - initialOffset}%`, `${-initialOffset}%`]
            : [`${initialOffset}%`, `${100 + initialOffset}%`],
        }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration,
          delay: -delay,
        }}
      />
    </div>
  )
}
