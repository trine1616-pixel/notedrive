"use client";

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Cloud, LifeBuoy, Settings, UserCircle2, Monitor, Smartphone, Zap } from "lucide-react";
import { useTheme } from '@/components/theme-provider';
import { useIsMobile, ViewMode } from '@/hooks/use-mobile';

export function UserNav() {
  const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar');
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const { mode, setMode } = useTheme();
  const { viewMode, setViewMode } = useIsMobile();

  return (
    <div className="p-2 group-data-[collapsible=icon]:p-0">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-12 w-full justify-start gap-2 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-8 w-8">
              <AvatarImage src={userAvatar?.imageUrl} alt="User avatar" data-ai-hint={userAvatar?.imageHint} />
              <AvatarFallback>ND</AvatarFallback>
            </Avatar>
            <div className="group-data-[collapsible=icon]:hidden text-left">
              <p className="text-sm font-medium leading-tight">Local User</p>
              <p className="text-xs text-muted-foreground">Settings & Sync</p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">NoteDrive</p>
              <p className="text-xs leading-none text-muted-foreground">
                Local profile mode
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Cloud className="mr-2 h-4 w-4" />
              <span>Drive Sync Status</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <LifeBuoy className="mr-2 h-4 w-4" />
              <span>Support</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Theme is active now. Auth/account features are planned next.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Appearance</h3>
              <RadioGroup value={mode} onValueChange={(value) => setMode(value as 'light' | 'dark' | 'system')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="theme-light" />
                  <Label htmlFor="theme-light">Light</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="theme-dark" />
                  <Label htmlFor="theme-dark">Dark</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="theme-system" />
                  <Label htmlFor="theme-system">System</Label>
                </div>
              </RadioGroup>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">View Environment</h3>
              <RadioGroup value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="auto" id="view-auto" />
                  <Label htmlFor="view-auto" className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5" />
                    Auto (Responsive)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="desktop" id="view-desktop" />
                  <Label htmlFor="view-desktop" className="flex items-center gap-2">
                    <Monitor className="h-3.5 w-3.5" />
                    Desktop Mode
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mobile" id="view-mobile" />
                  <Label htmlFor="view-mobile" className="flex items-center gap-2">
                    <Smartphone className="h-3.5 w-3.5" />
                    Mobile Mode
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground mt-1">
                Force the layout even on large/small screens. Useful for development and testing.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Account & Login Plan</h3>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
                <li>Phase 1: Local profile + settings sync</li>
                <li>Phase 2: Google login + Drive permission onboarding</li>
                <li>Phase 3: Team sharing, role permissions, audit trail</li>
              </ul>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <UserCircle2 className="h-3.5 w-3.5" />
                Login UI can be enabled after provider selection (Google / email magic link).
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
