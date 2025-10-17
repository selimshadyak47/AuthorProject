import {
  LayoutDashboard,
  FilePlus,
  Users,
  FolderOpen,
  FileX,
  Settings,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface SideNavProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

export function SideNav({ currentScreen, onNavigate }: SideNavProps) {
  const navItems = [
    {
      id: "dashboard",
      label: "Home",
      icon: LayoutDashboard,
    },
    {
      id: "new-request",
      label: "New Request",
      icon: FilePlus,
      isPrimary: true,
    },
    {
      id: "patients",
      label: "Patients",
      icon: Users,
    },
    {
      id: "cases",
      label: "All Cases",
      icon: FolderOpen,
      badge: "12",
    },
    {
      id: "appeals",
      label: "Denied Cases",
      icon: FileX,
      badge: "8",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      isBottom: true,
    },
  ];

  const primaryItems = navItems.filter(item => !item.isBottom);
  const bottomItems = navItems.filter(item => item.isBottom);

  return (
    <div className="w-56 border-r border-border bg-sidebar h-full flex flex-col">
      <div className="p-3 space-y-1 flex-1">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={currentScreen === item.id ? "secondary" : "ghost"}
              className={`w-full justify-start h-9 px-3 text-sm font-normal ${
                item.isPrimary && currentScreen !== item.id ? 'text-primary hover:text-primary' : ''
              }`}
              onClick={() => onNavigate(item.id)}
            >
              <Icon className="w-4 h-4 mr-3" />
              {item.label}
              {item.badge && (
                <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0 h-5">
                  {item.badge}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
      
      <div className="p-3 border-t border-border space-y-1">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={currentScreen === item.id ? "secondary" : "ghost"}
              className="w-full justify-start h-9 px-3 text-sm font-normal"
              onClick={() => onNavigate(item.id)}
            >
              <Icon className="w-4 h-4 mr-3" />
              {item.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
