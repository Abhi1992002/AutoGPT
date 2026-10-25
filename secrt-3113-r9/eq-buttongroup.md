| case | result |
| --- | --- |
| MessageBranchSelector group + MessageBranchPage text (the only use) | identical (every computed property, 5 parents x 2 widths, rest + hover) |
| ButtonGroupText with no caller class | identical (every computed property, 5 parents x 2 widths, rest + hover) |
| NEGATIVE CONTROL: Text body-medium (22px) instead of body-medium-tight | control FAILS as expected (16) |

2 cases (+1 negative control), 127440 property comparisons: 0 failing; control caught: true

```
old group: flex w-fit items-stretch has-[>[data-slot=button-group]]:gap-2 [&>*]:focus-visible:relative [&>*]:focus-visible:z-10 has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-md [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1 [&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none
new group: flex w-fit items-stretch has-[>[data-slot=button-group]]:gap-2 [&>*]:focus-visible:relative [&>*]:focus-visible:z-10 has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-md [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1 [&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none
old text:  shadow-xs flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-100 px-4 text-sm font-medium dark:border-neutral-800 dark:bg-neutral-800 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none
new text:  font-sans text-body font-medium leading-5 text-inherit shadow-xs flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-100 px-4 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none (Text body-medium-tight + tone inherit + className)
```
