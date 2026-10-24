1 unique class strings (1 occurrences), 9 cases (as written, cn() contexts), 432 measurements (2 widths x 6 states x 2 parent line-heights x plain/profile-tabs): 0 failing cases

| # | old class string | new class string | value of the new class (computed, 16px root, in a leading-[30px] parent, 1440px, variant stripped, with the ring/divide/gradient helper that makes a colour visible) | result |
| --- | --- | --- | --- | --- |
| 1 | `text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70` | `text-body font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70` | color: rgb(1, 2, 3); font-size: 14px; line-height: 14px | identical (432 measurements) |

### cn()-merged on the real element

| element | old merged class string | new merged class string | font-size · line-height · color (in a leading-[30px] parent, 1440px) | result |
| --- | --- | --- | --- | --- |
| `<Label className="">` | `text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70` | `text-body font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70` | 14px · 14px · rgb(1, 2, 3) | identical (48 measurements) |
| `<Label className="text-base font-semibold">` | `peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-base font-semibold` | `peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-base font-semibold` | 16px · 24px · rgb(1, 2, 3) | identical (48 measurements) |
| `<Label className="mt-1 block text-sm text-gray-600">` | `font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mt-1 block text-sm text-gray-600` | `font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mt-1 block text-sm text-gray-600` | 14px · 20px · rgb(75, 85, 99) | identical (48 measurements) |
| `<Label className="text-base font-medium">` | `peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-base font-medium` | `peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-base font-medium` | 16px · 24px · rgb(1, 2, 3) | identical (48 measurements) |
| `<Label className="pt-2">` | `text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 pt-2` | `text-body font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 pt-2` | 14px · 14px · rgb(1, 2, 3) | identical (48 measurements) |
| `<Label className="text-sm">` | `font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm` | `font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm` | 14px · 20px · rgb(1, 2, 3) | identical (48 measurements) |
| `<Label className="text-red-500 dark:text-red-900">` | `text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-red-500 dark:text-red-900` | `text-body font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-red-500 dark:text-red-900` | 14px · 14px · rgb(239, 68, 68) | identical (48 measurements) |


