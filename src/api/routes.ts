export const APIRoutes = {
  GetPlaygroundAgents: (PlaygroundApiUrl: string) =>
    `${PlaygroundApiUrl}/agents`,
  AgentRun: (PlaygroundApiUrl: string) =>
    `${PlaygroundApiUrl}/agents/{agent_id}/runs`,
  PlaygroundStatus: (PlaygroundApiUrl: string) => `${PlaygroundApiUrl}/health`,
  GetPlaygroundSessions: (PlaygroundApiUrl: string) =>
    `${PlaygroundApiUrl}/sessions`,
  GetPlaygroundSession: (PlaygroundApiUrl: string, sessionId: string) =>
    `${PlaygroundApiUrl}/sessions/${sessionId}/runs`,

  DeletePlaygroundSession: (PlaygroundApiUrl: string, sessionId: string) =>
    `${PlaygroundApiUrl}/sessions/${sessionId}`,

  GetPlayGroundTeams: (PlaygroundApiUrl: string) => `${PlaygroundApiUrl}/teams`,
  TeamRun: (PlaygroundApiUrl: string, teamId: string) =>
    `${PlaygroundApiUrl}/teams/${teamId}/runs`,
  GetPlaygroundTeamSessions: (PlaygroundApiUrl: string, teamId: string) =>
    `${PlaygroundApiUrl}/v1/playground/teams/${teamId}/sessions`,
  GetPlaygroundTeamSession: (
    PlaygroundApiUrl: string,
    teamId: string,
    sessionId: string
  ) =>
    `${PlaygroundApiUrl}/v1/playground/teams/${teamId}/sessions/${sessionId}`,
  DeletePlaygroundTeamSession: (
    PlaygroundApiUrl: string,
    teamId: string,
    sessionId: string
  ) => `${PlaygroundApiUrl}/v1/playground/teams/${teamId}/sessions/${sessionId}`
}
