import React, { useEffect, useState } from 'react'
import type { World } from '../../../types'
import type { PlayerStats, PlayerEquipmentItems } from '../../../types/core'
import { PlayerMigration, WeaponType } from '../../../types/core'
import { EventType } from '../../../types/events'

interface CombatPanelProps {
  world: World
  stats: PlayerStats | null
  equipment: PlayerEquipmentItems | null
}

export function CombatPanel({ world, stats, equipment }: CombatPanelProps) {
  const [style, setStyle] = useState<string>('accurate')
  const [cooldown, setCooldown] = useState<number>(0)
  const combatLevel = (typeof stats?.combatLevel === 'number')
    ? (stats!.combatLevel as number)
    : (stats?.skills ? PlayerMigration.calculateCombatLevel(stats.skills) : 1)

  useEffect(() => {
    const id = world.entities.player?.id
    if (!id) return
    const api = (world as unknown as { api?: { getAttackStyleInfo?: (playerId: string, cb: (info: { style: string; cooldown?: number }) => void) => void } }).api
    api?.getAttackStyleInfo?.(id, (info: { style: string; cooldown?: number }) => {
      if (info) {
        setStyle(info.style)
        setCooldown(info.cooldown || 0)
      }
    })
    const onUpdate = (data: { playerId: string; currentStyle: { id: string } }) => {
      if (data.playerId !== id) return
      setStyle(data.currentStyle.id)
    }
    const onChanged = (data: { playerId: string; currentStyle: { id: string } }) => {
      if (data.playerId !== id) return
      setStyle(data.currentStyle.id)
    }
    world.on(EventType.UI_ATTACK_STYLE_UPDATE, onUpdate)
    world.on(EventType.UI_ATTACK_STYLE_CHANGED, onChanged)
    return () => {
      world.off(EventType.UI_ATTACK_STYLE_UPDATE, onUpdate)
      world.off(EventType.UI_ATTACK_STYLE_CHANGED, onChanged)
    }
  }, [world, world.entities.player?.id])

  const changeStyle = (next: string) => {
    const id = world.entities.player?.id
    if (!id) return
    const api = (world as unknown as { api?: { changeAttackStyle?: (playerId: string, style: string) => void } }).api
    api?.changeAttackStyle?.(id, next)
  }

  // Determine if ranged weapon equipped; if so, limit to ranged/defense like RS
  const isRanged = !!(equipment?.arrows || (equipment?.weapon && (equipment.weapon.weaponType === WeaponType.BOW || equipment.weapon.weaponType === WeaponType.CROSSBOW)))
  const styles: Array<{ id: string; label: string }> = isRanged
    ? [
        { id: 'accurate', label: 'Ranged' },
        { id: 'defensive', label: 'Defensive' },
      ]
    : [
        { id: 'accurate', label: 'Accurate' },
        { id: 'aggressive', label: 'Aggressive' },
        { id: 'defensive', label: 'Defensive' },
      ]

  return (
    <div className="flex flex-col gap-2">
      <div className="bg-black/35 border border-white/[0.08] rounded-md p-2 flex items-center justify-between">
        <div className="font-semibold">Combat level</div>
        <div>{combatLevel}</div>
      </div>
      <div className="font-semibold mt-1">Attack style</div>
      <div className="grid grid-cols-2 gap-1.5">
        {styles.map(s => (
          <button key={s.id}
            onClick={() => changeStyle(s.id)}
            disabled={cooldown > 0}
            className={`rounded-md py-2 px-2.5 cursor-pointer text-gray-200 ${
              style === s.id 
                ? 'bg-blue-500/25 border border-blue-500/70' 
                : 'bg-black/35 border border-white/[0.08]'
            }`}
          >{s.label}</button>
        ))}
      </div>
      {cooldown > 0 && (
        <div className="text-xs text-gray-400">Style change available in {Math.ceil(cooldown / 1000)}s</div>
      )}
    </div>
  )
}


