import {
  Content,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  Action,
  ActionResult,
  ActionExample,
  ModelType,
} from '@elizaos/core'
import { HyperscapeService } from '../service'

export async function ambient(
  runtime: IAgentRuntime,
  message: Memory,
  state: State,
  _options: any,
  callback?: HandlerCallback
): Promise<ActionResult> {
  // Lazy evaluation via callback for immediate response
  if (callback) {
    const quickResult: ActionResult = {
      text: 'Observing my surroundings...',
      success: true,
      values: { observing: true },
      data: { action: 'ambient' },
    }
    callback({
      text: quickResult.text,
      actions: ['HYPERSCAPE_AMBIENT_SPEECH'],
      source: 'hyperscape',
    })
  }

  try {
    // Get service
    const service = runtime.getService<HyperscapeService>('hyperscape')
    if (!service?.isConnected()) {
      return {
        text: "I'm not currently connected to a world.",
        success: false,
        values: { error: 'Not connected' },
        data: { action: 'ambient' },
      }
    }

    // Extract content
    const content = (message.content as Content) || {}
    const text = content.text || ''

    // Just use the user's text directly - let the handler deal with it
    const thought = text

    // Get world state for context
    const world = service.getWorld()
    const nearbyPlayers: any[] = []
    const nearbyEntities: any[] = []

    if (world) {
      // Get nearby entities from world
      // This would need to be implemented properly
    }

    // Create a simple ambient description
    const parts: string[] = []

    if (nearbyPlayers.length > 0) {
      const playerNames = nearbyPlayers
        .map((p: any) => p.username || 'someone')
        .join(', ')
      parts.push(`I notice ${playerNames} nearby`)
    }

    if (nearbyEntities.length > 0) {
      parts.push(`There are ${nearbyEntities.length} objects around me`)
    }

    if (parts.length === 0) {
      parts.push(`The area seems quiet`)
    }

    const ambientText = parts.join('. ') + '.'

    // Get available actions based on context
    const availableActions: string[] = []

    // Basic actions always available
    availableActions.push('perception', 'walk_randomly')

    // Add contextual actions
    if (nearbyPlayers.length > 0) {
      availableActions.push('reply')
    }

    if (nearbyEntities.length > 0) {
      availableActions.push('use', 'goto')
    }

    const result = {
      thought: thought,
      text: ambientText,
      actions: availableActions,
      source: 'hyperscape_ambient',
    }

    const actionResult: ActionResult = {
      ...result,
      success: true,
    }

    // For ambient actions, use the full model for more thoughtful responses
    const response = await runtime.useModel(
      ModelType.LARGE, // Uses high-temp for creativity
      `You are observing your surroundings in a 3D virtual world.
      Current context: ${ambientText}
      Available actions: ${availableActions.join(', ')}
      
      Respond with a brief, natural observation or thought about what you notice.
      Keep it conversational and in-character.
      
      User input: ${thought || 'What do you see?'}`
    )

    if (response) {
      actionResult.text = response
    }

    // Store the observation in memory for continuity
    try {
      await runtime.createMemory(
        {
          content: {
            text: actionResult.text,
            action: 'ambient',
          },
          metadata: {
            type: 'ambient_observation',
            nearbyPlayers: nearbyPlayers.length,
            nearbyEntities: nearbyEntities.length,
            availableActions,
          },
          entityId: runtime.agentId,
          roomId: message.roomId || runtime.agentId,
        },
        message.roomId || runtime.agentId
      )
    } catch (error) {
      // Memory creation is optional
      console.debug('Failed to create ambient memory:', error)
    }

    const finalResult: ActionResult = {
      text: actionResult.text,
      success: true,
      values: { actions: availableActions },
      data: {
        action: 'ambient',
        thought: thought,
        source: 'hyperscape_ambient',
      },
    }

    if (callback) {
      callback({
        text: finalResult.text,
        actions: ['HYPERSCAPE_AMBIENT_SPEECH'],
        source: 'hyperscape',
      })
    }
    return finalResult
  } catch (error: any) {
    const errorResult: ActionResult = {
      text: 'I had trouble observing my surroundings.',
      success: false,
      values: { error: error.message },
      data: { action: 'ambient', error: error.message },
    }
    if (callback) {
      callback({
        text: errorResult.text,
        actions: ['HYPERSCAPE_AMBIENT_SPEECH'],
        source: 'hyperscape',
      })
    }
    return errorResult
  }
}

export const ambientAction: Action = {
  name: 'ambient',
  similes: ['observe', 'look around', 'survey', 'notice', 'sense'],
  description: 'Observe and describe the current surroundings',
  examples: [
    [
      {
        name: '{{user}}',
        content: {
          text: 'What do you see around you?',
        },
      },
      {
        name: '{{agent}}',
        content: {
          text: 'I notice several players nearby and various objects scattered around. The area feels quite active.',
          actions: ['HYPERSCAPE_AMBIENT_SPEECH'],
        },
      },
    ],
    [
      {
        name: '{{user}}',
        content: {
          text: 'Observe your surroundings',
        },
      },
      {
        name: '{{agent}}',
        content: {
          text: 'I see alice and bob nearby. There are 3 objects around me including what appears to be a crafting station.',
          actions: ['HYPERSCAPE_AMBIENT_SPEECH'],
        },
      },
    ],
  ],
  handler: ambient,
  validate: async (runtime: IAgentRuntime) => {
    const service = runtime.getService<HyperscapeService>('hyperscape')
    return service?.isConnected() || false
  },
}
