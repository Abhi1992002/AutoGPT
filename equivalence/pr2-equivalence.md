44 unique class strings (141 occurrences), 96 cases (as written, cn() contexts), 4608 measurements (2 widths x 6 states x 2 parent line-heights x plain/profile-tabs): 0 failing cases

| # | old class string | new class string | value of the new class (computed, 16px root, in a leading-[30px] parent, 1440px, variant stripped, with the ring/divide/gradient helper that makes a colour visible) | result |
| --- | --- | --- | --- | --- |
| 1 | `flex h-full w-full dark:bg-slate-900` | `flex h-full w-full` | (no colour or type property: see result) | identical (96 measurements) |
| 2 | `size-3.5 text-zinc-600` | `size-3.5 text-foreground-secondary` | color: rgb(104, 104, 111) | identical (96 measurements) |
| 3 | `size-3.5 animate-spin text-zinc-600` | `size-3.5 animate-spin text-foreground-secondary` | color: rgb(104, 104, 111) | identical (96 measurements) |
| 4 | `bg-zinc-100` | `bg-surface-hover` | background-color: rgb(239, 239, 240) | identical (96 measurements) |
| 5 | `bg-white` | `bg-surface` | background-color: rgb(254, 254, 254) | identical (96 measurements) |
| 6 | `absolute bottom-4 left-4 z-10 flex flex-col items-center gap-2 rounded-full bg-white px-1 py-2 shadow-lg` | `absolute bottom-4 left-4 z-10 flex flex-col items-center gap-2 rounded-full bg-surface px-1 py-2 shadow-lg` | background-color: rgb(254, 254, 254) | identical (96 measurements) |
| 7 | `flex flex-col items-center gap-4 rounded-xlarge border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-slate-800` | `flex flex-col items-center gap-4 rounded-xlarge border border-gray-200 bg-surface p-8 shadow-lg` | background-color: rgb(254, 254, 254) | identical (96 measurements) |
| 8 | `absolute inset-0 animate-spin rounded-full border-4 border-zinc-100 border-t-zinc-400 dark:border-gray-700 dark:border-t-blue-400` | `absolute inset-0 animate-spin rounded-full border-4 border-separator border-t-zinc-400` | border-top-color: rgb(173, 173, 179) | identical (96 measurements) |
| 9 | `!stroke-red-500 !stroke-[2px] [stroke-dasharray:4]` | `!stroke-error !stroke-[2px] [stroke-dasharray:4]` | (no colour or type property: see result) | identical (96 measurements) |
| 10 | `stroke-zinc-500/50 hover:stroke-zinc-500` | `stroke-edge/50 hover:stroke-edge` | (no colour or type property: see result) | identical (96 measurements) |
| 11 | `bg-red-500 opacity-100 hover:bg-red-600` | `bg-error opacity-100 hover:bg-error-hover` | background-color: rgb(217, 54, 54) | identical (96 measurements) |
| 12 | `text-gray-400 opacity-100` | `text-handle opacity-100` | color: rgb(156, 163, 175) | identical (96 measurements) |
| 13 | `text-red-500` | `text-error` | color: rgb(239, 68, 68) | identical (96 measurements) |
| 14 | `text-sm leading-[1.375rem] text-zinc-800` | `text-sm leading-5.5 text-foreground-emphasis` | color: rgb(62, 62, 67); font-size: 14px; line-height: 22px | identical (96 measurements) |
| 15 | `text-sm font-normal leading-[1.375rem] text-zinc-800 m-0` | `text-sm font-normal leading-5.5 text-foreground-emphasis m-0` | color: rgb(62, 62, 67); font-size: 14px; line-height: 22px | identical (96 measurements) |
| 16 | `text-sm font-medium leading-[1.375rem] text-zinc-800 m-0` | `text-sm font-medium leading-5.5 text-foreground-emphasis m-0` | color: rgb(62, 62, 67); font-size: 14px; line-height: 22px | identical (96 measurements) |
| 17 | `text-xs font-normal leading-[1.125rem] text-zinc-500 m-0` | `text-xs font-normal leading-4.5 text-foreground-tertiary m-0` | color: rgb(131, 131, 140); font-size: 12px; line-height: 18px | identical (96 measurements) |
| 18 | `bg-zinc-100 ring-1 ring-zinc-200 rounded-2xl p-2 px-4 mt-2 flex items-start gap-2 text-sm font-medium text-zinc-600` | `bg-surface-hover ring-1 ring-border-base rounded-2xl p-2 px-4 mt-2 flex items-start gap-2 text-sm font-medium text-foreground-secondary` | color: rgb(104, 104, 111); background-color: rgb(239, 239, 240); border-top-color: rgb(228, 228, 231); box-shadow: rgb(255, 255, 255) 0px 0px 0px 0px, rgb(218, 218, 220) 0px 0px 0px 2px, rgba(0, 0, 0, 0) 0px 0px 0px 0px | identical (144 measurements) |
| 19 | `mt-3 p-3 bg-green-50 ring-1 ring-green-200 rounded-2xl` | `mt-3 p-3 bg-success-surface ring-1 ring-green-200 rounded-2xl` | background-color: rgb(232, 246, 237) | identical (144 measurements) |
| 20 | `text-sm font-medium text-green-600 m-0` | `text-sm font-medium text-success m-0` | color: rgb(20, 148, 67) | identical (96 measurements) |
| 21 | `text-[0.8125rem] text-green-600 m-0 pl-4 mt-2 space-y-1` | `text-body-sm leading-inherit text-success m-0 pl-4 mt-2 space-y-1` | color: rgb(20, 148, 67); font-size: 13px; line-height: 30px | identical (96 measurements) |
| 22 | `mt-3 p-3 bg-amber-50 ring-1 ring-amber-200 rounded-2xl` | `mt-3 p-3 bg-warning-surface ring-1 ring-warning-border rounded-2xl` | background-color: rgb(255, 251, 235); box-shadow: rgb(255, 255, 255) 0px 0px 0px 0px, rgb(253, 230, 138) 0px 0px 0px 2px, rgba(0, 0, 0, 0) 0px 0px 0px 0px | identical (144 measurements) |
| 23 | `text-[0.8125rem] text-amber-600 m-0 pl-4 space-y-1` | `text-body-sm leading-inherit text-amber-600 m-0 pl-4 space-y-1` | color: rgb(217, 119, 6); font-size: 13px; line-height: 30px | identical (96 measurements) |
| 24 | `bg-amber-50` | `bg-warning-surface` | background-color: rgb(255, 251, 235) | identical (96 measurements) |
| 25 | `ring-amber-200` | `ring-warning-border` | box-shadow: rgb(255, 255, 255) 0px 0px 0px 0px, rgb(253, 230, 138) 0px 0px 0px 2px, rgba(0, 0, 0, 0) 0px 0px 0px 0px | identical (144 measurements) |
| 26 | `bg-green-50` | `bg-success-surface` | background-color: rgb(232, 246, 237) | identical (96 measurements) |
| 27 | `text-green-600` | `text-success` | color: rgb(20, 148, 67) | identical (96 measurements) |
| 28 | `bg-green-50 ring-1 ring-green-200` | `bg-success-surface ring-1 ring-green-200` | background-color: rgb(232, 246, 237) | identical (144 measurements) |
| 29 | `bg-amber-50 ring-1 ring-amber-200` | `bg-warning-surface ring-1 ring-warning-border` | background-color: rgb(255, 251, 235); box-shadow: rgb(255, 255, 255) 0px 0px 0px 0px, rgb(253, 230, 138) 0px 0px 0px 2px, rgba(0, 0, 0, 0) 0px 0px 0px 0px | identical (144 measurements) |
| 30 | `mt-3 p-3 bg-blue-50 ring-1 ring-blue-200 rounded-2xl` | `mt-3 p-3 bg-info-surface ring-1 ring-blue-200 rounded-2xl` | background-color: rgb(239, 246, 255) | identical (144 measurements) |
| 31 | `text-sm font-medium text-blue-600 m-0 mb-2` | `text-sm font-medium text-info-foreground m-0 mb-2` | color: rgb(37, 99, 235) | identical (96 measurements) |
| 32 | `text-[0.8125rem] text-blue-600 m-0` | `text-body-sm leading-inherit text-info-foreground m-0` | color: rgb(37, 99, 235); font-size: 13px; line-height: 30px | identical (96 measurements) |
| 33 | `flex items-center justify-center gap-2 text-sm font-medium text-green-600` | `flex items-center justify-center gap-2 text-sm font-medium text-success` | color: rgb(20, 148, 67) | identical (96 measurements) |
| 34 | `text-[0.75rem] text-green-500 m-0 mt-2 text-center italic` | `text-caption leading-inherit text-green-500 m-0 mt-2 text-center italic` | color: rgb(22, 163, 74); font-size: 12px; line-height: 30px | identical (96 measurements) |
| 35 | `text-sm font-medium text-blue-600 m-0` | `text-sm font-medium text-info-foreground m-0` | color: rgb(37, 99, 235) | identical (96 measurements) |
| 36 | `text-[0.8125rem] text-blue-600 m-0 mt-1` | `text-body-sm leading-inherit text-info-foreground m-0 mt-1` | color: rgb(37, 99, 235); font-size: 13px; line-height: 30px | identical (96 measurements) |
| 37 | `mt-2 p-2 bg-zinc-100 ring-1 ring-zinc-200 rounded-xl` | `mt-2 p-2 bg-surface-hover ring-1 ring-border-base rounded-xl` | background-color: rgb(239, 239, 240); border-top-color: rgb(228, 228, 231); box-shadow: rgb(255, 255, 255) 0px 0px 0px 0px, rgb(218, 218, 220) 0px 0px 0px 2px, rgba(0, 0, 0, 0) 0px 0px 0px 0px | identical (144 measurements) |
| 38 | `text-[0.8125rem] text-zinc-600 m-0` | `text-body-sm leading-inherit text-foreground-secondary m-0` | color: rgb(104, 104, 111); font-size: 13px; line-height: 30px | identical (96 measurements) |
| 39 | `text-[0.8125rem] text-zinc-500 m-0 mt-1 pl-4` | `text-body-sm leading-inherit text-foreground-tertiary m-0 mt-1 pl-4` | color: rgb(131, 131, 140); font-size: 13px; line-height: 30px | identical (96 measurements) |
| 40 | `text-[0.75rem] text-amber-500 m-0 mt-2 italic` | `text-caption leading-inherit text-warning m-0 mt-2 italic` | color: rgb(245, 158, 11); font-size: 12px; line-height: 30px | identical (96 measurements) |
| 41 | `text-sm font-medium text-blue-600 m-0 mb-1` | `text-sm font-medium text-info-foreground m-0 mb-1` | color: rgb(37, 99, 235) | identical (96 measurements) |
| 42 | `text-[0.75rem] text-blue-500 m-0 mt-1 italic` | `text-caption leading-inherit text-info m-0 mt-1 italic` | color: rgb(59, 130, 246); font-size: 12px; line-height: 30px | identical (96 measurements) |
| 43 | `bg-violet-50` | `bg-accent-surface` | background-color: rgb(245, 243, 255) | identical (96 measurements) |
| 44 | `bg-blue-50` | `bg-info-surface` | background-color: rgb(239, 246, 255) | identical (96 measurements) |


