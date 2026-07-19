/**
 * DocumentContentGateway — UI never chooses /draft vs /content.
 * Wave 4.1 canonical paths: GET/PUT /content + /revisions*.
 */

import type { Value } from 'platejs'
import * as contentApi from './document-content.api'
import { parseAstToPlateValue, plateValueToAst } from '../model/ast-adapter'
import {
  ContentRevisionType,
  type ContentRevisionType as RevisionType,
  type DocumentContentResponse,
  type DocumentRevisionDetail,
  type DocumentRevisionListItem,
} from '../model/document-content'

export interface EditableDocumentContent {
  revisionNo: number
  value: Value
  plainText?: string
  wordCount?: number
  checksum?: string
  schemaVersion: number
  lastSavedAt?: string
  raw: DocumentContentResponse
}

function toEditable(res: DocumentContentResponse): EditableDocumentContent {
  return {
    revisionNo: res.revisionNo ?? 0,
    value: parseAstToPlateValue(res.ast),
    plainText: res.plainText,
    wordCount: res.wordCount,
    checksum: res.checksum,
    schemaVersion: res.schemaVersion ?? 1,
    lastSavedAt: res.lastSavedAt ?? res.updatedAt,
    raw: res,
  }
}

export async function getEditableContent(
  projectId: string,
  documentId: string
): Promise<EditableDocumentContent> {
  const res = await contentApi.getDocumentContent(projectId, documentId)
  return toEditable(res)
}

export async function saveEditableContent(
  projectId: string,
  documentId: string,
  args: {
    value: Value
    expectedBaseRevisionNo: number
    revisionType?: RevisionType
    schemaVersion?: number
  }
): Promise<EditableDocumentContent> {
  const res = await contentApi.saveDocumentContent(projectId, documentId, {
    ast: plateValueToAst(args.value),
    expectedBaseRevisionNo: args.expectedBaseRevisionNo,
    schemaVersion: args.schemaVersion ?? 1,
    revisionType: args.revisionType ?? ContentRevisionType.Manual,
  })
  return toEditable(res)
}

export async function listVersions(
  projectId: string,
  documentId: string,
  params?: { page?: number; size?: number }
): Promise<{ items: DocumentRevisionListItem[]; total?: number }> {
  return contentApi.listDocumentRevisions(projectId, documentId, params)
}

export async function getVersion(
  projectId: string,
  documentId: string,
  revisionNo: number
): Promise<DocumentRevisionDetail> {
  return contentApi.getDocumentRevision(projectId, documentId, revisionNo)
}

export async function restoreVersion(
  projectId: string,
  documentId: string,
  revisionNo: number
): Promise<EditableDocumentContent> {
  const res = await contentApi.restoreDocumentRevision(projectId, documentId, revisionNo)
  return toEditable(res)
}

export const DocumentContentGateway = {
  getEditableContent,
  saveEditableContent,
  listVersions,
  getVersion,
  restoreVersion,
} as const
