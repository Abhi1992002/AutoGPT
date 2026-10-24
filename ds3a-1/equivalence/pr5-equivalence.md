7 unique class strings (7 occurrences), 20 cases (as written, cn() contexts), 960 measurements (2 widths x 6 states x 2 parent line-heights x plain/profile-tabs): 0 failing cases

| # | old class string | new class string | value of the new class (computed, 16px root, in a leading-[30px] parent, 1440px, variant stripped, with the ring/divide/gradient helper that makes a colour visible) | result |
| --- | --- | --- | --- | --- |
| 1 | `text-sm text-neutral-500 dark:text-neutral-400` | `text-body leading-5 text-neutral-500` | color: rgb(115, 115, 115); font-size: 14px; line-height: 20px | identical (96 measurements) |
| 2 | `agpt-card text-neutral-950 border-none dark:bg-slate-900` | `agpt-card text-neutral-950 border-none dark:bg-slate-900` | (no colour or type property: see result) | identical (144 measurements) |
| 3 | `agpt-card text-neutral-950 border-dashed` | `agpt-card text-neutral-950 border-dashed` | (no colour or type property: see result) | identical (144 measurements) |
| 4 | `agpt-card text-neutral-950 mb-6` | `agpt-card text-neutral-950 mb-6` | (no colour or type property: see result) | identical (144 measurements) |
| 5 | `agpt-card text-neutral-950` | `agpt-card text-neutral-950` | (no colour or type property: see result) | identical (144 measurements) |
| 6 | `agpt-card text-neutral-950 overflow-hidden rounded-lg border border-slate-200 bg-surface shadow-sm` | `agpt-card text-neutral-950 overflow-hidden rounded-lg border border-slate-200 bg-surface shadow-sm` | (no colour or type property: see result) | identical (144 measurements) |
| 7 | `agpt-card text-neutral-950 w-full overflow-hidden rounded-lg border border-slate-200 bg-surface shadow-sm` | `agpt-card text-neutral-950 w-full overflow-hidden rounded-lg border border-slate-200 bg-surface shadow-sm` | (no colour or type property: see result) | identical (144 measurements) |

### cn()-merged on the real element

| element | old merged class string | new merged class string | font-size · line-height · color (in a leading-[30px] parent, 1440px) | result |
| --- | --- | --- | --- | --- |
| `<Card variant="outlined" className="border-none dark:bg-slate-900">` | `agpt-card text-neutral-950 border-none dark:bg-slate-900` | `agpt-card text-neutral-950 border-none dark:bg-slate-900` | 16px · 30px · rgb(10, 10, 10) | identical (48 measurements) |
| `<Card variant="outlined" className="border-dashed">` | `agpt-card text-neutral-950 border-dashed` | `agpt-card text-neutral-950 border-dashed` | 16px · 30px · rgb(10, 10, 10) | identical (48 measurements) |
| `<Card variant="outlined" className="mb-6">` | `agpt-card text-neutral-950 mb-6` | `agpt-card text-neutral-950 mb-6` | 16px · 30px · rgb(10, 10, 10) | identical (48 measurements) |
| `<Card variant="outlined" className="">` | `agpt-card text-neutral-950` | `agpt-card text-neutral-950` | 16px · 30px · rgb(10, 10, 10) | identical (48 measurements) |
| `<Card variant="outlined" className="overflow-hidden rounded-lg border border-slate-200 bg-surface shadow-sm">` | `agpt-card text-neutral-950 overflow-hidden rounded-lg border border-slate-200 bg-surface shadow-sm` | `agpt-card text-neutral-950 overflow-hidden rounded-lg border border-slate-200 bg-surface shadow-sm` | 16px · 30px · rgb(10, 10, 10) | identical (48 measurements) |
| `<Card variant="outlined" className="w-full overflow-hidden rounded-lg border border-slate-200 bg-surface shadow-sm">` | `agpt-card text-neutral-950 w-full overflow-hidden rounded-lg border border-slate-200 bg-surface shadow-sm` | `agpt-card text-neutral-950 w-full overflow-hidden rounded-lg border border-slate-200 bg-surface shadow-sm` | 16px · 30px · rgb(10, 10, 10) | identical (48 measurements) |


