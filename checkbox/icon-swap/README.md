# Radix `CheckIcon` vs Hugeicons `Tick02Icon` (through `Icon`) in the checked atoms/Checkbox

`tick-render.tsx` renders both icons as the atom does (`className="h-4 w-4"`) to static SVG (`svgs.json`);
`tick-shot.mts` draws each inside the checked checkbox box (16x16, 1px #171717 border and fill, 2px radius,
#FAFAFA tick) and screenshots it at 1x and 2x.

| scale | differing pixels |
| --- | --- |
| 1x | 46 of 1,024 |
| 2x | 135 of 4,096 |

`compare@{1,2}x.png`: Radix (left), Hugeicons (middle), differing pixels in red (right), upscaled 8x.
Radix draws a filled 15x15 path; Hugeicons strokes `M5 14L8.5 17.5L19 6.5` in a 24x24 box with round caps:
the tick is longer, lower-left anchored and thinner. Swapping it is a visual change, out of scope for a 0 px migration.
