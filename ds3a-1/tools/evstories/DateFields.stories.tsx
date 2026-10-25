// Evidence only (DS3a-1), never committed: the real DateInput / DateTimeInput atoms (the Calendar and
// Popover call sites) in the states their props give them: filled, disabled, read-only, with an error.
import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { DateInput } from "@/components/atoms/DateInput/DateInput";
import { DateTimeInput } from "@/components/atoms/DateTimeInput/DateTimeInput";

function Date_(props: Partial<React.ComponentProps<typeof DateInput>>) {
  const [value, setValue] = useState(props.value);
  return <div className="w-[360px]"><DateInput id="d" label="Start date" {...props} value={value} onChange={setValue} /></div>;
}
function DateTime_(props: Partial<React.ComponentProps<typeof DateTimeInput>>) {
  const [value, setValue] = useState(props.value);
  return <div className="w-[360px]"><DateTimeInput id="dt" label="Scheduled at" {...props} value={value} onChange={setValue} /></div>;
}

const meta: Meta = { title: "Evidence/DateFields" };
export default meta;
type Story = StoryObj;

export const DateFilled: Story = { render: () => <Date_ value="2026-01-20" /> };
export const DateDisabled: Story = { render: () => <Date_ value="2026-01-20" disabled /> };
export const DateReadOnly: Story = { render: () => <Date_ value="2026-01-20" readonly /> };
export const DateError: Story = { render: () => <Date_ error="Pick a date after today" /> };
export const DateTimeFilled: Story = { render: () => <DateTime_ value="2026-01-20T09:30:00.000Z" /> };
export const DateTimeDisabled: Story = { render: () => <DateTime_ value="2026-01-20T09:30:00.000Z" disabled /> };
export const DateTimeReadOnly: Story = { render: () => <DateTime_ value="2026-01-20T09:30:00.000Z" readonly /> };
export const DateTimeError: Story = { render: () => <DateTime_ error="Pick a time in the future" /> };
