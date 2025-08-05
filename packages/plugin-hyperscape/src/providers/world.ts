import {
  createUniqueUuid,
  logger,
  type IAgentRuntime,
  type Memory,
  type Provider,
  type ProviderResult,
} from '@elizaos/core'
import { THREE } from '@hyperscape/hyperscape'
import { HyperscapeService } from '../service'

export const hyperscapeProvider: Provider = {
  name: 'HYPERSCAPE_WORLD_STATE',
  description:
    'Provides current entity positions/rotations and agent state in the connected Hyperscape world.',
  dynamic: true,
  get: async (
    runtime: IAgentRuntime,
    _message: Memory
  ): Promise<ProviderResult> => {
    const currentDate = new Date()
    const timeOptions = {
      timeZone: 'UTC',
      dateStyle: 'full' as const,
      timeStyle: 'long' as const,
    }
    const utcTimeString = new Intl.DateTimeFormat('en-US', timeOptions).format(
      currentDate
    )

    const service = runtime.getService<HyperscapeService>(
      HyperscapeService.serviceName
    )

    if (!service || !service.isConnected()) {
      return {
        text: '# Hyperscape World State\nConnection Status: Disconnected',
        values: { hyperscape_status: 'disconnected' },
        data: { status: 'disconnected' },
      }
    }

    try {
      const world = service.getWorld()
      const messageManager = service.getMessageManager()
      const currentWorldId = service.currentWorldId
      const elizaRoomId = createUniqueUuid(
        runtime,
        currentWorldId || 'hyperscape-unknown-world'
      )
      const entities = world?.entities?.items
      const agentId = world?.entities?.player?.id

      const allEntityIds: string[] = []
      const categorizedEntities: Record<string, string[]> = {}
      let agentText = '## Agent Info (You)\nUnable to find your own entity.'

      if (entities) {
        for (const [id, entity] of entities.entries()) {
          const name = entity?.name || 'Unnamed'
          const type = (entity?.type as string) || 'unknown'
          const pos = entity?.position
          const quat = entity?.rotation
          const scale = entity?.scale
          const posStr =
            pos && pos instanceof (THREE as any).Vector3
              ? `[${[pos.x, pos.y, pos.z].map(p => p.toFixed(2)).join(', ')}]`
              : 'N/A'

          const quatStr =
            quat && quat instanceof THREE.Quaternion
              ? `[${[quat.x, quat.y, quat.z, quat.w].map(q => q.toFixed(4)).join(', ')}]`
              : 'N/A'

          const scaleStr =
            scale && scale instanceof (THREE as any).Vector3
              ? `[${[scale.x, scale.y, scale.z].map(s => s.toFixed(2)).join(', ')}]`
              : 'N/A'

          if (id === agentId) {
            agentText = `## Agent Info (You)\nEntity ID: ${id}, Name: ${name}, Position: ${posStr}, Quaternion: ${quatStr}`
            continue
          }

          allEntityIds.push(id)
          let line = `- Name: ${name}, Entity ID: ${id}, Position: ${posStr}, Quaternion: ${quatStr}`

          if (type === 'app') {
            line += `, Scale: ${scaleStr}`
          }

          if (!categorizedEntities[type]) {
            categorizedEntities[type] = []
          }

          categorizedEntities[type].push(line)
        }
      }

      let categorizedSummary = ''
      for (const [type, lines] of Object.entries(categorizedEntities)) {
        categorizedSummary += `\n\n## ${type[0].toUpperCase() + type.slice(1)} Entities (${lines.length})\n${lines.join('\n')}`
      }

      const actionsSystem = world?.actions
      const nearbyActions = (actionsSystem as any)?.getNearby(50) || []
      const currentAction = (actionsSystem as { currentNode?: unknown })
        ?.currentNode

      const actionLines = nearbyActions.map((action: any) => {
        const entity = action.ctx?.entity
        const pos = entity?.root?.position
        const posStr =
          pos && pos instanceof (THREE as any).Vector3
            ? `[${[pos.x, pos.y, pos.z].map(p => p.toFixed(2)).join(', ')}]`
            : 'N/A'

        const label = action._label ?? 'Unnamed Action'
        const entityId = entity?.data?.id ?? 'unknown'
        const entityName = entity?.data?.name ?? 'Unnamed'

        return `- Entity ID: ${entityId}, Entity Name: ${entityName}, Action: ${label}, Position: ${posStr}`
      })

      const actionHeader = `## Nearby Interactable Objects (${actionLines.length})`
      const actionBody =
        actionLines.length > 0
          ? actionLines.join('\n')
          : 'There are no interactable objects nearby.'
      const actionText = `${actionHeader}\n${actionBody}`

      const equipText = currentAction
        ? (() => {
            const entity = (currentAction as any).ctx?.entity
            const label = (currentAction as any)._label ?? 'Unnamed Action'
            const entityId = entity?.data?.id ?? 'unknown'
            const entityName = entity?.data?.name ?? 'Unnamed'
            return `## Your Equipped Item or Action\nYou are currently using:\n- Action: ${label}, Entity Name: ${entityName}, Entity ID: ${entityId}`
          })()
        : '## Your Equipped Item or Action\nYou are not currently performing or holding anything.'

      const recentMessages = await messageManager.getRecentMessages(elizaRoomId)
      const formattedHistory = recentMessages
        .map(m => `${(m as any).userId || 'Unknown'}: ${m.content.text}`)
        .join('\n')
      const lastResponseText = ''
      const lastActions = []

      let chatText = `## In-World Messages\n### Chat History\n${formattedHistory}`

      const messageText = _message.content?.text?.trim()
      if (messageText) {
        const senderId = _message.entityId
        const senderEntity = await runtime.getEntityById(senderId)
        const senderName =
          (senderEntity?.metadata?.hyperscape as any)?.username ||
          (senderEntity?.metadata?.hyperscape as any)?.name ||
          (senderEntity?.names || []).find(
            (n: string) => n.toLowerCase() !== 'anonymous'
          ) ||
          'Unknown User'

        const receivedMessageSection = [
          '### Received Message',
          `${senderName}: ${messageText}`,
          '\n### Focus your response',
          `You are replying to the above message from **${senderName}**. Keep your answer relevant to that message. Do not repeat earlier replies unless the sender asks again.`,
        ].join('\n')

        chatText += `\n\n${receivedMessageSection}`
      }

      const agentMemoryText = lastResponseText
        ? `### Your Last Response\n${lastResponseText}\n\n_Do not repeat this unless someone asks again._\n\n### Your Last Action\n${JSON.stringify(lastActions, null, 2)}`
        : `### Your Last Response\nNo recent message.\n\n### Your Last Action\n${JSON.stringify(lastActions, null, 2)}`

      const formattedText = [
        '# Hyperscape World State',
        `\n## Current UTC Time\n${utcTimeString}`,
        `\n${agentText}`,
        `${categorizedSummary}`,
        `\n${actionText}`,
        `\n${equipText}`,
        `\n${chatText}`,
        `\n${agentMemoryText}`,
      ].join('\n')

      return {
        text: formattedText,
        values: {
          // Simplified values for quick access
          hyperscapeStatus: formattedText,
          success: true,
        },
        data: {},
      }
    } catch (error: any) {
      // Add type annotation for error
      logger.error('Error getting Hyperscape state from service:', error)
      return {
        text: '# Hyperscape World State\nStatus: Error retrieving state.',
        values: { hyperscape_status: 'error' },
        data: { status: 'error', error: error.message },
      }
    }
  },
}
