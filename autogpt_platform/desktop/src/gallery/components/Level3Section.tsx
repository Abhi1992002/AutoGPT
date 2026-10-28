import { Archive, Copy, ExternalLink, MoreHorizontal, Pencil, Play, Settings, Trash2 } from "lucide-react";
import { useState } from "react";
import { Alert } from "../../design-system/components/alert";
import { Badge } from "../../design-system/components/badge";
import { Button } from "../../design-system/components/button";
import { Card } from "../../design-system/components/card";
import { Dialog } from "../../design-system/components/dialog";
import { DropdownMenu } from "../../design-system/components/dropdown-menu";
import { Icon } from "../../design-system/components/icon";
import { Popover } from "../../design-system/components/popover";
import { Progress } from "../../design-system/components/progress";
import { Switch } from "../../design-system/components/switch";
import { Tabs } from "../../design-system/components/tabs";
import { Toast, useToast } from "../../design-system/components/toast";
import { Block } from "./Block";
import { FilterMenuBlock } from "./FilterMenuBlock";
import { Row } from "./Row";
import { Section } from "./Section";

const menuItems = [
  { label: "Run now", icon: <Icon icon={Play} size="md" />, shortcut: "Ctrl R" },
  { label: "Edit in builder", icon: <Icon icon={Pencil} size="md" />, shortcut: "Ctrl E" },
  { label: "Duplicate", icon: <Icon icon={Copy} size="md" /> },
  { kind: "separator" as const },
  { kind: "label" as const, label: "Danger zone" },
  { label: "Archive", icon: <Icon icon={Archive} size="md" />, disabled: true },
  { label: "Delete agent", icon: <Icon icon={Trash2} size="md" />, tone: "danger" as const },
];

function ToastTrigger() {
  const toast = useToast();
  return (
    <Button
      variant="secondary"
      onClick={() => toast({ title: "Agent saved", text: "Weekly digest is ready to run.", tone: "success", action: { label: "Run now", onClick: () => {} } })}
    >
      Show toast
    </Button>
  );
}

function DialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open dialog
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete this agent?"
        description="Weekly digest and its 12 runs will be removed. This cannot be undone."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => setOpen(false)}>
              Delete
            </Button>
          </>
        }
      />
    </>
  );
}

export function Level3Section() {
  return (
    <Section id="level-3" title="Level 3" description="Containers and overlays: cards, menus, popovers, dialogs, toasts, tabs, progress and alerts.">
      <Block source="affectui" title="Card" description="The Classic card: white on a 6px grey tray, with anything in the footer living on the tray.">
        <Row label="Tray" layout="wide">
          <Card
            title="Weekly digest"
            description="Summarises #updates every Monday."
            actions={<Badge tone="success" dot>Active</Badge>}
            footer={
              <>
                <span className="text-muted">Last run 2 hours ago</span>
                <span style={{ marginLeft: "auto" }}>
                  <Button size="sm" variant="ghost" iconRight={<ExternalLink />}>
                    Open
                  </Button>
                </span>
              </>
            }
          >
            Collects messages from Slack, drafts a summary with the model you picked and posts it back. Fails over to email when Slack is unreachable.
          </Card>
          <Card title="Plain card" description="Without the tray." tray={false}>
            <Switch defaultChecked label="Run on a schedule" description="Every Monday at 9:00." />
          </Card>
        </Row>
      </Block>

      <Block source="affectui" title="Dropdown menu" description="Profile-menu rows on the email-draft menu surface; full keyboard control.">
        <Row label="Menus">
          <DropdownMenu trigger={(props) => <Button variant="secondary" iconRight={<MoreHorizontal />} {...props}>Actions</Button>} items={menuItems} />
          <DropdownMenu align="end" trigger={(props) => <Button variant="ghost" icon={<Settings />} aria-label="Settings" {...props} />} items={menuItems.slice(0, 3)} />
        </Row>
        <Row label="Open">
          <div className="demo-open">
            <DropdownMenu open onOpenChange={() => {}} trigger={(props) => <Button variant="secondary" iconRight={<MoreHorizontal />} {...props}>Actions</Button>} items={menuItems} />
          </div>
        </Row>
      </Block>

      <Block title="Popover" description="A floating panel for anything; closes on a click outside or Escape.">
        <Row label="Popover">
          <Popover width={280} trigger={(props) => <Button variant="secondary" {...props}>Run settings</Button>}>
            <div className="stack">
              <span className="heading">Run settings</span>
              <Switch defaultChecked label="Notify on finish" />
              <Switch label="Retry on failure" />
            </div>
          </Popover>
          <Popover align="end" side="top" trigger={(props) => <Button variant="ghost" {...props}>Above, right-aligned</Button>}>
            <span className="body">Opens above its trigger.</span>
          </Popover>
        </Row>
        <Row label="Open">
          <div className="demo-open">
            <Popover open onOpenChange={() => {}} width={280} trigger={(props) => <Button variant="secondary" {...props}>Run settings</Button>}>
              <div className="stack">
                <span className="heading">Run settings</span>
                <Switch defaultChecked label="Notify on finish" />
                <Switch label="Retry on failure" />
              </div>
            </Popover>
          </div>
        </Row>
      </Block>

      <Block title="Dialog" description="A modal on the native dialog element with the notification card's look.">
        <Row label="Modal">
          <DialogDemo />
        </Row>
        <Row label="Preview" layout="wide">
          <Dialog
            inline
            open
            onClose={() => {}}
            title="Delete this agent?"
            description="Weekly digest and its 12 runs will be removed. This cannot be undone."
            footer={
              <>
                <Button variant="secondary">Cancel</Button>
                <Button variant="destructive">Delete</Button>
              </>
            }
          />
        </Row>
      </Block>

      <Block source="affectui" title="Toast" description="Notification-stack cards in a corner; they slide out to the right when dismissed.">
        <Row label="Trigger">
          <ToastTrigger />
        </Row>
        <Row label="Tones" layout="wide">
          <Toast title="Agent saved" text="Weekly digest is ready to run." action={{ label: "Run now", onClick: () => {} }} onDismiss={() => {}} />
          <Toast tone="success" title="Run completed" text="Posted the digest to #updates." onDismiss={() => {}} />
          <Toast tone="warning" title="Low on credits" text="About 2 runs left this month." action={{ label: "Top up", onClick: () => {} }} onDismiss={() => {}} />
          <Toast tone="danger" title="Run failed" text="Slack returned 503. Retrying in 5 minutes." onDismiss={() => {}} />
        </Row>
      </Block>

      <Block source="affectui" title="Tabs" description="The segmented control as a tablist with its panels wired up.">
        <Row label="Underline" layout="stack">
          <Tabs
            aria-label="Agent"
            tabs={[
              { value: "overview", label: "Overview", content: "Weekly digest runs every Monday and posts to #updates." },
              { value: "runs", label: "Runs", count: 12, content: "Twelve runs in the last month, one failed." },
              { value: "settings", label: "Settings", content: "Model, schedule and notifications." },
            ]}
          />
        </Row>
        <Row label="Tray" layout="stack">
          <Tabs
            variant="tray"
            size="sm"
            aria-label="Output"
            tabs={[
              { value: "output", label: "Output", content: <span className="mono">Posted 4 messages · 1,284 tokens</span> },
              { value: "logs", label: "Logs", content: <span className="mono">09:30:01 start · 09:30:14 done</span> },
            ]}
          />
        </Row>
      </Block>

      <Block source="affectui" title="Progress bar" description="The progress-tracker bar (8px, ink, with a light sweep) and the profile-menu setup bar (4px, accent).">
        <Row label="Determinate" layout="wide">
          <Progress label="Onboarding" value={3} max={5} showValue="fraction" />
          <Progress label="Uploading export" value={62} showValue="percent" tone="accent" />
        </Row>
        <Row label="Small and indeterminate" layout="wide">
          <Progress size="sm" tone="accent" value={40} label="Profile setup" showValue="fraction" max={100} />
          <Progress label="Syncing…" />
        </Row>
      </Block>

      <Block title="Alert" description="Inline notices in the AffectUI status colours.">
        <Row label="Tones" layout="stack">
          <Alert title="New blocks available">Twelve new integrations landed this week.</Alert>
          <Alert tone="success" title="Connected to Slack" onDismiss={() => {}}>
            Messages will post to #updates.
          </Alert>
          <Alert tone="warning" title="Credits running low" action={<Button size="sm" variant="secondary">Top up</Button>}>
            About two runs left this month.
          </Alert>
          <Alert tone="danger" title="Run failed">
            Slack returned 503 three times. The next retry is in 5 minutes.
          </Alert>
          <Alert tone="neutral" icon={false}>
            A plain note without an icon.
          </Alert>
        </Row>
      </Block>

      <FilterMenuBlock />
    </Section>
  );
}
