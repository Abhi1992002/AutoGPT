import { useState } from "react";
import { SegmentedControl } from "../../design-system/components/segmented-control";
import { CalendarIcon, GridIcon, ListIcon } from "../icons";
import { Row } from "./Row";
import { Section } from "./Section";

const plain = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

const withIcons = [
  { value: "list", label: "List", icon: <ListIcon /> },
  { value: "grid", label: "Grid", icon: <GridIcon /> },
  { value: "calendar", label: "Calendar", icon: <CalendarIcon /> },
];

const iconsOnly = [
  { value: "list", icon: <ListIcon />, ariaLabel: "List" },
  { value: "grid", icon: <GridIcon />, ariaLabel: "Grid" },
  { value: "calendar", icon: <CalendarIcon />, ariaLabel: "Calendar" },
];

const withCounts = [
  { value: "all", label: "All", count: 1284 },
  { value: "running", label: "Running", count: 12 },
  { value: "failed", label: "Failed", count: 3 },
  { value: "archived", label: "Archived", disabled: true },
];

const withBadge = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly", badge: "Save 20%" },
];

export function SegmentedControlSection() {
  const [tab, setTab] = useState("overview");

  return (
    <Section
      title="Segmented Control"
      description="Switch between two to six options – a raised pill or underline that glides, stretches a little and can be dragged across, with icons, counts and badges."
    >
      <Row label="Tray (default)">
        <SegmentedControl options={plain} aria-label="Range" />
      </Row>
      <Row label="Sizes">
        <SegmentedControl options={plain} size="sm" aria-label="Range small" />
        <SegmentedControl options={plain} size="md" aria-label="Range medium" />
        <SegmentedControl options={plain} size="lg" aria-label="Range large" />
      </Row>
      <Row label="Icons">
        <SegmentedControl options={withIcons} aria-label="View" />
        <SegmentedControl options={iconsOnly} aria-label="View icons" />
      </Row>
      <Row label="Counts and badges">
        <SegmentedControl options={withCounts} aria-label="Status" />
        <SegmentedControl options={withBadge} defaultValue="yearly" aria-label="Billing" />
      </Row>
      <Row label="Full width" layout="stack">
        <SegmentedControl options={plain} fullWidth aria-label="Range full width" />
      </Row>
      <Row label="Underline">
        <SegmentedControl options={plain} variant="underline" aria-label="Range underline" />
        <SegmentedControl options={withCounts} variant="underline" size="lg" aria-label="Status underline" />
      </Row>
      <Row label="Tabs" layout="stack">
        <SegmentedControl
          kind="tabs"
          variant="underline"
          value={tab}
          onChange={setTab}
          options={[
            { value: "overview", label: "Overview", controls: "panel-overview" },
            { value: "runs", label: "Runs", count: 8, controls: "panel-runs" },
            { value: "settings", label: "Settings", controls: "panel-settings" },
          ]}
          aria-label="Agent"
        />
        <div className="row__panel" id={`panel-${tab}`} role="tabpanel">
          {tab === "overview" && "Overview of the agent."}
          {tab === "runs" && "Eight runs in the last week."}
          {tab === "settings" && "Settings for the agent."}
        </div>
      </Row>
      <Row label="Disabled">
        <SegmentedControl options={plain} disabled aria-label="Range disabled" />
      </Row>
    </Section>
  );
}
