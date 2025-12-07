"use client";

import { SpectacularButton } from "@/components/ui/spectacular-button";
import { NeonInput } from "@/components/ui/neon-input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { AssetCard } from "@/components/ui/asset-card";
import { ToolNodeCard } from "@/components/ui/tool-node-card";
import { ChatBubble } from "@/components/ui/chat-bubble";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { useState } from "react";
import { Box, Wand2, Code } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export default function DesignSystemPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [sliderVal, setSliderVal] = useState([50]);
  const [switchVal, setSwitchVal] = useState(false);
  const [activeTab, setActiveTab] = useState("atoms");
  const [selectVal, setSelectVal] = useState("option1");
  const { toast } = useToast();

  return (
    <div className="h-full w-full p-8 overflow-y-auto bg-industrial-gradient technical-grid">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground font-mono">
            ASSET FORGE
          </h1>
          <p className="text-foreground/70 font-mono text-sm">
            Industrial Constructivist UI • Clean Room / Molten Core
          </p>
        </div>

        <Tabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={[
            { id: "atoms", label: "Atoms" },
            { id: "molecules", label: "Molecules" },
            { id: "utilities", label: "Utilities" },
          ]}
          className="w-full max-w-md"
        />

        {activeTab === "atoms" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Buttons */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold border-b border-glass-border pb-2">
                Buttons
              </h2>
              <div className="flex flex-wrap gap-4">
                <SpectacularButton>Primary Glow</SpectacularButton>
                <SpectacularButton variant="secondary">
                  Secondary Glass
                </SpectacularButton>
                <SpectacularButton variant="ghost">Ghost</SpectacularButton>
                <SpectacularButton variant="danger">Danger</SpectacularButton>
              </div>
            </section>

            {/* Inputs */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold border-b border-glass-border pb-2">
                Inputs & Controls
              </h2>
              <div className="space-y-4 max-w-sm">
                <NeonInput
                  label="Email Address"
                  placeholder="agent@hyperscape.ai"
                />
                <NeonInput
                  label="With Error"
                  placeholder="Invalid input"
                  error="This field is required"
                />
                <div className="flex items-center gap-4 p-4 border border-glass-border rounded-xl bg-glass-bg">
                  <span className="text-sm">Toggle Switch</span>
                  <Switch checked={switchVal} onCheckedChange={setSwitchVal} />
                </div>
                <div className="space-y-2 p-4 border border-glass-border rounded-xl bg-glass-bg">
                  <span className="text-sm">Range Slider ({sliderVal})</span>
                  <Slider
                    value={sliderVal}
                    min={0}
                    max={100}
                    onValueChange={setSliderVal}
                  />
                </div>
              </div>
            </section>

            {/* Badges & Spinners */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold border-b border-glass-border pb-2">
                Status & Feedback
              </h2>
              <div className="flex gap-4 items-center">
                <Badge variant="default">Default</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="destructive">Failed</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
              <div className="flex gap-4 items-center mt-4">
                <Spinner size="sm" />
                <Spinner size="md" />
                <Spinner size="lg" />
                <span className="text-sm text-gray-400">Loading states...</span>
              </div>
            </section>
          </div>
        )}

        {activeTab === "molecules" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="space-y-4">
              <h2 className="text-xl font-semibold border-b border-glass-border pb-2">
                Cards
              </h2>
              <div className="flex gap-6">
                <AssetCard name="Cyber Samurai Helmet" status="ready" />
                <AssetCard name="Plasma Rifle" status="processing" />
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold border-b border-glass-border pb-2">
                Tool Nodes
              </h2>
              <div className="space-y-4">
                <ToolNodeCard
                  title="Generate Mesh"
                  status="completed"
                  icon={<Box />}
                  description="Meshy V2 · 20k Polys"
                />
                <ToolNodeCard
                  title="Auto-Rigging"
                  status="running"
                  icon={<Wand2 />}
                  description="Processing bones..."
                  selected
                />
                <ToolNodeCard
                  title="VRM Connect"
                  status="failed"
                  icon={<Code />}
                  description="Bone mapping error"
                />
              </div>
            </section>

            <section className="space-y-4 md:col-span-2">
              <h2 className="text-xl font-semibold border-b border-glass-border pb-2">
                Chat Interface
              </h2>
              <div className="p-4 border border-glass-border rounded-2xl bg-black/20 max-w-2xl">
                <ChatBubble
                  role="user"
                  content="Create a futuristic helmet with neon accents."
                />
                <ChatBubble
                  role="assistant"
                  content="I can certainly help with that. Initializing Meshy v2 generator with parameters: polycount=20k, style=cyberpunk."
                />
              </div>
            </section>
          </div>
        )}

        {activeTab === "utilities" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="space-y-4">
              <h2 className="text-xl font-semibold border-b border-glass-border pb-2">
                Modals & Popovers
              </h2>
              <SpectacularButton onClick={() => setModalOpen(true)}>
                Open Modal
              </SpectacularButton>
              <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Confirmation"
              >
                <p className="text-gray-300">
                  This action will consume 50 credits to generate a
                  high-fidelity 3D model. Proceed?
                </p>
                <div className="mt-6 flex justify-end gap-2">
                  <SpectacularButton
                    variant="ghost"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </SpectacularButton>
                  <SpectacularButton onClick={() => setModalOpen(false)}>
                    Confirm Transaction
                  </SpectacularButton>
                </div>
              </Modal>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold border-b border-glass-border pb-2">
                Toast Notifications
              </h2>
              <div className="flex flex-col gap-2">
                <SpectacularButton
                  variant="secondary"
                  onClick={() =>
                    toast({
                      title: "Success",
                      description: "Asset generated successfully.",
                      variant: "success",
                    })
                  }
                >
                  Show Success Toast
                </SpectacularButton>
                <SpectacularButton
                  variant="danger"
                  onClick={() =>
                    toast({
                      title: "Error",
                      description: "Generation failed due to timeout.",
                      variant: "destructive",
                    })
                  }
                >
                  Show Error Toast
                </SpectacularButton>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold border-b border-glass-border pb-2">
                Form Elements
              </h2>
              <div className="max-w-xs">
                <Select
                  value={selectVal}
                  onChange={setSelectVal}
                  options={[
                    { value: "option1", label: "High Poly (50k)" },
                    { value: "option2", label: "Mid Poly (20k)" },
                    { value: "option3", label: "Low Poly (5k)" },
                  ]}
                  label="Mesh Detail Level"
                />
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
