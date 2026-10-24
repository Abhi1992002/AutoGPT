import { renderToStaticMarkup } from "react-dom/server";
import { CheckIcon } from "@radix-ui/react-icons";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
const radix = renderToStaticMarkup(<CheckIcon className="h-4 w-4" />);
const huge = renderToStaticMarkup(<Icon icon={Tick02Icon} className="h-4 w-4" />);
console.log(JSON.stringify({ radix, huge }));
