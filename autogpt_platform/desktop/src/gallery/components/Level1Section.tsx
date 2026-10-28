import { Bell, Bot, Copy, Plus, Settings, Trash2, Zap } from "lucide-react";
import { Avatar } from "../../design-system/components/avatar";
import { Badge } from "../../design-system/components/badge";
import { Button } from "../../design-system/components/button";
import { Icon } from "../../design-system/components/icon";
import { Link } from "../../design-system/components/link";
import { Separator } from "../../design-system/components/separator";
import { ShimmerText, Skeleton } from "../../design-system/components/skeleton";
import { Spinner } from "../../design-system/components/spinner";
import { Tooltip } from "../../design-system/components/tooltip";
import { Block } from "./Block";
import { Row } from "./Row";
import { Section } from "./Section";

export function Level1Section() {
  return (
    <Section id="level-1" title="Level 1" description="Primitives: icons, links, badges, avatars, spinners, skeletons, separators and tooltips.">
      <Block title="Icon" description="lucide-react icons at the design system's sizes and tones, 1.8px stroke.">
        <Row label="Sizes">
          <Icon icon={Zap} size="xs" />
          <Icon icon={Zap} size="sm" />
          <Icon icon={Zap} size="md" />
          <Icon icon={Zap} size="lg" />
        </Row>
        <Row label="Tones">
          <Icon icon={Bot} size="md" />
          <Icon icon={Bot} size="md" tone="muted" />
          <Icon icon={Bot} size="md" tone="subtle" />
          <Icon icon={Bot} size="md" tone="accent" />
          <Icon icon={Bot} size="md" tone="danger" />
        </Row>
      </Block>

      <Block title="Link" description="Underlined with a soft line that turns solid on hover; accent for actions, muted for footnotes.">
        <Row label="Tones">
          <Link href="#level-1">Default link</Link>
          <Link href="#level-1" tone="accent">
            Accent link
          </Link>
          <Link href="#level-1" tone="muted">
            Muted link
          </Link>
        </Row>
        <Row label="Underline on hover">
          <Link href="#level-1" underline="hover">
            Open the run
          </Link>
          <Link href="#level-1" tone="accent" underline="hover">
            View all agents
          </Link>
        </Row>
      </Block>

      <Block title="Badge" description="Labels and status pills in the AffectUI status colours.">
        <Row label="Pill">
          <Badge>Draft</Badge>
          <Badge tone="accent">New</Badge>
          <Badge tone="success">Completed</Badge>
          <Badge tone="warning">Pending review</Badge>
          <Badge tone="danger">Failed</Badge>
          <Badge tone="purple">Beta</Badge>
        </Row>
        <Row label="With dot">
          <Badge dot tone="success">
            Running
          </Badge>
          <Badge dot tone="warning">
            Queued
          </Badge>
          <Badge dot tone="danger">
            Error
          </Badge>
          <Badge dot>Paused</Badge>
        </Row>
        <Row label="Tag">
          <Badge variant="tag">v2.4.1</Badge>
          <Badge variant="tag" tone="accent">
            Save 20%
          </Badge>
          <Badge variant="tag" tone="warning">
            Needs approval
          </Badge>
        </Row>
        <Row label="Eyebrow">
          <Badge variant="eyebrow">Release</Badge>
          <Badge variant="eyebrow">Security</Badge>
        </Row>
      </Block>

      <Block title="Avatar" description="Initials on a light chip, or a picture. Sizes from the profile menu and the email draft.">
        <Row label="Sizes">
          <Avatar name="Abhimanyu Yadav" size="sm" />
          <Avatar name="Abhimanyu Yadav" size="md" />
          <Avatar name="Abhimanyu Yadav" size="lg" />
        </Row>
        <Row label="Picture">
          <Avatar src="https://i.pravatar.cc/96?img=12" name="Nia Okafor" size="sm" />
          <Avatar src="https://i.pravatar.cc/96?img=12" name="Nia Okafor" />
          <Avatar src="https://i.pravatar.cc/96?img=12" name="Nia Okafor" size="lg" />
        </Row>
        <Row label="Status">
          <Avatar name="Online" status="online" />
          <Avatar name="Away" status="away" />
          <Avatar name="Off" status="offline" />
        </Row>
      </Block>

      <Block source="affectui" title="Spinner" description="The button's arc spinner and the thinking loader's eight rays.">
        <Row label="Arc">
          <Spinner size="sm" />
          <Spinner />
          <Spinner size="lg" />
        </Row>
        <Row label="Rays">
          <Spinner variant="rays" size="sm" />
          <Spinner variant="rays" />
          <Spinner variant="rays" size="lg" />
        </Row>
      </Block>

      <Block source="affectui" title="Skeleton" description="Shimmer Loader: placeholder blocks sharing one light sweep, and a shimmering label.">
        <Row label="Blocks" layout="wide">
          <div className="skeleton-card">
            <Skeleton width={42} circle />
            <div className="stack" style={{ flex: 1 }}>
              <Skeleton width="60%" height={14} />
              <Skeleton width="90%" />
            </div>
          </div>
          <div className="stack">
            <Skeleton height={14} />
            <Skeleton width="80%" />
            <Skeleton width="65%" />
          </div>
        </Row>
        <Row label="Text">
          <span className="ui">
            <ShimmerText>Thinking…</ShimmerText>
          </span>
          <span className="body">
            <ShimmerText duration={3}>Searching 12 sources</ShimmerText>
          </span>
        </Row>
      </Block>

      <Block title="Separator" description="A hairline, with or without a label.">
        <Row label="Horizontal" layout="stack">
          <Separator />
          <Separator>or continue with</Separator>
        </Row>
        <Row label="Vertical">
          <span className="ui">Runs</span>
          <span style={{ height: 20, display: "flex" }}>
            <Separator orientation="vertical" />
          </span>
          <span className="ui">Schedules</span>
          <span style={{ height: 20, display: "flex" }}>
            <Separator orientation="vertical" />
          </span>
          <span className="ui">Settings</span>
        </Row>
      </Block>

      <Block source="affectui" title="Tooltip" description="Message Actions' label: above the trigger after a beat on hover, at once on keyboard focus.">
        <Row label="On buttons">
          <Tooltip content="Copy">
            <Button variant="secondary" icon={<Copy />} aria-label="Copy" />
          </Tooltip>
          <Tooltip content="Notifications">
            <Button variant="ghost" icon={<Bell />} aria-label="Notifications" />
          </Tooltip>
          <Tooltip content="Settings" side="bottom">
            <Button variant="ghost" icon={<Settings />} aria-label="Settings" />
          </Tooltip>
          <Tooltip content="Delete agent" side="bottom">
            <Button variant="destructive" icon={<Trash2 />} aria-label="Delete" />
          </Tooltip>
          <Tooltip content="Create a new agent">
            <Button icon={<Plus />}>New</Button>
          </Tooltip>
        </Row>
      </Block>
    </Section>
  );
}
