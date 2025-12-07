import { GlassPanel } from "./glass-panel";
import { SpectacularButton } from "./spectacular-button";
import { Download, Trash2 } from "lucide-react";
import Image from "next/image";

interface AssetCardProps {
  name: string;
  thumbnailUrl?: string; // URL to the preview image
  status: "processing" | "ready" | "failed";
  onDownload?: () => void;
  onDelete?: () => void;
  onSelect?: () => void;
}

export function AssetCard({
  name,
  thumbnailUrl,
  status,
  onDownload,
  onDelete,
  onSelect,
}: AssetCardProps) {
  return (
    <GlassPanel
      className="group relative flex flex-col overflow-hidden w-64 h-80 transition-transform hover:scale-105"
      intensity="low"
      onClick={onSelect}
      border
    >
      {/* Thumbnail */}
      <div className="relative flex-1 bg-black/40 overflow-hidden">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={name}
            fill
            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-gray-500 text-xs uppercase tracking-widest">
            No Preview
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 border border-white/10 backdrop-blur-md">
          <span
            className={
              status === "ready"
                ? "text-neon-blue"
                : status === "processing"
                  ? "text-yellow-400"
                  : "text-red-500"
            }
          >
            {status}
          </span>
        </div>
      </div>

      {/* Info & Actions */}
      <div className="p-3 bg-black/60 flex flex-col gap-2">
        <h3 className="text-sm font-medium text-white truncate">{name}</h3>
        <div className="flex gap-2 mt-1">
          <SpectacularButton
            variant="ghost"
            size="sm"
            className="flex-1 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onDownload?.();
            }}
          >
            <Download className="w-3 h-3 mr-1" /> Save
          </SpectacularButton>
          <SpectacularButton
            variant="ghost"
            size="sm"
            className="w-8 px-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
          >
            <Trash2 className="w-3 h-3" />
          </SpectacularButton>
        </div>
      </div>
    </GlassPanel>
  );
}
