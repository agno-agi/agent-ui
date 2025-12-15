// Provider types for auto-populated fields
export type SessionStateProvider = 'google_email' | 'google_name'

export interface SessionStateField {
  label?: string
  placeholder?: string
  required?: boolean
  // If provider is set, the field is auto-populated and hidden from the UI
  provider?: SessionStateProvider
}

export interface SessionStateSchema {
  [key: string]: SessionStateField
}

// Workflow session state schemas
// Map workflow_id to required session state fields
export const WORKFLOW_SCHEMAS: Record<string, SessionStateSchema> = {
  'galileo-workflow': {
    user_id: {
      label: 'User ID',
      required: true,
      provider: 'google_email' // Auto-populated from Google auth, hidden from UI
    },
    building_id: {
      label: 'Building ID',
      placeholder: '12345',
      required: true
    }
  }
}

// Agent session state schemas
// Map agent_id to required session state fields
export const AGENT_SCHEMAS: Record<string, SessionStateSchema> = {
  'agent-translator': {
    'source_language': {
      label: 'Source Language',
      placeholder: 'en, es, fr, etc.',
      required: true
    },
    'target_language': {
      label: 'Target Language',
      placeholder: 'en, es, fr, etc.',
      required: true
    },
    'formality': {
      label: 'Formality Level',
      placeholder: 'casual, formal',
      required: false
    }
  },
  'agent-code-reviewer': {
    'programming_language': {
      label: 'Programming Language',
      placeholder: 'javascript, python, etc.',
      required: true
    },
    'review_focus': {
      label: 'Review Focus',
      placeholder: 'security, performance, style',
      required: false
    }
  }
  // Add more agents as needed
}

// Team session state schemas
// Map team_id to required session state fields
export const TEAM_SCHEMAS: Record<string, SessionStateSchema> = {
  'team-research': {
    'project_id': {
      label: 'Project ID',
      placeholder: 'Enter project ID',
      required: true
    },
    'research_domain': {
      label: 'Research Domain',
      placeholder: 'AI, Biology, Physics, etc.',
      required: true
    },
    'deadline': {
      label: 'Deadline',
      placeholder: 'YYYY-MM-DD',
      required: false
    }
  },
  'team-content-creation': {
    'brand_voice': {
      label: 'Brand Voice',
      placeholder: 'professional, casual, technical',
      required: true
    },
    'target_audience': {
      label: 'Target Audience',
      placeholder: 'developers, executives, etc.',
      required: false
    }
  }
  // Add more teams as needed
}

/**
 * Get the session state schema for a given entity
 * @param mode - The entity type (agent, team, or workflow)
 * @param entityId - The ID of the entity
 * @returns The session state schema or null if not found
 */
export function getSessionStateSchema(
  mode: 'agent' | 'team' | 'workflow',
  entityId: string | null | undefined
): SessionStateSchema | null {
  if (!entityId) return null

  switch (mode) {
    case 'workflow':
      return WORKFLOW_SCHEMAS[entityId] || null
    case 'agent':
      return AGENT_SCHEMAS[entityId] || null
    case 'team':
      return TEAM_SCHEMAS[entityId] || null
    default:
      return null
  }
}

/**
 * Check if an entity requires session state configuration
 * @param mode - The entity type (agent, team, or workflow)
 * @param entityId - The ID of the entity
 * @returns True if the entity has a session state schema
 */
export function requiresSessionState(
  mode: 'agent' | 'team' | 'workflow',
  entityId: string | null | undefined
): boolean {
  return !!getSessionStateSchema(mode, entityId)
}
