// Evidence only (DS3a-1), never committed: SelectWidget's multi-select branch (an array of enum
// values with uniqueItems, which RJSF hands to the select widget), rendered through the real
// FormRenderer, and the real MultiSelect molecule with a disabled option.
import type { Meta, StoryObj } from "@storybook/nextjs";
import type { RJSFSchema } from "@rjsf/utils";
import { useState } from "react";
import { FormRendererStory, storyDecorator } from "@/components/renderers/InputRenderer/stories/FormRendererStoryWrapper";
import {
  MultiSelector, MultiSelectorContent, MultiSelectorInput, MultiSelectorItem, MultiSelectorList, MultiSelectorTrigger,
} from "@/components/molecules/MultiSelect/MultiSelect";

const schema: RJSFSchema = {
  type: "object",
  properties: {
    fruits: { type: "array", title: "Fruits", uniqueItems: true, items: { type: "string", enum: ["Apples", "Bananas", "Cherries", "Dates", "Elderberries"] } },
  },
};

function Molecule() {
  const [values, setValues] = useState(["Apples"]);
  return (
    <div className="w-[360px]">
      <MultiSelector values={values} onValuesChange={setValues}>
        <MultiSelectorTrigger><MultiSelectorInput aria-label="Fruit" placeholder="Pick fruit" /></MultiSelectorTrigger>
        <MultiSelectorContent>
          <MultiSelectorList>
            {["Apples", "Bananas", "Cherries"].map((o) => <MultiSelectorItem key={o} value={o} disabled={o === "Cherries"}>{o}</MultiSelectorItem>)}
          </MultiSelectorList>
        </MultiSelectorContent>
      </MultiSelector>
    </div>
  );
}

const meta: Meta = { title: "Evidence/FormMultiSelect", decorators: [storyDecorator] };
export default meta;
type Story = StoryObj;

export const SelectWidgetMulti: Story = { render: () => <FormRendererStory jsonSchema={schema} initialValues={{ fruits: ["Apples", "Cherries"] }} /> };
export const SelectWidgetMultiEmpty: Story = { render: () => <FormRendererStory jsonSchema={schema} /> };
export const MoleculeDisabledOption: Story = { render: () => <Molecule /> };
