import { Section } from "./Section";

const samples = [
  { cls: "title", spec: "16 / 24 · 600 · -0.01em", text: "Agents that get things done" },
  { cls: "heading", spec: "15 / 22 · 600 · -0.01em", text: "Run history and schedules" },
  { cls: "body", spec: "14 / 20 · 400", text: "The quick brown fox jumps over the lazy dog while the agent writes its report." },
  { cls: "ui", spec: "13 / 20 · 500 · default", text: "Save changes · Cancel · Open in builder" },
  { cls: "small", spec: "12 / 16 · 500", text: "Updated 4 minutes ago by the scheduler" },
  { cls: "caption", spec: "11 / 16 · 500", text: "12 runs · 3 failed · 1,284 credits" },
  { cls: "micro", spec: "10 / 1 · 500", text: "BETA" },
  { cls: "eyebrow", spec: "11 · 500 · 0.06em · uppercase", text: "Marketplace" },
  { cls: "mono", spec: "12.5 / 18 · mono", text: 'run_id = "a7f3-91c2" · status: completed' },
];

export function TypographySection() {
  return (
    <Section id="typography" title="Typography" description="Plain CSS utility classes in typography.css, with the AffectUI type values. Inter for text, the system mono stack for code.">
      <div className="block">
        <div className="block__rows">
          {samples.map((s) => (
            <div key={s.cls} className="type-sample">
              <code className="type-sample__name">.{s.cls}</code>
              <span className={s.cls}>{s.text}</span>
              <span className="type-sample__spec caption">{s.spec}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="block">
        <div className="block__rows">
          <div className="type-sample">
            <code className="type-sample__name">tones</code>
            <span className="inline">
              <span className="ui">Default</span>
              <span className="ui text-muted">.text-muted</span>
              <span className="ui text-subtle">.text-subtle</span>
              <span className="ui text-accent">.text-accent</span>
              <span className="ui text-danger">.text-danger</span>
            </span>
            <span className="type-sample__spec caption">ink · #737373 · #8f8f8f · #2f6bff · #e5484d</span>
          </div>
          <div className="type-sample">
            <code className="type-sample__name">code / kbd</code>
            <span className="body">
              Press <kbd>Ctrl</kbd> <kbd>K</kbd> to open the palette, then type <code>deploy --env prod</code> to ship.
            </span>
            <span className="type-sample__spec caption">0.85em mono · 22px keycap</span>
          </div>
        </div>
      </div>
    </Section>
  );
}
