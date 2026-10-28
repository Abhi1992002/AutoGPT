import { Button } from "../../design-system/components/button";
import { ArrowRightIcon, PlusIcon, TrashIcon } from "../icons";
import { Row } from "./Row";
import { Block } from "./Block";

const variants = ["primary", "secondary", "ghost", "destructive"] as const;
const sizes = ["sm", "md", "lg"] as const;

export function ButtonBlock() {
  return (
    <Block source="affectui" title="Button" description="Primary, secondary, ghost and destructive buttons with icons, sizes and a shimmering loading state.">
      <Row label="Variants">
        {variants.map((variant) => (
          <Button key={variant} variant={variant}>
            {variant[0].toUpperCase() + variant.slice(1)}
          </Button>
        ))}
      </Row>
      {sizes.map((size) => (
        <Row key={size} label={`Size ${size}`}>
          {variants.map((variant) => (
            <Button key={variant} variant={variant} size={size}>
              {variant[0].toUpperCase() + variant.slice(1)}
            </Button>
          ))}
        </Row>
      ))}
      <Row label="With icon">
        <Button icon={<PlusIcon />}>New agent</Button>
        <Button variant="secondary" iconRight={<ArrowRightIcon />}>
          Continue
        </Button>
        <Button variant="ghost" icon={<PlusIcon />}>
          Add step
        </Button>
        <Button variant="destructive" icon={<TrashIcon />}>
          Delete
        </Button>
      </Row>
      <Row label="Icon only">
        {sizes.map((size) => (
          <Button key={size} size={size} variant="secondary" icon={<PlusIcon />} aria-label="Add" />
        ))}
        <Button variant="ghost" icon={<TrashIcon />} aria-label="Delete" />
      </Row>
      <Row label="Loading">
        {variants.map((variant) => (
          <Button key={variant} variant={variant} loading icon={<PlusIcon />}>
            Saving changes
          </Button>
        ))}
      </Row>
      <Row label="Disabled">
        {variants.map((variant) => (
          <Button key={variant} variant={variant} disabled>
            {variant[0].toUpperCase() + variant.slice(1)}
          </Button>
        ))}
      </Row>
    </Block>
  );
}
