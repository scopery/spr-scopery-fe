import { describe, expect, it } from 'vitest'
import {
  DocumentIconGroup,
  getDocumentFileIcon,
  getDocumentIconGroup,
  listDocumentTypesInIconGroup,
} from './document-icon-groups'

describe('document icon groups', () => {
  it('maps many types into a few groups', () => {
    expect(getDocumentIconGroup('meeting_note')).toBe(DocumentIconGroup.Notes)
    expect(getDocumentIconGroup('business_requirements_document')).toBe(
      DocumentIconGroup.Requirements
    )
    expect(getDocumentIconGroup('risk_log')).toBe(DocumentIconGroup.Governance)
    expect(getDocumentIconGroup('traceability_report')).toBe(DocumentIconGroup.Reports)
    expect(getDocumentIconGroup('uploaded_reference')).toBe(DocumentIconGroup.Assets)
  })

  it('falls back to Other for unknown types', () => {
    expect(getDocumentIconGroup('future_type')).toBe(DocumentIconGroup.Other)
    expect(getDocumentIconGroup(null)).toBe(DocumentIconGroup.Other)
  })

  it('resolves per-group icons from /icons', () => {
    expect(getDocumentFileIcon('note').src).toBe('/icons/notes-icon.png')
    expect(getDocumentFileIcon('requirement_brief').src).toBe('/icons/reqs-icons.png')
    expect(getDocumentFileIcon('risk_log').src).toBe('/icons/control-icon.png')
    expect(getDocumentFileIcon('traceability_report').src).toBe('/icons/report-icon.png')
    expect(getDocumentFileIcon('other').src).toBe('/icons/other-icon.png')
    // No dedicated Assets art yet — reuses Other
    expect(getDocumentFileIcon('uploaded_reference').src).toBe('/icons/other-icon.png')
  })

  it('lists types in a group', () => {
    const notes = listDocumentTypesInIconGroup(DocumentIconGroup.Notes)
    expect(notes).toContain('meeting_note')
    expect(notes).not.toContain('risk_log')
  })
})
