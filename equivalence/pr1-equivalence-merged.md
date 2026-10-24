| element | old merged class string | new merged class string | font-size · line-height · color (in a leading-[30px] parent, 1440px) | result |
| --- | --- | --- | --- | --- |
| `<Text variant="body">` | `font-sans text-body font-normal text-red-500 line-through` | `font-sans text-body font-normal text-error line-through` | 14px · 22px · rgb(239, 68, 68) | identical (48 measurements) |
| `<Text variant="small">` | `font-sans text-caption font-normal text-foreground-base !text-red-500 line-through` | `font-sans text-caption font-normal text-foreground-base !text-error line-through` | 12px · 18px · rgb(239, 68, 68) | identical (48 measurements) |
