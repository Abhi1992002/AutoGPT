import { lazy, Suspense, useState } from "react";
import { ToastProvider } from "./design-system/components/toast";
import { Gallery } from "./gallery/Gallery";
import { useTheme } from "./gallery/useTheme";
import { wantsOnboarding } from "./onboarding/core/params";
import { Settings } from "./settings/Settings";
import { UpdatePrompt } from "./updater/UpdatePrompt";
import { UpdaterProvider } from "./updater/UpdaterProvider";

const Onboarding = lazy(() => import("./onboarding/Onboarding").then((m) => ({ default: m.Onboarding })));

type Screen = "gallery" | "settings" | "onboarding";

export function App() {
  const { theme, setTheme } = useTheme();
  const [screen, setScreen] = useState<Screen>(() => (wantsOnboarding() ? "onboarding" : "gallery"));

  const finishOnboarding = () => {
    window.history.replaceState(null, "", window.location.pathname);
    setScreen("gallery");
  };

  return (
    <ToastProvider>
      <UpdaterProvider>
        {screen === "onboarding" ? (
          <Suspense fallback={null}>
            <Onboarding onFinish={finishOnboarding} />
          </Suspense>
        ) : screen === "settings" ? (
          <Settings onBack={() => setScreen("gallery")} />
        ) : (
          <Gallery theme={theme} onThemeChange={setTheme} onOpenSettings={() => setScreen("settings")} />
        )}
        <UpdatePrompt />
      </UpdaterProvider>
    </ToastProvider>
  );
}
