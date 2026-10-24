8 unique class strings (8 occurrences), 18 cases (as written, cn() contexts), 864 measurements (2 widths x 6 states x 2 parent line-heights x plain/profile-tabs): 6 failing cases

| # | old class string | new class string | value of the new class (computed, 16px root, in a leading-[30px] parent, 1440px, variant stripped, with the ring/divide/gradient helper that makes a colour visible) | result |
| --- | --- | --- | --- | --- |
| 1 | `text-[13px]` | `text-body-sm` | color: rgb(1, 2, 3); font-size: 13px; line-height: 20px | FAIL |
| 2 | `text-zinc-500` | `text-foreground-secondary` | color: rgb(104, 104, 111) | FAIL |
| 3 | `stroke-zinc-500/50` | `stroke-edge` | (no colour or type property: see result) | FAIL |
| 4 | `ring-slate-200` | `ring-node-border/60` | box-shadow: rgb(255, 255, 255) 0px 0px 0px 0px, rgba(207, 212, 219, 0.6) 0px 0px 0px 2px, rgba(0, 0, 0, 0) 0px 0px 0px 0px | FAIL |
| 5 | `text-gray-400` | `text-foreground-subtle` | color: rgb(173, 173, 179) | FAIL |
| 6 | `ring-slate-200/60` | `ring-node-border/60` | box-shadow: rgb(255, 255, 255) 0px 0px 0px 0px, rgba(207, 212, 219, 0.6) 0px 0px 0px 2px, rgba(0, 0, 0, 0) 0px 0px 0px 0px | identical (144 measurements) |
| 7 | `text-gray-400` | `text-handle` | color: rgb(156, 163, 175) | identical (96 measurements) |
| 8 | `stroke-zinc-500/50 hover:stroke-zinc-500` | `stroke-edge/50 hover:stroke-edge` | (no colour or type property: see result) | identical (96 measurements) |

- FAIL as written: `text-[13px]` -> `text-body-sm` at 1440px default leading-[30px] plain, 1440px default leading-[30px] profile-tabs, 1440px default leading-[1.5] plain, 1440px default leading-[1.5] profile-tabs (+44)
- FAIL as written: `text-zinc-500` -> `text-foreground-secondary` at 1440px default leading-[30px] plain, 1440px default leading-[30px] profile-tabs, 1440px default leading-[1.5] plain, 1440px default leading-[1.5] profile-tabs (+44)
- FAIL as written: `stroke-zinc-500/50` -> `stroke-edge` at 1440px default leading-[30px] plain, 1440px default leading-[30px] profile-tabs, 1440px default leading-[1.5] plain, 1440px default leading-[1.5] profile-tabs (+44)
- FAIL cn(generic base): `text-black text-base leading-7 tracking-wide font-bold bg-black border-black ring-black divide-black from-black via-black to-black outline-black decoration-black placeholder:text-black hover:text-black hover:bg-black hover:border-black hover:to-black focus:text-black focus:bg-black focus-visible:ring-black group-hover:text-black data-[state=active]:text-black [&_svg]:text-black [&>svg]:text-black [&>div]:bg-black !text-black !text-base !leading-7 stroke-zinc-500/50` -> `text-black text-base leading-7 tracking-wide font-bold bg-black border-black ring-black divide-black from-black via-black to-black outline-black decoration-black placeholder:text-black hover:text-black hover:bg-black hover:border-black hover:to-black focus:text-black focus:bg-black focus-visible:ring-black group-hover:text-black data-[state=active]:text-black [&_svg]:text-black [&>svg]:text-black [&>div]:bg-black !text-black !text-base !leading-7 stroke-edge` at 1440px default leading-[30px] plain, 1440px default leading-[30px] profile-tabs, 1440px default leading-[1.5] plain, 1440px default leading-[1.5] profile-tabs (+44)
- FAIL with ring-2: `ring-slate-200 ring-2` -> `ring-node-border/60 ring-2` at 1440px default leading-[30px] plain, 1440px default leading-[30px] profile-tabs, 1440px default leading-[1.5] plain, 1440px default leading-[1.5] profile-tabs (+44)
- FAIL as written: `text-gray-400` -> `text-foreground-subtle` at 1440px default leading-[30px] plain, 1440px default leading-[30px] profile-tabs, 1440px default leading-[1.5] plain, 1440px default leading-[1.5] profile-tabs (+44)
