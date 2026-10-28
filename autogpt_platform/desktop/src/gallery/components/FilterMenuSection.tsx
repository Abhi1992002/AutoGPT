import { FilterMenu, type FilterGroup } from "../../design-system/components/filter-menu";
import { Row } from "./Row";
import { Section } from "./Section";

const groups: FilterGroup[] = [
  {
    id: "status",
    label: "Status",
    options: [
      { id: "running", label: "Running" },
      { id: "queued", label: "Queued" },
      { id: "completed", label: "Completed" },
      { id: "failed", label: "Failed" },
    ],
  },
  {
    id: "trigger",
    label: "Trigger",
    options: [
      { id: "manual", label: "Manual" },
      { id: "schedule", label: "Schedule" },
      { id: "webhook", label: "Webhook" },
    ],
  },
  {
    id: "cost",
    label: "Credits used",
    chipPrefix: "Credits: ",
    options: [
      { id: "lt10", label: "Under 10" },
      { id: "10to100", label: "10–100" },
      { id: "gt100", label: "Over 100" },
    ],
  },
];

export function FilterMenuSection() {
  return (
    <Section
      title="Filter Menu"
      description="Grouped filters with removable chips, collapsible checkbox groups, Clear all and full keyboard control."
    >
      <Row label="With selection" layout="wide">
        <FilterMenu groups={groups} defaultValue={{ status: ["running", "failed"], cost: ["gt100"] }} defaultOpen={["status", "cost"]} />
        <FilterMenu groups={groups} title="Runs" hints={false} />
      </Row>
    </Section>
  );
}
