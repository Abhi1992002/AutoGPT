import { Settings } from "lucide-react";
import { Button } from "../design-system/components/button";
import { Icon } from "../design-system/components/icon";
import { SegmentedControl, type SegmentOption } from "../design-system/components/segmented-control";
import { Level1Section } from "./components/Level1Section";
import { Level2Section } from "./components/Level2Section";
import { Level3Section } from "./components/Level3Section";
import { TypographySection } from "./components/TypographySection";
import { MoonIcon, SunIcon } from "./icons";
import type { Theme } from "./useTheme";

const themeOptions: SegmentOption<Theme>[] = [
  { value: "light", label: "Light", icon: <SunIcon /> },
  { value: "dark", label: "Dark", icon: <MoonIcon /> },
];

interface Props {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onOpenSettings: () => void;
}

export function Gallery({ theme, onThemeChange, onOpenSettings }: Props) {
  return (
    <main className="gallery">
      <header className="gallery__header">
        <div>
          <h1 className="gallery__title title">AutoGPT Desktop design system</h1>
          <p className="gallery__subtitle body text-muted">Components ported from AffectUI (Classic) or designed to match.</p>
        </div>
        <div className="gallery__toolbar">
          <SegmentedControl options={themeOptions} value={theme} onChange={onThemeChange} aria-label="Theme" />
          <Button variant="secondary" icon={<Icon icon={Settings} />} onClick={onOpenSettings}>
            Settings
          </Button>
        </div>
      </header>
      <div className="gallery__sections">
        <TypographySection />
        <Level1Section />
        <Level2Section />
        <Level3Section />
      </div>
    </main>
  );
}
