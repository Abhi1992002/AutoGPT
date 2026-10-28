import { Bot, Cpu, Globe, Sparkles } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "../../design-system/components/checkbox";
import { DateInput, DateTimeInput, TimeInput } from "../../design-system/components/date-input";
import { FileInput } from "../../design-system/components/file-input";
import { Icon } from "../../design-system/components/icon";
import { Input } from "../../design-system/components/input";
import { RadioGroup } from "../../design-system/components/radio-group";
import { SearchInput } from "../../design-system/components/search-input";
import { Select } from "../../design-system/components/select";
import { Switch } from "../../design-system/components/switch";
import { Textarea } from "../../design-system/components/textarea";
import { ToggleChip } from "../../design-system/components/toggle-chip";
import { Block } from "./Block";
import { ButtonBlock } from "./ButtonBlock";
import { OtpInputBlock } from "./OtpInputBlock";
import { Row } from "./Row";
import { Section } from "./Section";
import { SegmentedControlBlock } from "./SegmentedControlBlock";

const models = [
  { value: "claude", label: "Claude Fable 5.1", description: "Most capable", icon: <Icon icon={Sparkles} /> },
  { value: "gpt", label: "GPT-6 Astra", description: "OpenAI", icon: <Icon icon={Bot} /> },
  { value: "local", label: "Local model", description: "Runs on this machine", icon: <Icon icon={Cpu} /> },
  { value: "legacy", label: "Legacy model", description: "No longer available", icon: <Icon icon={Globe} />, disabled: true },
];

const plainOptions = [
  { value: "hourly", label: "Every hour" },
  { value: "daily", label: "Every day" },
  { value: "weekly", label: "Every week" },
];

function Chips() {
  const [tags, setTags] = useState(["Research", "Email", "Slack"]);
  return (
    <>
      {tags.map((t) => (
        <ToggleChip key={t} onRemove={() => setTags((l) => l.filter((x) => x !== t))}>
          {t}
        </ToggleChip>
      ))}
    </>
  );
}

export function Level2Section() {
  const [search, setSearch] = useState("agent runs");
  const [fakeFiles] = useState(() => [new File([new Uint8Array(24_576)], "agent-export.json", { type: "application/json" })]);
  return (
    <Section id="level-2" title="Level 2" description="Form controls: buttons, inputs, selects, toggles and pickers.">
      <ButtonBlock />
      <SegmentedControlBlock />

      <Block title="Input" description="One box for every text type. Email, URL and phone get an icon, amount a currency, password a show / hide.">
        <Row label="Types" layout="fields">
          <Input label="Name" placeholder="Agent name" defaultValue="Weekly digest" />
          <Input type="email" label="Email" placeholder="you@company.com" />
          <Input type="password" label="Password" defaultValue="hunter2hunter2" />
          <Input type="number" label="Max steps" defaultValue={25} min={1} suffix="steps" />
          <Input type="amount" label="Budget" placeholder="0.00" defaultValue="120.00" suffix="USD" />
          <Input type="url" label="Webhook" placeholder="https://" defaultValue="https://hooks.agpt.co/abc" />
          <Input type="tel" label="Phone" placeholder="+1 555 0100" />
          <Input label="API key" placeholder="sk-…" prefix={<Icon icon={Sparkles} />} />
        </Row>
        <Row label="States" layout="fields">
          <Input label="With help" help="Shown to your team in the library." placeholder="Short description" />
          <Input label="With error" defaultValue="not an email" type="email" error="Enter a valid email address." />
          <Input label="Required" required placeholder="Cannot be empty" />
          <Input label="Disabled" disabled defaultValue="Read only value" />
        </Row>
      </Block>

      <Block title="Textarea" description="Grows with its text up to a maximum, then scrolls.">
        <Row label="Auto-growing" layout="fields">
          <Textarea label="System prompt" placeholder="You are a helpful assistant…" rows={2} help="Grows as you type, up to 10 lines." />
          <Textarea
            label="Notes"
            defaultValue={"Runs every Monday at 9:00.\nPosts the digest to #updates.\nFalls back to email when Slack is down."}
            rows={2}
          />
        </Row>
      </Block>

      <Block title="Search" description="A magnifier in front, a clear button once there is text, Escape clears.">
        <Row label="Search input" layout="fields">
          <SearchInput value={search} onChange={setSearch} />
          <SearchInput placeholder="Search blocks…" />
        </Row>
      </Block>

      <Block title="Select" description="A control box opening the email-draft menu list; arrow keys move, typing jumps.">
        <Row label="Options" layout="fields">
          <Select label="Model" options={models} defaultValue="claude" help="Which model runs the agent." />
          <Select label="Schedule" options={plainOptions} placeholder="Pick a cadence" />
          <Select label="With error" options={plainOptions} error="Choose a schedule." />
          <Select label="Disabled" options={plainOptions} defaultValue="daily" disabled />
        </Row>
      </Block>

      <Block title="Switch" description="Off is a light track, on is ink; the thumb glides.">
        <Row label="Sizes">
          <Switch defaultChecked label="Notifications" />
          <Switch label="Auto-retry" />
          <Switch size="sm" defaultChecked label="Compact" />
          <Switch disabled defaultChecked label="Disabled" />
        </Row>
        <Row label="With description">
          <Switch defaultChecked label="Run on a schedule" description="The agent starts on its own at the times you set." />
        </Row>
      </Block>

      <Block source="affectui" title="Checkbox" description="The filter-menu option box: a tile that fills with ink while the tick draws itself.">
        <Row label="States">
          <Checkbox label="Unchecked" />
          <Checkbox defaultChecked label="Checked" />
          <Checkbox indeterminate label="Indeterminate" />
          <Checkbox disabled label="Disabled" />
          <Checkbox disabled defaultChecked label="Disabled, checked" />
        </Row>
        <Row label="With description">
          <Checkbox defaultChecked label="Send a summary" description="An email with the run's output and credits used." />
        </Row>
      </Block>

      <Block source="affectui" title="Radio group" description="The progress-tracker ring: fills with ink and pops when picked.">
        <Row label="Vertical">
          <RadioGroup
            label="Visibility"
            defaultValue="team"
            options={[
              { value: "private", label: "Private", description: "Only you" },
              { value: "team", label: "Team", description: "Everyone in your workspace" },
              { value: "public", label: "Public", description: "Listed in the marketplace" },
            ]}
          />
        </Row>
        <Row label="Horizontal">
          <RadioGroup
            orientation="horizontal"
            defaultValue="md"
            options={[
              { value: "sm", label: "Small" },
              { value: "md", label: "Medium" },
              { value: "lg", label: "Large" },
              { value: "xl", label: "Extra large", disabled: true },
            ]}
          />
        </Row>
      </Block>

      <Block title="Toggle chip" description="Pressable chips in the filter-menu chip style; removable ones carry a ×.">
        <Row label="Toggle">
          <ToggleChip defaultPressed check>
            Running
          </ToggleChip>
          <ToggleChip check>Failed</ToggleChip>
          <ToggleChip check>Scheduled</ToggleChip>
          <ToggleChip icon={<Icon icon={Sparkles} size="xs" />}>AI-written</ToggleChip>
          <ToggleChip disabled>Archived</ToggleChip>
        </Row>
        <Row label="Small">
          <ToggleChip size="sm" defaultPressed>
            Today
          </ToggleChip>
          <ToggleChip size="sm">This week</ToggleChip>
          <ToggleChip size="sm">This month</ToggleChip>
        </Row>
        <Row label="Removable">
          <Chips />
        </Row>
      </Block>

      <Block title="File input" description="Click or drop files on the box; picked files list below with their size.">
        <Row label="File input" layout="fields">
          <FileInput label="Agent file" accept=".json" help="A .json export from the builder." />
          <FileInput label="Attachments" multiple files={fakeFiles} />
        </Row>
      </Block>

      <Block title="Date, time and date-time" description="Native pickers in the shared control box.">
        <Row label="Pickers" layout="fields">
          <DateInput label="Start date" defaultValue="2026-10-28" />
          <TimeInput label="Start time" defaultValue="09:30" />
          <DateTimeInput label="Run at" defaultValue="2026-10-28T09:30" />
          <DateInput label="With error" error="Pick a date in the future." />
        </Row>
      </Block>

      <OtpInputBlock />
    </Section>
  );
}
