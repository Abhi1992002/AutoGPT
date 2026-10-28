import { SegmentedControl, type SegmentOption } from "../design-system/components/segmented-control";
import { ToastProvider } from "../design-system/components/toast";
import { Level1Section } from "./components/Level1Section";
import { Level2Section } from "./components/Level2Section";
import { Level3Section } from "./components/Level3Section";
import { TypographySection } from "./components/TypographySection";
import { MoonIcon, SunIcon } from "./icons";
import { useTheme, type Theme } from "./useTheme";

const themeOptions: SegmentOption<Theme>[] = [
  { value: "light", label: "Light", icon: <SunIcon /> },
  { value: "dark", label: "Dark", icon: <MoonIcon /> },
];

export function Gallery() {
  const { theme, setTheme } = useTheme();

  return (
    <ToastProvider>
      <main className="gallery">
        <header className="gallery__header">
          <div>
            <h1 className="gallery__title title">AutoGPT Desktop design system</h1>
            <p className="gallery__subtitle body text-muted">Components ported from AffectUI (Classic) or designed to match.</p>
          </div>
          <SegmentedControl options={themeOptions} value={theme} onChange={setTheme} aria-label="Theme" />
        </header>
        <div className="gallery__sections">
          <TypographySection />
          <Level1Section />
          <Level2Section />
          <Level3Section />
        </div>
      </main>
    </ToastProvider>
  );
}
