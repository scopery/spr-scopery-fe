export const AiMessageRole = {
  User: 'USER',
  Assistant: 'ASSISTANT',
  System: 'SYSTEM',
  ToolRequest: 'TOOL_REQUEST',
  ToolResult: 'TOOL_RESULT',
} as const
export type AiMessageRole = (typeof AiMessageRole)[keyof typeof AiMessageRole]

export const AiConversationType = {
  GeneralGuide: 'GENERAL_GUIDE',
  ProjectAssistant: 'PROJECT_ASSISTANT',
} as const
export type AiConversationType =
  (typeof AiConversationType)[keyof typeof AiConversationType]

export const AiCapabilityLevel = {
  Guide: 'GUIDE',
  ContextualAnswer: 'CONTEXTUAL_ANSWER',
} as const
export type AiCapabilityLevel =
  (typeof AiCapabilityLevel)[keyof typeof AiCapabilityLevel]

export const AiConversationStatus = {
  Active: 'ACTIVE',
  Archived: 'ARCHIVED',
  Deleted: 'DELETED',
} as const
export type AiConversationStatus =
  (typeof AiConversationStatus)[keyof typeof AiConversationStatus]

export const AiMessageStatus = {
  Received: 'RECEIVED',
  Queued: 'QUEUED',
  Contextualizing: 'CONTEXTUALIZING',
  Retrieving: 'RETRIEVING',
  Generating: 'GENERATING',
  Streaming: 'STREAMING',
  CancelRequested: 'CANCEL_REQUESTED',
  Completed: 'COMPLETED',
  Failed: 'FAILED',
  Cancelled: 'CANCELLED',
  Blocked: 'BLOCKED',
} as const
export type AiMessageStatus = (typeof AiMessageStatus)[keyof typeof AiMessageStatus]

export const AiStreamUiState = {
  Idle: 'IDLE',
  Starting: 'STARTING',
  Connecting: 'CONNECTING',
  Connected: 'CONNECTED',
  Reconnecting: 'RECONNECTING',
  Cancelling: 'CANCELLING',
  Completed: 'COMPLETED',
  Failed: 'FAILED',
  Cancelled: 'CANCELLED',
} as const
export type AiStreamUiState = (typeof AiStreamUiState)[keyof typeof AiStreamUiState]

export const AiSuggestionState = {
  Suggested: 'SUGGESTED',
  Accepted: 'ACCEPTED',
  Applied: 'APPLIED',
  Rejected: 'REJECTED',
} as const
export type AiSuggestionState =
  (typeof AiSuggestionState)[keyof typeof AiSuggestionState]
