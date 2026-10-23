| # | old class string (dev) | new class string (head) | computed value at 1280px, parent leading-[30px], as written (where it applies) | result |
| --- | --- | --- | --- | --- |
| 1 | `!text-zinc-400` | `!text-foreground-subtle` | color: rgb(173, 173, 179) | identical |
| 2 | `[&_blockquote]:border-zinc-300` | `[&_blockquote]:border-border-strong` | `[&_blockquote]:border-border-strong` border-top-color: rgb(197, 197, 201) | identical |
| 3 | `[&_blockquote]:text-zinc-600` | `[&_blockquote]:text-foreground-secondary` | `[&_blockquote]:text-foreground-secondary` color: rgb(104, 104, 111) | identical |
| 4 | `[&_code]:bg-zinc-100` | `[&_code]:bg-surface-hover` | `[&_code]:bg-surface-hover` background-color: rgb(239, 239, 240) | identical |
| 5 | `[&_del]:text-zinc-500` | `[&_del]:text-foreground-tertiary` | `[&_del]:text-foreground-tertiary` color: rgb(131, 131, 140) | identical |
| 6 | `before:content-[''] before:bg-zinc-200` | `before:content-[''] before:bg-surface-active` | `before:bg-surface-active` background-color: rgb(218, 218, 220) | identical |
| 7 | `bg-[#F9F9FA]` | `bg-surface-muted` | background-color: rgb(249, 249, 250) | identical |
| 8 | `bg-amber-50` | `bg-warning-surface` | background-color: rgb(255, 251, 235) | identical |
| 9 | `bg-amber-50/40` | `bg-warning-surface/40` | background-color: rgba(255, 251, 235, 0.4) | identical |
| 10 | `bg-amber-500` | `bg-warning` | background-color: rgb(245, 158, 11) | identical |
| 11 | `bg-blue-50` | `bg-info-surface` | background-color: rgb(239, 246, 255) | identical |
| 12 | `bg-gradient-to-r from-amber-50/60` | `bg-gradient-to-r from-warning-surface/60` | background-image: linear-gradient(to right, rgba(255, 251, 235, 0.6), rgba(255, 251, 235, 0)) | identical |
| 13 | `bg-gradient-to-r from-transparent to-blue-50` | `bg-gradient-to-r from-transparent to-info-surface` | background-image: linear-gradient(to right, rgba(0, 0, 0, 0), rgb(239, 246, 255)) | identical |
| 14 | `bg-gradient-to-r from-transparent to-white` | `bg-gradient-to-r from-transparent to-surface` | background-image: linear-gradient(to right, rgba(0, 0, 0, 0), rgb(254, 254, 254)) | identical |
| 15 | `bg-gradient-to-r from-transparent to-zinc-200` | `bg-gradient-to-r from-transparent to-surface-active` | background-image: linear-gradient(to right, rgba(0, 0, 0, 0), rgb(218, 218, 220)) | identical |
| 16 | `bg-gradient-to-r from-transparent via-white` | `bg-gradient-to-r from-transparent via-surface` | background-image: linear-gradient(to right, rgba(0, 0, 0, 0), rgb(254, 254, 254), rgba(254, 254, 254, 0)) | identical |
| 17 | `bg-gradient-to-r from-zinc-100` | `bg-gradient-to-r from-surface-hover` | background-image: linear-gradient(to right, rgb(239, 239, 240), rgba(239, 239, 240, 0)) | identical |
| 18 | `bg-green-50` | `bg-success-surface` | background-color: rgb(232, 246, 237) | identical |
| 19 | `bg-neutral-50` | `bg-background` | background-color: rgb(250, 250, 250) | identical |
| 20 | `bg-purple-500` | `bg-brand` | background-color: rgb(119, 51, 245) | identical |
| 21 | `bg-purple-500/30` | `bg-brand/30` | background-color: rgba(119, 51, 245, 0.3) | identical |
| 22 | `bg-red-50` | `bg-error-surface` | background-color: rgb(254, 245, 245) | identical |
| 23 | `bg-red-500` | `bg-error` | background-color: rgb(239, 68, 68) | identical |
| 24 | `bg-violet-50` | `bg-accent-surface` | background-color: rgb(245, 243, 255) | identical |
| 25 | `bg-white` | `bg-surface` | background-color: rgb(254, 254, 254) | identical |
| 26 | `bg-zinc-100` | `bg-surface-hover` | background-color: rgb(239, 239, 240) | identical |
| 27 | `bg-zinc-100/80` | `bg-surface-hover/80` | background-color: rgba(239, 239, 240, 0.8) | identical |
| 28 | `bg-zinc-50` | `bg-surface-muted` | background-color: rgb(249, 249, 250) | identical |
| 29 | `bg-zinc-50/60` | `bg-surface-muted/60` | background-color: rgba(249, 249, 250, 0.6) | identical |
| 30 | `bg-zinc-900` | `bg-action-hover` | background-color: rgb(44, 44, 48) | identical |
| 31 | `border-[#DADADC]` | `border-border-base` | border-top-color: rgb(218, 218, 220) | identical |
| 32 | `border-amber-200` | `border-warning-border` | border-top-color: rgb(253, 230, 138) | identical |
| 33 | `border-green-600` | `border-success` | border-top-color: rgb(20, 148, 67) | identical |
| 34 | `border-purple-500` | `border-brand` | border-top-color: rgb(119, 51, 245) | identical |
| 35 | `border-red-600` | `border-error-hover` | border-top-color: rgb(217, 54, 54) | identical |
| 36 | `border-zinc-100` | `border-separator` | border-top-color: rgb(239, 239, 240) | identical |
| 37 | `border-zinc-200` | `border-border-base` | border-top-color: rgb(218, 218, 220) | identical |
| 38 | `border-zinc-200/80` | `border-border-base/80` | border-top-color: rgba(218, 218, 220, 0.8) | identical |
| 39 | `border-zinc-300` | `border-border-strong` | border-top-color: rgb(197, 197, 201) | identical |
| 40 | `border-zinc-900` | `border-action-hover` | border-top-color: rgb(44, 44, 48) | identical |
| 41 | `data-[selected=true]:bg-zinc-100` | `data-[selected=true]:bg-surface-hover` | `data-[selected=true]:bg-surface-hover` background-color: rgb(239, 239, 240) (state forced) | identical |
| 42 | `disabled:text-zinc-800` | `disabled:text-foreground-emphasis` | `disabled:text-foreground-emphasis` color: rgb(62, 62, 67) (state forced) | identical |
| 43 | `divide-y divide-zinc-100` | `divide-y divide-separator` | border-top-color: rgb(239, 239, 240) | identical |
| 44 | `divide-y divide-zinc-200` | `divide-y divide-border-base` | border-top-color: rgb(218, 218, 220) | identical |
| 45 | `fill-white` | `fill-surface` | fill: rgb(254, 254, 254) | identical |
| 46 | `fill-zinc-200` | `fill-surface-active` | fill: rgb(218, 218, 220) | identical |
| 47 | `focus-visible:bg-zinc-50` | `focus-visible:bg-surface-muted` | `focus-visible:bg-surface-muted` background-color: rgb(249, 249, 250) (state forced) | identical |
| 48 | `focus-visible:ring-2 focus-visible:ring-zinc-300` | `focus-visible:ring-2 focus-visible:ring-border-strong` | `focus-visible:ring-border-strong` box-shadow: rgb(255, 255, 255) 0px 0px 0px 0px, rgb(197, 197, 201) 0px 0px 0px 2px, rgba(0, 0, 0, 0) 0px 0px 0px 0px (state forced) | identical |
| 49 | `focus-visible:ring-2 focus-visible:ring-zinc-800` | `focus-visible:ring-2 focus-visible:ring-action` | `focus-visible:ring-action` box-shadow: rgb(255, 255, 255) 0px 0px 0px 0px, rgb(62, 62, 67) 0px 0px 0px 2px, rgba(0, 0, 0, 0) 0px 0px 0px 0px (state forced) | identical |
| 50 | `focus-visible:text-zinc-600` | `focus-visible:text-foreground-secondary` | `focus-visible:text-foreground-secondary` color: rgb(104, 104, 111) (state forced) | identical |
| 51 | `focus-within:ring-2 focus-within:ring-amber-200` | `focus-within:ring-2 focus-within:ring-warning-border` | `focus-within:ring-warning-border` box-shadow: rgb(255, 255, 255) 0px 0px 0px 0px, rgb(253, 230, 138) 0px 0px 0px 2px, rgba(0, 0, 0, 0) 0px 0px 0px 0px (state forced) | identical |
| 52 | `group-hover:bg-purple-500/50` | `group-hover:bg-brand/50` | `group-hover:bg-brand/50` background-color: rgba(119, 51, 245, 0.5) (state forced) | identical |
| 53 | `group-hover:text-zinc-600` | `group-hover:text-foreground-secondary` | `group-hover:text-foreground-secondary` color: rgb(104, 104, 111) (state forced) | identical |
| 54 | `group-hover:text-zinc-900` | `group-hover:text-foreground-strong` | `group-hover:text-foreground-strong` color: rgb(44, 44, 48) (state forced) | identical |
| 55 | `hover:bg-neutral-50` | `hover:bg-background` | `hover:bg-background` background-color: rgb(250, 250, 250) (state forced) | identical |
| 56 | `hover:bg-white` | `hover:bg-surface` | `hover:bg-surface` background-color: rgb(254, 254, 254) (state forced) | identical |
| 57 | `hover:bg-zinc-100` | `hover:bg-surface-hover` | `hover:bg-surface-hover` background-color: rgb(239, 239, 240) (state forced) | identical |
| 58 | `hover:bg-zinc-50` | `hover:bg-surface-muted` | `hover:bg-surface-muted` background-color: rgb(249, 249, 250) (state forced) | identical |
| 59 | `hover:bg-zinc-50/60` | `hover:bg-surface-muted/60` | `hover:bg-surface-muted/60` background-color: rgba(249, 249, 250, 0.6) (state forced) | identical |
| 60 | `hover:border-zinc-300` | `hover:border-border-strong` | `hover:border-border-strong` border-top-color: rgb(197, 197, 201) (state forced) | identical |
| 61 | `hover:text-black` | `hover:text-foreground-base` | `hover:text-foreground-base` color: rgb(20, 20, 20) (state forced) | identical |
| 62 | `hover:text-zinc-600` | `hover:text-foreground-secondary` | `hover:text-foreground-secondary` color: rgb(104, 104, 111) (state forced) | identical |
| 63 | `hover:text-zinc-700` | `hover:text-foreground-body` | `hover:text-foreground-body` color: rgb(80, 80, 87) (state forced) | identical |
| 64 | `hover:text-zinc-900` | `hover:text-foreground-strong` | `hover:text-foreground-strong` color: rgb(44, 44, 48) (state forced) | identical |
| 65 | `hover:text-zinc-950` | `hover:text-foreground` | `hover:text-foreground` color: rgb(9, 9, 11) (state forced) | identical |
| 66 | `leading-[20px]` | `leading-5` | line-height: 20px | identical |
| 67 | `leading-[22px]` | `leading-5.5` | line-height: 22px | identical |
| 68 | `leading-[28px]` | `leading-7` | line-height: 28px | identical |
| 69 | `motion-reduce:bg-zinc-100` | `motion-reduce:bg-surface-hover` | `motion-reduce:bg-surface-hover` background-color: rgb(239, 239, 240) (state forced) | identical |
| 70 | `placeholder:text-zinc-400` | `placeholder:text-foreground-subtle` | `placeholder:text-foreground-subtle` color: rgb(173, 173, 179) | identical |
| 71 | `ring-2 ring-amber-200` | `ring-2 ring-warning-border` | box-shadow: rgb(255, 255, 255) 0px 0px 0px 0px, rgb(253, 230, 138) 0px 0px 0px 2px, rgba(0, 0, 0, 0) 0px 0px 0px 0px | identical |
| 72 | `ring-2 ring-zinc-200` | `ring-2 ring-border-base` | box-shadow: rgb(255, 255, 255) 0px 0px 0px 0px, rgb(218, 218, 220) 0px 0px 0px 2px, rgba(0, 0, 0, 0) 0px 0px 0px 0px | identical |
| 73 | `scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-200` | `scrollbar-thin scrollbar-track-transparent scrollbar-thumb-surface-active` | scrollbar-color: rgb(218, 218, 220) rgba(0, 0, 0, 0) | identical |
| 74 | `stroke-zinc-200` | `stroke-border-base` | stroke: rgb(218, 218, 220) | identical |
| 75 | `text-[#505057]` | `text-foreground-body` | color: rgb(80, 80, 87) | identical |
| 76 | `text-[10px]` | `text-tiny leading-inherit` | font-size: 10px; line-height: 30px | identical |
| 77 | `text-[11px]` | `text-caption-sm leading-inherit` | font-size: 11px; line-height: 30px | identical |
| 78 | `text-[13px]` | `text-body-sm leading-inherit` | font-size: 13px; line-height: 30px | identical |
| 79 | `text-[15px]` | `text-body-md leading-inherit` | font-size: 15px; line-height: 30px | identical |
| 80 | `text-[15px] leading-relaxed` | `text-body-md leading-relaxed` | font-size: 15px; line-height: 24.375px | identical |
| 81 | `text-[28px]` | `text-heading leading-inherit` | font-size: 28px; line-height: 30px | identical |
| 82 | `text-[44px] leading-[50px]` | `text-display leading-[50px]` | font-size: 44px; line-height: 50px | identical |
| 83 | `text-amber-500` | `text-warning` | color: rgb(245, 158, 11) | identical |
| 84 | `text-amber-700` | `text-warning-foreground` | color: rgb(180, 83, 9) | identical |
| 85 | `text-black` | `text-foreground-base` | color: rgb(20, 20, 20) | identical |
| 86 | `text-green-600` | `text-success` | color: rgb(20, 148, 67) | identical |
| 87 | `text-green-700` | `text-success-foreground` | color: rgb(16, 116, 53) | identical |
| 88 | `text-purple-500` | `text-brand` | color: rgb(119, 51, 245) | identical |
| 89 | `text-red-500` | `text-error` | color: rgb(239, 68, 68) | identical |
| 90 | `text-red-700` | `text-error-foreground` | color: rgb(170, 48, 48) | identical |
| 91 | `text-violet-700` | `text-accent-strong` | color: rgb(109, 40, 217) | identical |
| 92 | `text-white` | `text-action-foreground` | color: rgb(254, 254, 254) | identical |
| 93 | `text-zinc-300` | `text-foreground-disabled` | color: rgb(197, 197, 201) | identical |
| 94 | `text-zinc-400` | `text-foreground-subtle` | color: rgb(173, 173, 179) | identical |
| 95 | `text-zinc-500` | `text-foreground-tertiary` | color: rgb(131, 131, 140) | identical |
| 96 | `text-zinc-600` | `text-foreground-secondary` | color: rgb(104, 104, 111) | identical |
| 97 | `text-zinc-700` | `text-foreground-body` | color: rgb(80, 80, 87) | identical |
| 98 | `text-zinc-800` | `text-foreground-emphasis` | color: rgb(62, 62, 67) | identical |
| 99 | `text-zinc-900` | `text-foreground-strong` | color: rgb(44, 44, 48) | identical |
| 100 | `tracking-[-0.01em]` | `tracking-title` | letter-spacing: -0.16px | identical |
| 101 | `tracking-[-0.02em]` | `tracking-heading` | letter-spacing: -0.32px | identical |
| 102 | `tracking-[-0.04em]` | `tracking-display` | letter-spacing: -0.64px | identical |
| 103 | `tracking-[0.06em]` | `tracking-eyebrow` | letter-spacing: 0.96px | identical |
| 104 | `tracking-[0.12em]` | `tracking-caps` | letter-spacing: 1.92px | identical |
