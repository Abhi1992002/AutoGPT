div: 
div: flex min-h-screen flex-col items-stretch justify-items-stretch supports-[min-height:100dvh]:min-h-dvh
div: group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar
div: group peer hidden text-sidebar-foreground md:block
div: relative w-[--sidebar-width] bg-transparent transition-[width] duration-200 ease-linear group-data-[collapsible=offcanvas]:w-0 group-data-[side=right]:rotate-180 group-data-[collapsible=icon]:w-[--sidebar-width-icon]
div: fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] duration-200 ease-linear md:flex left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)] group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l
div: flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow
div: flex min-h-0 flex-1 flex-col overflow-auto group-data-[collapsible=icon]:overflow-hidden scroll-py-16 gap-0 overflow-y-auto overflow-x-hidden overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] group-data-[collapsible=icon]:scroll-pt-24 group-data-[collapsible=icon]:overflow-y-auto [&::-webkit-scrollbar]:hidden
div: sticky top-0 z-10 mb-1 flex shrink-0 animate-fade-in flex-row items-center justify-between gap-2 bg-sidebar p-2 group-data-[collapsible=icon]:flex-col
div: relative flex items-center size-8 shrink-0
a: flex size-8 items-center justify-center group-focus-within:hidden group-hover:hidden
svg: size-7
g: 
path: 
path: 
path: 
path: 
path: 
path: 
path: 
defs: 
lineargradient: 
stop: 
stop: 
lineargradient: 
stop: 
stop: 
lineargradient: 
stop: 
stop: 
lineargradient: 
stop: 
stop: 
lineargradient: 
stop: 
stop: 
clippath: 
rect: 
button: size-8 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-surface-active max-md:size-10 absolute inset-0 hidden group-focus-within:flex group-hover:flex
svg: size-4 text-sidebar-foreground/90 group-data-[collapsible=icon]:size-4.5 max-md:size-5
path: 
path: 
path: 
div: flex shrink-0 items-center gap-1 group-data-[collapsible=icon]:flex-col
button: flex size-8 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-surface-active max-md:size-10
svg: size-4 text-sidebar-foreground/90 group-data-[collapsible=icon]:size-4.5 max-md:size-5
path: 
path: 
div: flex shrink-0 flex-col gap-2
div: 
div: relative flex w-full min-w-0 flex-col p-2 mt-0 py-1
div: w-full text-sm
ul: flex w-full min-w-0 flex-col gap-1 group-data-[collapsible=icon]:gap-1
li: group/menu-item relative
a: peer/menu-button flex w-full items-center gap-2 overflow-hidden text-left outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 [&>span:last-child]:truncate [&>svg]:shrink-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm h-auto rounded-xl p-2 pl-3 font-normal data-[active=true]:font-normal group-data-[collapsible=icon]:!p-1.5 hover:!bg-surface-hover [&>svg]:size-4 group-data-[collapsible=icon]:[&>svg]:size-4.5 max-md:gap-3 max-md:py-2.5 max-md:text-base max-md:[&>svg]:size-5 data-[active=true]:!bg-surface-active data-[active=true]:hover:!bg-surface-active
svg: size-4 text-sidebar-foreground/90 group-data-[collapsible=icon]:size-4.5
path: 
path: 
path: 
path: 
span: truncate
span: ml-auto flex items-center gap-0.5 opacity-0 group-hover/menu-item:opacity-100 group-data-[collapsible=icon]:hidden
kbd: rounded border border-border-strong bg-surface-muted px-1.5 py-1 font-sans text-[0.7rem] leading-none text-foreground-body
kbd: rounded border border-border-strong bg-surface-muted px-1.5 py-1 font-sans text-[0.7rem] leading-none text-foreground-body
kbd: rounded border border-border-strong bg-surface-muted px-1.5 py-1 font-sans text-[0.7rem] leading-none text-foreground-body
li: group/menu-item relative
a: peer/menu-button flex w-full items-center gap-2 overflow-hidden text-left outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 [&>span:last-child]:truncate [&>svg]:shrink-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm h-auto rounded-xl p-2 pl-3 font-normal data-[active=true]:font-normal group-data-[collapsible=icon]:!p-1.5 hover:!bg-surface-hover [&>svg]:size-4 group-data-[collapsible=icon]:[&>svg]:size-4.5 max-md:gap-3 max-md:py-2.5 max-md:text-base max-md:[&>svg]:size-5 data-[active=true]:!bg-surface-active data-[active=true]:hover:!bg-surface-active
svg: size-4 text-sidebar-foreground/90 group-data-[collapsible=icon]:size-4.5
path: 
path: 
path: 
span: truncate
li: group/menu-item relative
a: peer/menu-button flex w-full items-center gap-2 overflow-hidden text-left outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 [&>span:last-child]:truncate [&>svg]:shrink-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm h-auto rounded-xl p-2 pl-3 font-normal data-[active=true]:font-normal group-data-[collapsible=icon]:!p-1.5 hover:!bg-surface-hover [&>svg]:size-4 group-data-[collapsible=icon]:[&>svg]:size-4.5 max-md:gap-3 max-md:py-2.5 max-md:text-base max-md:[&>svg]:size-5 data-[active=true]:!bg-surface-active data-[active=true]:hover:!bg-surface-active
svg: size-4 text-sidebar-foreground/90 group-data-[collapsible=icon]:size-4.5
path: 
path: 
path: 
path: 
path: 
span: truncate
div: 
div: group/collapsible
div: relative flex w-full min-w-0 flex-col p-2 py-1
button: flex h-8 shrink-0 items-center rounded-md px-2 outline-none ring-sidebar-ring transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0 group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 text-body-sm font-medium leading-inherit text-foreground-tertiary group-data-[collapsible=icon]:hidden max-md:h-11 max-md:text-sm
svg: ease-[cubic-bezier(0.33,1,0.68,1)] ml-auto size-4 text-sidebar-foreground/90 transition-transform duration-200 group-data-[collapsible=icon]:size-4.5 group-data-[state=open]/collapsible:rotate-180 motion-reduce:transition-none max-md:size-5
path: 
div: overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down motion-reduce:animate-none
div: w-full text-sm
ul: flex w-full min-w-0 flex-col gap-1 group-data-[collapsible=icon]:gap-1
li: group/menu-item relative
a: peer/menu-button flex w-full items-center gap-2 overflow-hidden text-left outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 [&>span:last-child]:truncate [&>svg]:shrink-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm h-auto rounded-xl p-2 pl-3 font-normal data-[active=true]:font-normal group-data-[collapsible=icon]:!p-1.5 hover:!bg-surface-hover [&>svg]:size-4 group-data-[collapsible=icon]:[&>svg]:size-4.5 max-md:gap-3 max-md:py-2.5 max-md:text-base max-md:[&>svg]:size-5 data-[active=true]:!bg-surface-active data-[active=true]:hover:!bg-surface-active
svg: size-4 text-sidebar-foreground/90 group-data-[collapsible=icon]:size-4.5
path: 
path: 
path: 
path: 
span: truncate
li: group/menu-item relative
a: peer/menu-button flex w-full items-center gap-2 overflow-hidden text-left outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 [&>span:last-child]:truncate [&>svg]:shrink-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm h-auto rounded-xl p-2 pl-3 font-normal data-[active=true]:font-normal group-data-[collapsible=icon]:!p-1.5 hover:!bg-surface-hover [&>svg]:size-4 group-data-[collapsible=icon]:[&>svg]:size-4.5 max-md:gap-3 max-md:py-2.5 max-md:text-base max-md:[&>svg]:size-5 data-[active=true]:!bg-surface-active data-[active=true]:hover:!bg-surface-active
svg: size-4 text-sidebar-foreground/90 group-data-[collapsible=icon]:size-4.5
path: 
span: truncate
div: 
div: hidden group-data-[collapsible=icon]:block
div: relative flex w-full min-w-0 flex-col p-2 py-1
ul: flex w-full min-w-0 flex-col gap-1 group-data-[collapsible=icon]:gap-1
li: group/menu-item relative
button: peer/menu-button flex w-full items-center gap-2 overflow-hidden text-left outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 [&>span:last-child]:truncate [&>svg]:shrink-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm h-auto rounded-xl p-2 pl-3 font-normal data-[active=true]:font-normal group-data-[collapsible=icon]:!p-1.5 hover:!bg-surface-hover [&>svg]:size-4 group-data-[collapsible=icon]:[&>svg]:size-4.5 max-md:gap-3 max-md:py-2.5 max-md:text-base max-md:[&>svg]:size-5 data-[active=true]:!bg-surface-active data-[active=true]:hover:!bg-surface-active
svg: size-4 text-sidebar-foreground/90 group-data-[collapsible=icon]:size-4.5
path: 
path: 
span: truncate
div: group-data-[collapsible=icon]:hidden
div: group/collapsible
div: relative flex w-full min-w-0 flex-col p-2 py-1
button: flex h-8 shrink-0 items-center rounded-md px-2 outline-none ring-sidebar-ring transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0 group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 text-body-sm font-medium leading-inherit text-foreground-tertiary group-data-[collapsible=icon]:hidden max-md:h-11 max-md:text-sm
svg: ease-[cubic-bezier(0.33,1,0.68,1)] ml-auto size-4 text-sidebar-foreground/90 transition-transform duration-200 group-data-[collapsible=icon]:size-4.5 group-data-[state=open]/collapsible:rotate-180 motion-reduce:transition-none max-md:size-5
path: 
div: overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down motion-reduce:animate-none
div: w-full text-sm
p: px-2 py-2 text-sm text-neutral-500
div: flex flex-col gap-2 p-2 sticky bottom-0 z-10 mt-auto shrink-0 border-t border-separator bg-sidebar px-4
div: flex w-full items-center justify-between group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-1
div: 
button: flex cursor-pointer items-center space-x-3 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-neutral-300
div: relative flex shrink-0 overflow-hidden rounded-full h-8 w-8
span: absolute inset-0 flex items-center justify-center rounded-full bg-transparent text-lg text-neutral-600 [&>svg]:h-full [&>svg]:w-full
svg: 
mask: 
rect: 
g: 
rect: 
path: 
path: 
defs: 
filter: 
feflood: 
feblend: 
fegaussianblur: 
div: group-data-[collapsible=icon]:hidden
button: absolute inset-y-0 z-20 hidden transition-all ease-linear after:absolute after:inset-y-0 after:w-[2px] hover:after:bg-sidebar-border [[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize [[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar [[data-side=left][data-collapsible=offcanvas]_&]:-right-2 [[data-side=right][data-collapsible=offcanvas]_&]:-left-2 w-2 translate-x-0 after:left-0 group-data-[side=left]:-right-2 group-data-[side=right]:-left-2 group-data-[side=right]:after:left-auto group-data-[side=right]:after:right-0 sm:hidden md:flex
div: fixed bottom-4 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] transition-all duration-500 ease-out sm:bottom-6 sm:right-6 translate-y-0 opacity-100
div: rounded-2xl border border-border bg-background p-5 shadow-lg
div: flex items-start gap-3
div: flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground
svg: 
path: 
path: 
path: 
path: 
path: 
div: min-w-0 flex-1
p: font-sans text-body font-medium text-foreground
p: font-sans text-caption font-normal text-muted-foreground
button: inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus disabled:pointer-events-none font-sans leading-snug border bg-transparent border-transparent hover:bg-surface-muted hover:border-surface-muted disabled:text-surface-active disabled:opacity-1 size-8 min-w-0 rounded-lg p-0 -mr-1 -mt-1 text-muted-foreground hover:text-foreground
span: contents
svg: 
path: 
ul: my-4 space-y-1.5
li: flex items-start gap-2.5
span: mt-2.5 size-1 shrink-0 rounded-full bg-muted-foreground
p: font-sans text-body font-normal text-foreground
li: flex items-start gap-2.5
span: mt-2.5 size-1 shrink-0 rounded-full bg-muted-foreground
p: font-sans text-body font-normal text-foreground
li: flex items-start gap-2.5
span: mt-2.5 size-1 shrink-0 rounded-full bg-muted-foreground
p: font-sans text-body font-normal text-foreground
div: border-t border-border pt-3
a: font-sans text-body font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-info focus:ring-offset-2 rounded-sm inline-flex items-center gap-1.5 text-foreground
svg: 
path: 
main: relative flex w-full min-w-0 flex-1 flex-col dark:bg-neutral-950 md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow bg-[#f9f9f9]
header: flex shrink-0 items-center pb-4 pt-6 relative z-10 md:hidden
div: mx-auto flex w-full max-w-7xl items-center gap-2 px-6 md:px-8
div: pointer-events-auto md:hidden
button: inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 dark:focus-visible:ring-neutral-300 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-50 h-9 w-9 rounded-full border border-[#DADADC] bg-white shadow-md hover:bg-[#F5F5F6]
svg: !size-5
path: 
path: 
path: 
span: sr-only
section: flex-1
div: flex min-h-screen w-full max-w-[1360px] flex-col lg:flex-row
button: whitespace-nowrap overflow-hidden font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-neutral-300 font-sans tracking-tight text-neutral-800 dark:text-neutral-100 px-4 py-2 text-sm fixed left-4 top-4 z-50 flex h-14 w-14 items-center justify-center rounded-lg border border-neutral-500 bg-neutral-200 hover:bg-gray-200/50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-gray-700/50 md:block lg:hidden
svg: lucide lucide-menu h-8 w-8 stroke-black dark:stroke-white
path: 
path: 
path: 
span: sr-only
div: relative hidden h-[912px] w-[234px] border-none lg:block
div: h-full w-full rounded-2xl bg-zinc-200 dark:bg-zinc-800
div: inline-flex h-[264px] flex-col items-start justify-start gap-6 p-3
a: inline-flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-neutral-800 hover:bg-neutral-800 hover:text-white dark:text-neutral-200 dark:hover:bg-neutral-700 dark:hover:text-white
svg: size-5
path: 
path: 
path: 
div: p-ui-medium text-base font-medium leading-normal
a: inline-flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-neutral-800 hover:bg-neutral-800 hover:text-white dark:text-neutral-200 dark:hover:bg-neutral-700 dark:hover:text-white
svg: size-5
path: 
path: 
path: 
div: p-ui-medium text-base font-medium leading-normal
a: inline-flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-neutral-800 hover:bg-neutral-800 hover:text-white dark:text-neutral-200 dark:hover:bg-neutral-700 dark:hover:text-white
svg: size-5
path: 
path: 
path: 
path: 
path: 
div: p-ui-medium text-base font-medium leading-normal
a: inline-flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-neutral-800 hover:bg-neutral-800 hover:text-white dark:text-neutral-200 dark:hover:bg-neutral-700 dark:hover:text-white
svg: size-5
path: 
path: 
path: 
path: 
path: 
path: 
path: 
path: 
path: 
div: p-ui-medium text-base font-medium leading-normal
a: inline-flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-neutral-800 hover:bg-neutral-800 hover:text-white dark:text-neutral-200 dark:hover:bg-neutral-700 dark:hover:text-white
svg: size-5
path: 
path: 
div: p-ui-medium text-base font-medium leading-normal
a: inline-flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-neutral-800 hover:bg-neutral-800 hover:text-white dark:text-neutral-200 dark:hover:bg-neutral-700 dark:hover:text-white
svg: size-5
path: 
path: 
path: 
div: p-ui-medium text-base font-medium leading-normal
div: flex-1 pl-4
div: container max-w-2xl space-y-6 py-10
div: flex flex-col gap-2
h3: font-poppins text-heading font-medium text-foreground-base tracking-[-0.01313rem]
p: font-sans text-body-lg font-normal text-foreground-base
div: flex flex-col gap-8
div: 
h3: font-sans text-body-lg font-semibold text-foreground-base
form: mt-4 flex flex-col gap-0
div: space-y-2
div: flex w-full flex-col gap-2
div: flex items-center justify-between gap-2
div: flex items-center gap-1
label: 
span: font-sans text-body-lg font-medium text-foreground-base
div: relative mb-6 w-full
div: relative w-full
input: agpt-border-input agpt-shadow-input flex transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-gray-400 rounded-xl border border-border-base bg-surface px-4 shadow-none font-normal text-foreground-base placeholder:font-normal placeholder:text-placeholder focus:border-purple-400 focus:shadow-none focus:outline-none focus:ring-1 focus:ring-purple-400 focus:ring-offset-0 w-full h-9 py-2 text-body placeholder:text-body
span: font-sans text-caption font-medium text-error absolute left-0 top-full mt-1 transition-opacity duration-200 opacity-0
div: flex items-center gap-4
a: inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus disabled:pointer-events-none font-sans border bg-transparent border-[#a6a6a6] text-foreground-base hover:bg-surface-hover hover:border-[#a6a6a6] rounded-full disabled:border-border-base disabled:text-surface-active disabled:opacity-1 px-3 py-2 text-body leading-5 gap-1.5 h-9 min-w-[10rem]
span: contents
button: inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus disabled:pointer-events-none font-sans border bg-action border-action text-action-foreground hover:bg-action-hover hover:border-action-hover rounded-full disabled:text-action-foreground disabled:bg-surface-active disabled:border-border-base disabled:opacity-1 px-3 py-2 text-body leading-5 gap-1.5 h-9 min-w-[10rem]
span: contents
div: shrink-0 bg-neutral-200 dark:bg-neutral-800 h-[1px] w-full
div: agpt-card text-neutral-950
div: flex flex-col space-y-1.5 p-6
h3: font-semibold leading-none tracking-tight
div: p-6 pt-0
form: space-y-6
div: space-y-2
label: text-body font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70
button: agpt-border-input agpt-shadow-input flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border bg-transparent px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 data-[state=open]:border-gray-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-neutral-400 [&>span]:line-clamp-1
span: 
svg: h-4 w-4 opacity-50
path: 
select: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
option: 
button: inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus disabled:pointer-events-none font-sans border bg-action border-action text-action-foreground hover:bg-action-hover hover:border-action-hover rounded-full disabled:text-action-foreground disabled:bg-surface-active disabled:border-border-base disabled:opacity-1 px-3 py-2 text-body leading-5 gap-1.5 h-9 min-w-[5.5rem]
span: contents
div: shrink-0 bg-neutral-200 dark:bg-neutral-800 h-[1px] w-full
div: 
h3: font-sans text-body-lg font-semibold text-foreground-base
p: font-sans text-body font-normal mt-2 text-slate-400
form: mt-6 flex flex-col gap-10
div: flex flex-col gap-6
div: space-y-2 flex flex-col gap-2
div: space-y-0.5
h4: font-sans text-body font-medium text-foreground-base
p: font-sans text-body font-normal text-foreground-base
div: relative mb-6
button: agpt-border-input agpt-shadow-input flex items-center justify-between whitespace-nowrap ring-offset-white placeholder:text-neutral-500 data-[state=open]:border-gray-400 disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-neutral-400 [&>span]:line-clamp-1 rounded-xl border border-border-base bg-surface px-4 shadow-none font-normal text-foreground-base w-full placeholder:font-normal !placeholder:text-placeholder focus:border-foreground-subtle focus:shadow-none focus:outline-none focus:ring-1 focus:ring-foreground-subtle focus:ring-offset-0 h-[2.875rem] py-2.5 text-body leading-5 [&[data-placeholder]>span]:text-foreground-subtle [&[data-placeholder]>span]:font-normal
span: 
div: flex items-center gap-2
span: 
svg: h-4 w-4 opacity-50
path: 
select: 
option: 
option: 
option: 
option: 
span: font-sans text-caption font-medium text-error absolute left-0 top-full mt-1 transition-opacity duration-200 opacity-0
div: space-y-2 flex flex-row items-center justify-between
div: space-y-0.5
h4: font-sans text-body font-medium text-foreground-base
p: font-sans text-body font-normal text-foreground-base
button: peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors data-[state=checked]:bg-neutral-900 data-[state=unchecked]:bg-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 dark:data-[state=checked]:bg-neutral-50 dark:data-[state=unchecked]:bg-neutral-800 dark:focus-visible:ring-neutral-300 dark:focus-visible:ring-offset-neutral-950
span: pointer-events-none block h-4 w-4 rounded-full bg-surface shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0 dark:bg-neutral-950
input: 
div: space-y-2 flex flex-row items-center justify-between
div: space-y-0.5
h4: font-sans text-body font-medium text-foreground-base
p: font-sans text-body font-normal text-foreground-base
button: peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors data-[state=checked]:bg-neutral-900 data-[state=unchecked]:bg-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 dark:data-[state=checked]:bg-neutral-50 dark:data-[state=unchecked]:bg-neutral-800 dark:focus-visible:ring-neutral-300 dark:focus-visible:ring-offset-neutral-950
span: pointer-events-none block h-4 w-4 rounded-full bg-surface shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0 dark:bg-neutral-950
input: 
div: flex justify-end gap-4 pt-8
button: inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus disabled:pointer-events-none font-sans border bg-transparent border-[#a6a6a6] text-foreground-base hover:bg-surface-hover hover:border-[#a6a6a6] rounded-full disabled:border-border-base disabled:text-surface-active disabled:opacity-1 px-4 py-2.5 text-body leading-5 gap-2 h-[2.875rem] min-w-[10rem]
span: contents
button: inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus disabled:pointer-events-none font-sans border bg-action border-action text-action-foreground hover:bg-action-hover hover:border-action-hover rounded-full disabled:text-action-foreground disabled:bg-surface-active disabled:border-border-base disabled:opacity-1 px-4 py-2.5 text-body leading-5 gap-2 h-[2.875rem] min-w-[10rem]
span: contents
section: 
title: 
meta: 
link: 
meta: 
meta: 
meta: 
meta: 
meta: 
meta: 
meta: 