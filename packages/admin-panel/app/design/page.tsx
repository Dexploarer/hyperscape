"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Zap, Shield, Key, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function DesignPage() {
  return (
    <div className="p-10 space-y-12 pb-40">
      <div>
        <h1 className="text-4xl font-bold text-primary mb-2 uppercase tracking-widest">
          Tactical Command System
        </h1>
        <p className="text-muted-foreground">
          Kitchen Sink Verification // v2.0
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground border-b border-border-thin pb-2 uppercase tracking-widest">
          Atoms: Buttons
        </h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Button variant="solid">Solid Action</Button>
          <Button variant="outline">Outline Standard</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="solid" size="icon">
            <Zap className="h-4 w-4" />
          </Button>
          <Button variant="outline" disabled>
            Disabled
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  ?
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Help Verification</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground border-b border-border-thin pb-2 uppercase tracking-widest">
          Atoms: Inputs & Selects
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-xs uppercase text-muted-foreground font-bold">
              Text Input
            </label>
            <Input placeholder="Enter command query..." />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase text-muted-foreground font-bold">
              Select Operation
            </label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select Operation..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="op1">Deploy Asset</SelectItem>
                <SelectItem value="op2">Scanning</SelectItem>
                <SelectItem value="op3">Purge</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground border-b border-border-thin pb-2 uppercase tracking-widest">
          Organisms: Tabs & Context
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Tabs defaultValue="account" className="w-[400px]">
            <TabsList>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account</CardTitle>
                </CardHeader>
                <CardContent>Make changes to your account here.</CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle>Password</CardTitle>
                </CardHeader>
                <CardContent>Change your password here.</CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <ContextMenu>
            <ContextMenuTrigger className="flex h-[150px] w-full items-center justify-center rounded-md border border-dashed border-border-thin text-sm text-foreground bg-bg-panel/50">
              Right click here
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem>Profile</ContextMenuItem>
              <ContextMenuItem>Billing</ContextMenuItem>
              <ContextMenuItem>Team</ContextMenuItem>
              <ContextMenuItem>Subscription</ContextMenuItem>
              <ContextMenuShortcut>⌘S</ContextMenuShortcut>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      </section>
    </div>
  );
}
