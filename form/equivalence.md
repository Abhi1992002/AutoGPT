5 unique class strings (5 occurrences), 7 cases (as written, cn() contexts), 336 measurements (2 widths x 6 states x 2 parent line-heights x plain/profile-tabs): 0 failing cases

| # | old class string | new class string | value of the new class (computed, 16px root, in a leading-[30px] parent, 1440px, variant stripped, with the ring/divide/gradient helper that makes a colour visible) | result |
| --- | --- | --- | --- | --- |
| 1 | `text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70` | `text-body font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70` | color: rgb(1, 2, 3); font-size: 14px; line-height: 14px | identical (96 measurements) |
| 2 | `text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-red-500 dark:text-red-900` | `text-error text-body font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70` | color: rgb(239, 68, 68); font-size: 14px; line-height: 14px | identical (96 measurements) |
| 3 | `text-[0.8rem] text-neutral-500 dark:text-neutral-400 max-w-md` | `font-sans font-normal text-neutral-500 max-w-md text-[0.8rem] leading-inherit` | font-size: 12.8px; line-height: 30px; font-weight: 400 | identical (48 measurements) |
| 4 | `text-[0.8rem] text-neutral-500 dark:text-neutral-400` | `font-sans font-normal text-neutral-500 text-[0.8rem] leading-inherit` | font-size: 12.8px; line-height: 30px; font-weight: 400 | identical (48 measurements) |
| 5 | `text-[0.8rem] font-medium text-red-500 dark:text-red-900` | `font-sans font-medium text-error text-[0.8rem] leading-inherit` | color: rgb(239, 68, 68); font-size: 12.8px; line-height: 30px | identical (48 measurements) |


