import {
  DefectCategory,
  DefectPriority,
  DefectSeverity,
  ReleaseType,
  TestCasePriority,
  TestCaseType,
  TestLevel,
  TestRunType,
  TraceLinkType,
} from '../../domain/enums/quality.enum'
import type {
  CreateDefectPayload,
  CreateQualityPlanPayload,
  CreateReleasePayload,
  CreateTestCasePayload,
  CreateTestPlanPayload,
  CreateTestRunPayload,
  CreateTestSuitePayload,
} from '../../domain/model/quality'

export type QualityBulkKind =
  | 'QUALITY_PLAN'
  | 'TEST_PLAN'
  | 'TEST_SUITE'
  | 'TEST_CASE'
  | 'TEST_RUN'
  | 'DEFECT'
  | 'RELEASE'
  | 'TRACE_LINK'

export interface QualityColumnDef {
  key: string
  label: string
  required?: boolean
  placeholder?: string
}

export type QualityDraftValues = Record<string, string>

export const QUALITY_BULK_COLUMNS: Record<QualityBulkKind, QualityColumnDef[]> = {
  QUALITY_PLAN: [
    { key: 'code', label: 'Code', placeholder: 'QP-001' },
    { key: 'name', label: 'Name', required: true, placeholder: 'Quality plan' },
    { key: 'description', label: 'Description', placeholder: 'Optional' },
  ],
  TEST_PLAN: [
    { key: 'code', label: 'Code', placeholder: 'TP-001' },
    { key: 'name', label: 'Name', required: true, placeholder: 'System test' },
    { key: 'testLevel', label: 'Level', required: true, placeholder: 'SYSTEM' },
    { key: 'description', label: 'Description', placeholder: 'Optional' },
  ],
  TEST_SUITE: [
    { key: 'name', label: 'Name', required: true, placeholder: 'Login suite' },
    { key: 'description', label: 'Description', placeholder: 'Optional' },
  ],
  TEST_CASE: [
    { key: 'code', label: 'Code', placeholder: 'TC-001' },
    { key: 'title', label: 'Title', required: true, placeholder: 'Login success' },
    { key: 'type', label: 'Type', required: true, placeholder: 'FUNCTIONAL' },
    { key: 'priority', label: 'Priority', required: true, placeholder: 'MEDIUM' },
    { key: 'preconditions', label: 'Preconditions', placeholder: 'Optional' },
    { key: 'expectedResult', label: 'Expected', placeholder: 'Optional' },
  ],
  TEST_RUN: [
    { key: 'name', label: 'Name', required: true, placeholder: 'Sprint 12 run' },
    { key: 'runType', label: 'Run type', required: true, placeholder: 'MANUAL' },
  ],
  DEFECT: [
    { key: 'code', label: 'Code', placeholder: 'DEF-001' },
    { key: 'title', label: 'Title', required: true, placeholder: 'Login fails' },
    { key: 'category', label: 'Category', required: true, placeholder: 'FUNCTIONAL' },
    { key: 'severity', label: 'Severity', required: true, placeholder: 'MAJOR' },
    { key: 'priority', label: 'Priority', required: true, placeholder: 'P2' },
    { key: 'description', label: 'Description', placeholder: 'Optional' },
  ],
  RELEASE: [
    { key: 'code', label: 'Code', required: true, placeholder: 'REL-1.0.0' },
    { key: 'versionLabel', label: 'Version', required: true, placeholder: '1.0.0' },
    { key: 'name', label: 'Name', required: true, placeholder: 'MVP release' },
    { key: 'releaseType', label: 'Type', required: true, placeholder: 'MINOR' },
    { key: 'description', label: 'Description', placeholder: 'Optional' },
  ],
  TRACE_LINK: [
    { key: 'sourceType', label: 'Source type', required: true, placeholder: 'REQUIREMENT' },
    { key: 'sourceId', label: 'Source ID', required: true, placeholder: 'uuid' },
    { key: 'targetType', label: 'Target type', required: true, placeholder: 'TEST_CASE' },
    { key: 'targetId', label: 'Target ID', required: true, placeholder: 'uuid' },
    { key: 'linkType', label: 'Link type', required: true, placeholder: 'TESTED_BY' },
  ],
}

export const QUALITY_BULK_TITLES: Record<QualityBulkKind, string> = {
  QUALITY_PLAN: 'Bulk add quality plans',
  TEST_PLAN: 'Bulk add test plans',
  TEST_SUITE: 'Bulk add test suites',
  TEST_CASE: 'Bulk add test cases',
  TEST_RUN: 'Bulk add test runs',
  DEFECT: 'Bulk add defects',
  RELEASE: 'Bulk add releases',
  TRACE_LINK: 'Bulk add trace links',
}

export const QUALITY_SINGLE_TITLES: Record<QualityBulkKind, string> = {
  QUALITY_PLAN: 'Create quality plan',
  TEST_PLAN: 'Create test plan',
  TEST_SUITE: 'Create test suite',
  TEST_CASE: 'Create test case',
  TEST_RUN: 'Create test run',
  DEFECT: 'Create defect',
  RELEASE: 'Create release',
  TRACE_LINK: 'Create trace link',
}

export const QUALITY_ADD_LABELS: Record<QualityBulkKind, string> = {
  QUALITY_PLAN: 'Quality plan',
  TEST_PLAN: 'Test plan',
  TEST_SUITE: 'Test suite',
  TEST_CASE: 'Test case',
  TEST_RUN: 'Test run',
  DEFECT: 'Defect',
  RELEASE: 'Release',
  TRACE_LINK: 'Trace link',
}

function enumOr(value: string, allowed: readonly string[], fallback: string): string {
  const v = value.trim().toUpperCase().replace(/\s+/g, '_')
  if (!v) return fallback
  return (allowed as string[]).includes(v) ? v : fallback
}

export function emptyDraftValues(kind: QualityBulkKind): QualityDraftValues {
  const values: QualityDraftValues = {}
  for (const col of QUALITY_BULK_COLUMNS[kind]) {
    values[col.key] = ''
  }
  // sensible defaults for required enums
  if (kind === 'TEST_PLAN') values.testLevel = TestLevel.System
  if (kind === 'TEST_CASE') {
    values.type = TestCaseType.Functional
    values.priority = TestCasePriority.Medium
  }
  if (kind === 'TEST_RUN') values.runType = TestRunType.Manual
  if (kind === 'DEFECT') {
    values.category = DefectCategory.Functional
    values.severity = DefectSeverity.Major
    values.priority = DefectPriority.P2
  }
  if (kind === 'RELEASE') values.releaseType = ReleaseType.Minor
  if (kind === 'TRACE_LINK') {
    values.sourceType = 'REQUIREMENT'
    values.targetType = 'TEST_CASE'
    values.linkType = TraceLinkType.TestedBy
  }
  return values
}

export function isDraftRowValid(kind: QualityBulkKind, values: QualityDraftValues): boolean {
  return QUALITY_BULK_COLUMNS[kind].every((col) => {
    if (!col.required) return true
    return Boolean((values[col.key] ?? '').trim())
  })
}

export function isDraftRowBlank(kind: QualityBulkKind, values: QualityDraftValues): boolean {
  return QUALITY_BULK_COLUMNS[kind].every((col) => !(values[col.key] ?? '').trim())
}

export type QualityCreateInput =
  | { kind: 'QUALITY_PLAN'; payload: CreateQualityPlanPayload }
  | { kind: 'TEST_PLAN'; payload: CreateTestPlanPayload }
  | { kind: 'TEST_SUITE'; payload: CreateTestSuitePayload }
  | { kind: 'TEST_CASE'; payload: CreateTestCasePayload }
  | { kind: 'TEST_RUN'; payload: CreateTestRunPayload }
  | { kind: 'DEFECT'; payload: CreateDefectPayload }
  | { kind: 'RELEASE'; payload: CreateReleasePayload }
  | {
      kind: 'TRACE_LINK'
      payload: {
        sourceType: string
        sourceId: string
        targetType: string
        targetId: string
        linkType: string
      }
    }

export function mapDraftToCreateInput(
  kind: QualityBulkKind,
  values: QualityDraftValues
): QualityCreateInput {
  const g = (key: string) => (values[key] ?? '').trim()

  switch (kind) {
    case 'QUALITY_PLAN':
      return {
        kind,
        payload: {
          name: g('name'),
          code: g('code') || null,
          description: g('description') || null,
        },
      }
    case 'TEST_PLAN':
      return {
        kind,
        payload: {
          name: g('name'),
          code: g('code') || null,
          description: g('description') || null,
          testLevel: enumOr(g('testLevel'), Object.values(TestLevel), TestLevel.System),
        },
      }
    case 'TEST_SUITE':
      return {
        kind,
        payload: {
          name: g('name'),
          description: g('description') || null,
        },
      }
    case 'TEST_CASE':
      return {
        kind,
        payload: {
          title: g('title'),
          code: g('code') || null,
          type: enumOr(g('type'), Object.values(TestCaseType), TestCaseType.Functional),
          priority: enumOr(
            g('priority'),
            Object.values(TestCasePriority),
            TestCasePriority.Medium
          ),
          preconditions: g('preconditions') || null,
          expectedResult: g('expectedResult') || null,
        },
      }
    case 'TEST_RUN':
      return {
        kind,
        payload: {
          name: g('name'),
          runType: enumOr(g('runType'), Object.values(TestRunType), TestRunType.Manual),
        },
      }
    case 'DEFECT':
      return {
        kind,
        payload: {
          title: g('title'),
          code: g('code') || null,
          description: g('description') || null,
          category: enumOr(g('category'), Object.values(DefectCategory), DefectCategory.Functional),
          severity: enumOr(g('severity'), Object.values(DefectSeverity), DefectSeverity.Major),
          priority: enumOr(g('priority'), Object.values(DefectPriority), DefectPriority.P2),
        },
      }
    case 'RELEASE':
      return {
        kind,
        payload: {
          code: g('code'),
          versionLabel: g('versionLabel'),
          name: g('name'),
          releaseType: enumOr(g('releaseType'), Object.values(ReleaseType), ReleaseType.Minor),
          description: g('description') || null,
        },
      }
    case 'TRACE_LINK':
      return {
        kind,
        payload: {
          sourceType: g('sourceType'),
          sourceId: g('sourceId'),
          targetType: g('targetType'),
          targetId: g('targetId'),
          linkType: enumOr(g('linkType'), Object.values(TraceLinkType), TraceLinkType.TestedBy),
        },
      }
  }
}
