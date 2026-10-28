import { useState } from "react";
import { ToastProvider } from "./design-system/components/toast";
import { Gallery } from "./gallery/Gallery";
import { useTheme } from "./gallery/useTheme";
import { Settings } from "./settings/Settings";
import { UpdatePrompt } from "./updater/UpdatePrompt";
import { UpdaterProvider } from "./updater/UpdaterProvider";

type Screen = "gallery" | "settings";

export function App() {
  const { theme, setTheme } = useTheme();
  const [screen, setScreen] = useState<Screen>("gallery");

  return (
    <ToastProvider>
      <UpdaterProvider>
        {screen === "settings" ? (
          <Settings onBack={() => setScreen("gallery")} />
        ) : (
          <Gallery theme={theme} onThemeChange={setTheme} onOpenSettings={() => setScreen("settings")} />
        )}
        <UpdatePrompt />
      </UpdaterProvider>
    </ToastProvider>
  );
}
