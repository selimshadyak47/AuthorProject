import { Settings, User } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface TopNavProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

export function TopNav({ currentScreen, onNavigate }: TopNavProps) {
  return (
    <div className="border-b border-border bg-background h-14 flex items-center px-6 sticky top-0 z-50">
      <div className="flex items-center gap-8 flex-1">
        <button onClick={() => onNavigate("dashboard")} className="flex items-center gap-2 group">
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Auth<span className="text-primary text-sm">or</span>
          </span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 px-2 gap-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="bg-muted text-foreground text-xs">
                  DS
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">Dr. Smith</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNavigate("settings")}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
