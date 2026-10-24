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
div: relative h-full w-full
div: flex h-full w-full dark:bg-slate-900
div: relative flex-1
div: react-flow light
div: react-flow__renderer
div: react-flow__pane draggable
div: react-flow__viewport xyflow__viewport react-flow__container
div: react-flow__edges
svg: react-flow__marker
defs: 
marker: react-flow__arrowhead
polyline: arrowclosed
svg: 
g: react-flow__edge react-flow__edge-custom nopan selectable
path: react-flow__edge-interaction cursor-pointer
path: react-flow__edge-path !stroke-[1.5px] [stroke-dasharray:6] stroke-zinc-500/50 hover:stroke-zinc-500
svg: 
g: react-flow__edge react-flow__edge-custom nopan selectable
path: react-flow__edge-interaction cursor-pointer
path: react-flow__edge-path !stroke-[1.5px] [stroke-dasharray:6] stroke-zinc-500/50 hover:stroke-zinc-500
div: react-flow__edgelabel-renderer
button: inline-flex items-center justify-center whitespace-nowrap font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus disabled:pointer-events-none font-sans border bg-surface border-border-base text-foreground-emphasis shadow-sm hover:bg-surface-muted hover:border-border-strong rounded-full disabled:text-foreground-disabled disabled:bg-surface-muted disabled:border-separator disabled:shadow-none disabled:opacity-1 text-body leading-5 gap-2 absolute h-fit min-w-0 p-1 transition-opacity opacity-0
span: contents
svg: h-3 w-3
path: 
button: inline-flex items-center justify-center whitespace-nowrap font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus disabled:pointer-events-none font-sans border bg-surface border-border-base text-foreground-emphasis shadow-sm hover:bg-surface-muted hover:border-border-strong rounded-full disabled:text-foreground-disabled disabled:bg-surface-muted disabled:border-separator disabled:shadow-none disabled:opacity-1 text-body leading-5 gap-2 absolute h-fit min-w-0 p-1 transition-opacity opacity-0
span: contents
svg: h-3 w-3
path: 
div: react-flow__nodes
div: react-flow__node react-flow__node-custom nopan selectable draggable
div: 
div: z-12 w-[350px] rounded-xlarge ring-1 ring-slate-200/60
div: rounded-xlarge bg-white
div: flex h-auto flex-col gap-1 rounded-xlarge border-b border-zinc-200 bg-gradient-to-r from-slate-50/80 to-white/90 px-4 py-4 pt-3
div: flex items-start justify-between gap-2
div: flex min-w-0 flex-1 items-center gap-2
div: flex w-fit min-w-0 flex-1 items-center hover:cursor-pointer
div: 
p: font-sans text-body-lg font-semibold text-foreground-base line-clamp-1 hover:cursor-text
div: flex items-center gap-2
p: font-sans text-caption font-normal text-foreground-base shrink-0 !font-medium !text-slate-500
button: py-2
svg: 
path: 
div: flex flex-wrap items-center gap-2
div: inline-flex items-center px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 dark:border-neutral-800 dark:focus:ring-neutral-300 cursor-default dark:bg-neutral-50 dark:text-neutral-900 rounded-full border border-slate-500 bg-slate-100 text-black shadow-none
div: inline-flex items-center px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 dark:border-neutral-800 dark:focus:ring-neutral-300 cursor-default dark:bg-neutral-50 dark:text-neutral-900 rounded-full border border-slate-500 bg-slate-100 text-black shadow-none
div: bg-white px-4
div: mt-4
form: rjsf
div: rjsf-field rjsf-field-object
div: flex flex-col gap-2
div: flex items-center gap-2
div: flex items-center gap-2
div: flex flex-col
div:  flex
div: w-full
div: rjsf-field rjsf-field-string
div: flex flex-col gap-2
div: flex items-center gap-2
div: flex items-center
p: font-sans text-body font-normal text-foreground-base line-clamp-1
p: font-sans text-caption font-normal mr-1 text-error
p: font-sans text-caption font-normal text-foreground-base ml-2 !text-green-500
span: 
div: 0 inline w-fit
svg: cursor-pointer
circle: 
path: 
path: 
div: nodrag relative flex items-center gap-2
div: relative w-full mb-0 flex-1
div: relative w-full mb-0 flex-1
input: agpt-border-input agpt-shadow-input flex transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-gray-400 rounded-xl border border-border-base bg-surface px-4 shadow-none w-full font-normal text-foreground-base placeholder:font-normal placeholder:text-placeholder focus:border-purple-400 focus:shadow-none focus:outline-none focus:ring-1 focus:ring-purple-400 focus:ring-offset-0 pr-8 h-9 py-2 text-body placeholder:text-body
span: font-sans text-caption font-medium text-error absolute left-0 top-full mt-1 transition-opacity duration-200 opacity-0
button: inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus disabled:pointer-events-none font-sans leading-snug border min-w-[7.7rem] bg-transparent border-transparent text-foreground-base hover:bg-surface-muted hover:border-surface-muted rounded-full disabled:text-surface-active disabled:opacity-1 !min-w-0 p-1
span: contents
svg: size-4
path: 
path: 
path: 
path: 
path: 
path: 
path: 
path: 
span: sr-only
div: 
div:  flex
div: w-full
div:  flex
div: w-full
div:  flex
div: w-full
div:  flex
div: w-full
div: 
div: flex items-center justify-start gap-2 bg-white px-5 pb-3.5
button: inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus disabled:pointer-events-none font-sans border bg-transparent border-transparent text-foreground-base rounded-full disabled:text-surface-active disabled:opacity-1 text-body leading-5 gap-2 h-fit min-w-0 p-0 hover:border-transparent hover:bg-transparent
span: contents
span: font-sans text-body font-normal flex items-center gap-2 !font-semibold text-slate-700
svg: transition-transform 
path: 
div: flex flex-col items-end justify-between gap-2 rounded-b-xlarge border-t border-zinc-200 bg-white py-3.5
button: inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus disabled:pointer-events-none font-sans border bg-transparent border-transparent text-foreground-base rounded-full disabled:text-surface-active disabled:opacity-1 text-body leading-5 gap-2 mr-4 h-fit min-w-0 p-0 hover:border-transparent hover:bg-transparent
span: contents
p: font-sans text-body font-normal flex items-center gap-2 !font-semibold text-slate-700
svg: transition-transform rotate-180
path: 
div: flex flex-col items-end gap-2
div: flex flex-col items-end gap-2
div: relative flex items-center gap-2
span: 
svg: 
circle: 
path: 
path: 
p: font-sans text-body font-normal text-slate-700
span: font-sans text-caption font-normal text-foreground-base !text-gray-500
div: react-flow__handle react-flow__handle-right nodrag nopan -mr-2 ml-2 source connectable connectablestart connectableend connectionindicator
div: pointer-events-none
svg: text-gray-400 opacity-100
circle: 
div: react-flow__node react-flow__node-custom nopan selectable draggable
div: 
div: z-12 w-[350px] rounded-xlarge ring-1 ring-slate-200/60
div: rounded-xlarge bg-white
div: flex h-auto flex-col gap-1 rounded-xlarge border-b border-zinc-200 bg-gradient-to-r from-slate-50/80 to-white/90 px-4 py-4 pt-3
div: flex items-start justify-between gap-2
div: flex min-w-0 flex-1 items-center gap-2
div: flex w-fit min-w-0 flex-1 items-center hover:cursor-pointer
div: 
p: font-sans text-body-lg font-semibold text-foreground-base line-clamp-1 hover:cursor-text
div: flex items-center gap-2
p: font-sans text-caption font-normal text-foreground-base shrink-0 !font-medium !text-slate-500
button: py-2
svg: 
path: 
div: flex flex-wrap items-center gap-2
div: inline-flex items-center px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 dark:border-neutral-800 dark:focus:ring-neutral-300 cursor-default dark:bg-neutral-50 dark:text-neutral-900 rounded-full border border-slate-500 bg-slate-100 text-black shadow-none
div: bg-white px-4
div: mt-4
form: rjsf
div: rjsf-field rjsf-field-object
div: flex flex-col gap-2
div: flex items-center gap-2
div: flex items-center gap-2
div: flex flex-col
div:  flex
div: w-full
div: rjsf-field rjsf-field-undefined
div: flex flex-col gap-2
div: 
div: flex items-center gap-2
div: flex items-center
div: react-flow__handle react-flow__handle-left nodrag nopan -ml-6 mr-2 target connectable connectablestart connectableend connectionindicator
div: pointer-events-none
svg: text-gray-400 opacity-100
circle: 
p: font-sans text-body font-normal text-foreground-base line-clamp-1
p: font-sans text-caption font-normal mr-1 text-error
p: font-sans text-caption font-normal text-foreground-body !text-gray-500
div: 0 inline w-fit
svg: cursor-pointer
circle: 
path: 
path: 
span: sr-only
div: 
div:  flex
div: w-full
div: 
div: flex items-center justify-start gap-2 bg-white px-5 pb-3.5
button: inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus disabled:pointer-events-none font-sans border bg-transparent border-transparent text-foreground-base rounded-full disabled:text-surface-active disabled:opacity-1 text-body leading-5 gap-2 h-fit min-w-0 p-0 hover:border-transparent hover:bg-transparent
span: contents
span: font-sans text-body font-normal flex items-center gap-2 !font-semibold text-slate-700
svg: transition-transform 
path: 
div: flex flex-col items-end justify-between gap-2 rounded-b-xlarge border-t border-zinc-200 bg-white py-3.5
button: inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus disabled:pointer-events-none font-sans border bg-transparent border-transparent text-foreground-base rounded-full disabled:text-surface-active disabled:opacity-1 text-body leading-5 gap-2 mr-4 h-fit min-w-0 p-0 hover:border-transparent hover:bg-transparent
span: contents
p: font-sans text-body font-normal flex items-center gap-2 !font-semibold text-slate-700
svg: transition-transform rotate-180
path: 
div: flex flex-col items-end gap-2
div: flex flex-col items-end gap-2
div: relative flex items-center gap-2
span: 
svg: 
circle: 
path: 
path: 
p: font-sans text-body font-normal text-slate-700
span: font-sans text-caption font-normal text-foreground-base !text-green-500
div: react-flow__handle react-flow__handle-right nodrag nopan -mr-2 ml-2 source connectable connectablestart connectableend connectionindicator
div: pointer-events-none
svg: text-gray-400 opacity-100
circle: 
div: flex flex-col items-end gap-2
div: relative flex items-center gap-2
span: 
svg: 
circle: 
path: 
path: 
p: font-sans text-body font-normal text-slate-700
span: font-sans text-caption font-normal text-foreground-base !text-gray-500
div: react-flow__handle react-flow__handle-right nodrag nopan -mr-2 ml-2 source connectable connectablestart connectableend connectionindicator
div: pointer-events-none
svg: text-gray-400 opacity-100
circle: 
div: react-flow__node react-flow__node-custom nopan selectable draggable
div: 
div: z-12 w-[350px] rounded-xlarge ring-1 ring-slate-200/60
div: rounded-xlarge bg-white
div: flex h-auto flex-col gap-1 rounded-xlarge border-b border-zinc-200 bg-gradient-to-r from-slate-50/80 to-white/90 px-4 py-4 pt-3
div: flex items-start justify-between gap-2
div: flex min-w-0 flex-1 items-center gap-2
div: flex w-fit min-w-0 flex-1 items-center hover:cursor-pointer
div: 
p: font-sans text-body-lg font-semibold text-foreground-base line-clamp-1 hover:cursor-text
div: flex items-center gap-2
p: font-sans text-caption font-normal text-foreground-base shrink-0 !font-medium !text-slate-500
button: py-2
svg: 
path: 
div: flex flex-wrap items-center gap-2
div: inline-flex items-center px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 dark:border-neutral-800 dark:focus:ring-neutral-300 cursor-default dark:bg-neutral-50 dark:text-neutral-900 rounded-full border border-slate-500 bg-slate-100 text-black shadow-none
div: inline-flex items-center px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 dark:border-neutral-800 dark:focus:ring-neutral-300 cursor-default dark:bg-neutral-50 dark:text-neutral-900 rounded-full border border-slate-500 bg-slate-100 text-black shadow-none
div: bg-white px-4
div: mt-4
form: rjsf
div: rjsf-field rjsf-field-object
div: flex flex-col gap-2
div: flex items-center gap-2
div: flex items-center gap-2
div: flex flex-col
div:  flex
div: w-full
div: rjsf-field rjsf-field-undefined
div: flex flex-col gap-2
div: 
div: flex items-center gap-2
div: flex items-center
div: react-flow__handle react-flow__handle-left nodrag nopan -ml-6 mr-2 target connectable connectablestart connectableend connectionindicator
div: pointer-events-none
svg: text-gray-400 opacity-100
circle: 
p: font-sans text-body font-normal text-foreground-base line-clamp-1
p: font-sans text-caption font-normal mr-1 text-error
p: font-sans text-caption font-normal text-foreground-body !text-gray-500
div: 0 inline w-fit
svg: cursor-pointer
circle: 
path: 
path: 
span: sr-only
div: 
div:  flex
div: w-full
div: rjsf-field rjsf-field-string
div: flex flex-col gap-2
div: flex items-center gap-2
div: flex items-center
div: react-flow__handle react-flow__handle-left nodrag nopan -ml-6 mr-2 target connectable connectablestart connectableend connectionindicator
div: pointer-events-none
svg: text-gray-400 opacity-100
circle: 
p: font-sans text-body font-normal text-foreground-base line-clamp-1
p: font-sans text-caption font-normal mr-1 text-error
p: font-sans text-caption font-normal text-foreground-base ml-2 !text-green-500
span: 
div: 0 inline w-fit
svg: cursor-pointer
circle: 
path: 
path: 
div: nodrag relative flex items-center gap-2
div: relative w-full mb-0 flex-1
div: relative w-full mb-0 flex-1
input: agpt-border-input agpt-shadow-input flex transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-gray-400 rounded-xl border border-border-base bg-surface px-4 shadow-none w-full font-normal text-foreground-base placeholder:font-normal placeholder:text-placeholder focus:border-purple-400 focus:shadow-none focus:outline-none focus:ring-1 focus:ring-purple-400 focus:ring-offset-0 pr-8 h-9 py-2 text-body placeholder:text-body
span: font-sans text-caption font-medium text-error absolute left-0 top-full mt-1 transition-opacity duration-200 opacity-0
button: inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus disabled:pointer-events-none font-sans leading-snug border min-w-[7.7rem] bg-transparent border-transparent text-foreground-base hover:bg-surface-muted hover:border-surface-muted rounded-full disabled:text-surface-active disabled:opacity-1 !min-w-0 p-1
span: contents
svg: size-4
path: 
path: 
path: 
path: 
path: 
path: 
path: 
path: 
span: sr-only
div: 
div:  flex
div: w-full
div:  flex
div: w-full
div:  flex
div: w-full
div:  flex
div: w-full
div:  flex
div: w-full
div: 
div: flex items-center justify-start gap-2 bg-white px-5 pb-3.5 rounded-b-xlarge
button: inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus disabled:pointer-events-none font-sans border bg-transparent border-transparent text-foreground-base rounded-full disabled:text-surface-active disabled:opacity-1 text-body leading-5 gap-2 h-fit min-w-0 p-0 hover:border-transparent hover:bg-transparent
span: contents
span: font-sans text-body font-normal flex items-center gap-2 !font-semibold text-slate-700
svg: transition-transform 
path: 
div: react-flow__viewport-portal
svg: react-flow__background
pattern: 
circle: react-flow__background-pattern dots
rect: 
div: absolute bottom-4 left-4 z-10 flex flex-col items-center gap-2 rounded-full bg-white px-1 py-2 shadow-lg
button: inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus disabled:pointer-events-none font-sans bg-surface text-foreground-emphasis border border-border-base shadow-sm hover:bg-surface-muted hover:border-border-strong rounded-[96px] disabled:shadow-none disabled:opacity-1 !min-w-0 px-3 py-2 text-body leading-5 gap-1.5 min-w-[5.5rem] h-10 w-10 border-none
span: contents
svg: size-3.5 text-zinc-600
path: 
span: sr-only
button: inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus disabled:pointer-events-none font-sans bg-surface text-foreground-emphasis border border-border-base shadow-sm hover:bg-surface-muted hover:border-border-strong rounded-[96px] disabled:shadow-none disabled:opacity-1 !min-w-0 px-3 py-2 text-body leading-5 gap-1.5 min-w-[5.5rem] h-10 w-10 border-none
span: contents
svg: size-3.5 text-zinc-600
path: 
span: sr-only
button: inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus disabled:pointer-events-none font-sans text-foreground-emphasis border border-border-base shadow-sm hover:bg-surface-muted hover:border-border-strong rounded-[96px] disabled:shadow-none disabled:opacity-1 !min-w-0 px-3 py-2 text-body leading-5 gap-1.5 min-w-[5.5rem] h-10 w-10 border-none bg-white
span: contents
svg: size-3.5 text-zinc-600
path: 
path: 
path: 
span: sr-only
button: inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus disabled:pointer-events-none font-sans bg-surface text-foreground-emphasis border border-border-base shadow-sm hover:bg-surface-muted hover:border-border-strong rounded-[96px] disabled:shadow-none disabled:opacity-1 !min-w-0 px-3 py-2 text-body leading-5 gap-1.5 min-w-[5.5rem] h-10 w-10 border-none
span: contents
svg: size-3.5 text-zinc-600
path: 
span: sr-only
button: inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus disabled:pointer-events-none font-sans text-foreground-emphasis border border-border-base shadow-sm hover:bg-surface-muted hover:border-border-strong rounded-[96px] disabled:shadow-none disabled:opacity-1 !min-w-0 px-3 py-2 text-body leading-5 gap-1.5 min-w-[5.5rem] h-10 w-10 border-none bg-white
span: contents
svg: lucide lucide-lock-open size-3.5 text-zinc-600
rect: 
path: 
span: sr-only
section: absolute left-4 top-10 z-10 overflow-hidden rounded-[1rem] border-none bg-white p-0 shadow-[0_1px_5px_0_rgba(0,0,0,0.1)]
div: flex flex-col items-center justify-center rounded-[1rem] p-0
button: hover:cursor-pointer
div: flex w-auto items-center justify-center whitespace-normal bg-white px-4 py-4 text-zinc-800 shadow-none hover:cursor-pointer hover:bg-zinc-100 hover:text-zinc-950 focus:ring-0 rounded-none
svg: size-5
path: 
path: 
path: 
div: shrink-0 bg-neutral-200 dark:bg-neutral-800 h-[1px] w-full text-[#E1E1E1]
div: flex w-auto items-center justify-center whitespace-normal bg-white px-4 py-4 text-zinc-800 shadow-none hover:bg-zinc-100 hover:text-zinc-950 focus:ring-0 hover:cursor-pointer rounded-none
svg: size-5
path: 
path: 
div: shrink-0 bg-neutral-200 dark:bg-neutral-800 h-[1px] w-full text-[#E1E1E1]
div: flex w-auto items-center justify-center whitespace-normal bg-white px-4 py-4 text-zinc-800 shadow-none hover:cursor-pointer hover:bg-zinc-100 hover:text-zinc-950 focus:ring-0 rounded-none
svg: size-5
path: 
path: 
path: 
div: shrink-0 bg-neutral-200 dark:bg-neutral-800 h-[1px] w-full text-[#E1E1E1]
button: flex w-auto items-center justify-center whitespace-normal bg-white px-4 py-4 text-zinc-800 shadow-none hover:bg-zinc-100 hover:text-zinc-950 focus:ring-0 cursor-not-allowed opacity-50 hover:cursor-not-allowed
svg: size-5
path: 
path: 
div: shrink-0 bg-neutral-200 dark:bg-neutral-800 h-[1px] w-full text-[#E1E1E1]
button: flex w-auto items-center justify-center whitespace-normal bg-white px-4 py-4 text-zinc-800 shadow-none hover:bg-zinc-100 hover:text-zinc-950 focus:ring-0 cursor-not-allowed opacity-50 hover:cursor-not-allowed
svg: size-5
path: 
path: 
div: absolute bottom-4 left-[50%] z-[100] flex -translate-x-1/2 items-center gap-4 rounded-full bg-white p-2 px-2 shadow-lg
button: inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus disabled:pointer-events-none font-sans leading-snug border min-w-[7.7rem] bg-transparent border-[#a6a6a6] text-foreground-base hover:bg-surface-hover hover:border-[#a6a6a6] rounded-full disabled:border-border-base disabled:text-surface-active disabled:opacity-1 p-3 !min-w-0
span: contents
svg: size-4
path: 
path: 
button: inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus disabled:pointer-events-none font-sans leading-snug border min-w-[7.7rem] bg-transparent border-transparent hover:border-surface-muted rounded-full disabled:text-surface-active disabled:opacity-1 p-3 !min-w-0 group text-amber-600 hover:bg-amber-50 hover:text-amber-700
span: contents
svg: size-4 transition-transform duration-200 ease-out group-hover:scale-110
path: 
path: 
path: 
button: inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus disabled:pointer-events-none font-sans leading-snug border min-w-[7.7rem] bg-action border-action text-action-foreground hover:bg-action-hover hover:border-action-hover rounded-full disabled:text-action-foreground disabled:bg-surface-active disabled:border-border-base disabled:opacity-1 p-3 !min-w-0 group
span: contents
svg: size-4 transition-transform duration-200 ease-out group-hover:scale-110
path: 
button: inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus disabled:pointer-events-none font-sans leading-snug border min-w-[7.7rem] bg-transparent border-[#a6a6a6] text-foreground-base hover:bg-surface-hover hover:border-[#a6a6a6] rounded-full disabled:border-border-base disabled:text-surface-active disabled:opacity-1 p-3 !min-w-0
span: contents
svg: size-4
circle: 
path: 
button: inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus disabled:pointer-events-none font-sans leading-snug border min-w-[7.7rem] bg-transparent border-[#a6a6a6] text-foreground-base hover:bg-surface-hover hover:border-[#a6a6a6] rounded-full disabled:border-border-base disabled:text-surface-active disabled:opacity-1 p-3 !min-w-0
span: contents
svg: size-4
path: 
path: 
div: react-flow__panel react-flow__attribution bottom right
a: 
div: 
div: 
div: 
div: pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2
button: pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50
svg: 
path: 
path: 
section: 