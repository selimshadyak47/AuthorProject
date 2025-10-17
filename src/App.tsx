import { useState } from "react";
import { TopNav } from "./components/TopNav";
import { SideNav } from "./components/SideNav";
import { Dashboard } from "./components/screens/Dashboard";
import { NewPriorAuth } from "./components/screens/NewPriorAuth";
import { DenialFighter } from "./components/screens/DenialFighter";
import { Cases } from "./components/screens/Cases";
import { Patients } from "./components/screens/Patients";
import { Settings } from "./components/screens/Settings";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState("dashboard");

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case "dashboard":
        return <Dashboard onNavigate={handleNavigate} />;
      case "new-request":
        return <NewPriorAuth />;
      case "patients":
        return <Patients onNavigate={handleNavigate} />;
      case "appeals":
        return <DenialFighter />;
      case "cases":
        return <Cases onNavigate={handleNavigate} />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav currentScreen={currentScreen} onNavigate={handleNavigate} />
      <div className="flex h-[calc(100vh-3.5rem)]">
        <SideNav currentScreen={currentScreen} onNavigate={handleNavigate} />
        <main className="flex-1 overflow-y-auto">
          <div className="container max-w-[1400px] mx-auto p-8">
            {renderScreen()}
          </div>
        </main>
      </div>
    </div>
  );
}
