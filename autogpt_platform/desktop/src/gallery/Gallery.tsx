import { SegmentedControl, type SegmentOption } from "../design-system/components/segmented-control";
import { ButtonSection } from "./components/ButtonSection";
import { FilterMenuSection } from "./components/FilterMenuSection";
import { OtpInputSection } from "./components/OtpInputSection";
import { SegmentedControlSection } from "./components/SegmentedControlSection";
import { MoonIcon, SunIcon } from "./icons";
import { useTheme, type Theme } from "./useTheme";

const themeOptions: SegmentOption<Theme>[] = [
  { value: "light", label: "Light", icon: <SunIcon /> },
  { value: "dark", label: "Dark", icon: <MoonIcon /> },
];

export function Gallery() {
  const { theme, setTheme } = useTheme();

  return (
    <main className="gallery">
      <header className="gallery__header">
        <div>
          <h1 className="gallery__title">AutoGPT Desktop design system</h1>
          <p className="gallery__subtitle">Components ported from AffectUI (Classic).</p>
        </div>
        <SegmentedControl options={themeOptions} value={theme} onChange={setTheme} aria-label="Theme" />
      </header>
      <div className="gallery__sections">
        <ButtonSection />
        <SegmentedControlSection />
        <OtpInputSection />
        <FilterMenuSection />
      </div>
    </main>
  );
}
