2 unique class strings (2 occurrences), 11 cases (as written, cn() contexts), 528 measurements (2 widths x 6 states x 2 parent line-heights x plain/profile-tabs): 0 failing cases

| # | old class string | new class string | value of the new class (computed, 16px root, in a leading-[30px] parent, 1440px, variant stripped, with the ring/divide/gradient helper that makes a colour visible) | result |
| --- | --- | --- | --- | --- |
| 1 | `shrink-0 bg-neutral-200 dark:bg-neutral-800 h-[1px] w-full` | `shrink-0 bg-neutral-200 h-px w-full` | (no colour or type property: see result) | identical (432 measurements) |
| 2 | `shrink-0 bg-neutral-200 dark:bg-neutral-800 h-full w-[1px]` | `shrink-0 bg-neutral-200 h-full w-px` | (no colour or type property: see result) | identical (96 measurements) |

### cn()-merged on the real element

| element | old merged class string | new merged class string | font-size · line-height · color (in a leading-[30px] parent, 1440px) | result |
| --- | --- | --- | --- | --- |
| `<Separator className="">` | `shrink-0 bg-neutral-200 dark:bg-neutral-800 h-[1px] w-full` | `shrink-0 bg-neutral-200 h-px w-full` | 16px · 30px · rgb(1, 2, 3) | identical (48 measurements) |
| `<Separator className="h-full w-[1px] text-zinc-300">` | `shrink-0 bg-neutral-200 dark:bg-neutral-800 h-full w-[1px] text-zinc-300` | `shrink-0 bg-neutral-200 h-full w-[1px] text-zinc-300` | 16px · 30px · rgb(197, 197, 201) | identical (48 measurements) |
| `<Separator className="my-6 bg-transparent">` | `shrink-0 dark:bg-neutral-800 h-[1px] w-full my-6 bg-transparent` | `shrink-0 h-px w-full my-6 bg-transparent` | 16px · 30px · rgb(1, 2, 3) | identical (48 measurements) |
| `<Separator className="mb-[25px] mt-[60px] bg-transparent">` | `shrink-0 dark:bg-neutral-800 h-[1px] w-full mb-[25px] mt-[60px] bg-transparent` | `shrink-0 h-px w-full mb-[25px] mt-[60px] bg-transparent` | 16px · 30px · rgb(1, 2, 3) | identical (48 measurements) |
| `<Separator className="h-[1px] w-full text-zinc-300">` | `shrink-0 bg-neutral-200 dark:bg-neutral-800 h-[1px] w-full text-zinc-300` | `shrink-0 bg-neutral-200 h-[1px] w-full text-zinc-300` | 16px · 30px · rgb(197, 197, 201) | identical (48 measurements) |
| `<Separator className="mb-8">` | `shrink-0 bg-neutral-200 dark:bg-neutral-800 h-[1px] w-full mb-8` | `shrink-0 bg-neutral-200 h-px w-full mb-8` | 16px · 30px · rgb(1, 2, 3) | identical (48 measurements) |
| `<Separator className="text-[#E1E1E1]">` | `shrink-0 bg-neutral-200 dark:bg-neutral-800 h-[1px] w-full text-[#E1E1E1]` | `shrink-0 bg-neutral-200 h-px w-full text-[#E1E1E1]` | 16px · 30px · rgb(225, 225, 225) | identical (48 measurements) |


