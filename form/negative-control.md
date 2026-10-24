3 unique class strings (3 occurrences), 4 cases (as written, cn() contexts), 192 measurements (2 widths x 6 states x 2 parent line-heights x plain/profile-tabs): 3 failing cases

| # | old class string | new class string | value of the new class (computed, 16px root, in a leading-[30px] parent, 1440px, variant stripped, with the ring/divide/gradient helper that makes a colour visible) | result |
| --- | --- | --- | --- | --- |
| 1 | `text-[0.8rem] text-neutral-500 dark:text-neutral-400 max-w-md` | `font-sans font-normal text-neutral-500 max-w-md text-caption leading-4.5` | color: rgb(115, 115, 115); font-size: 12px; line-height: 18px; font-weight: 400 | FAIL |
| 2 | `text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70` | `text-body font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70` | color: rgb(1, 2, 3); font-size: 14px; line-height: 22px | FAIL |
| 3 | `text-[0.8rem] font-medium text-red-500 dark:text-red-900` | `font-sans font-normal text-error text-[0.8rem] leading-inherit` | color: rgb(239, 68, 68); font-size: 12.8px; line-height: 30px; font-weight: 400 | FAIL |

- FAIL as written: `text-[0.8rem] text-neutral-500 dark:text-neutral-400 max-w-md` -> `font-sans font-normal text-neutral-500 max-w-md text-caption leading-4.5` at 1440px default leading-[30px] plain, 1440px default leading-[30px] profile-tabs, 1440px default leading-[1.5] plain, 1440px default leading-[1.5] profile-tabs (+44)
- FAIL as written: `text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70` -> `text-body font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70` at 1440px default leading-[30px] plain, 1440px default leading-[1.5] plain, 1440px hover leading-[30px] plain, 1440px hover leading-[1.5] plain (+20)
- FAIL as written: `text-[0.8rem] font-medium text-red-500 dark:text-red-900` -> `font-sans font-normal text-error text-[0.8rem] leading-inherit` at 1440px default leading-[30px] plain, 1440px default leading-[30px] profile-tabs, 1440px default leading-[1.5] plain, 1440px default leading-[1.5] profile-tabs (+44)
