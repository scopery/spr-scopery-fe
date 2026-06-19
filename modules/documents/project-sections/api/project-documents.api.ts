import { UNSECTIONED_SECTION_KEY } from '../model/project-section-types'
import {
  detachDocumentFromProject,
  pinProjectDocument,
} from '@/modules/documents/document/api/documents.api'
import { exportProjectHandoffPackage as exportProjectHandoffPackageRaw } from '@/modules/documents/document-export/api/document-export.api'
import type { ProjectDocumentsFilters, ProjectSectionFormValues } from '../model/project-documents'
import * as projectSectionsApi from './project-sections.api'

export async function listProjectDocumentsWorkspace(
  orgId: string,
  projectId: string,
  filters?: ProjectDocumentsFilters
) {
  return Promise.all([
    projectSectionsApi.listProjectDocumentsGrouped(orgId, projectId, {
      q: filters?.q || undefined,
      document_type: filters?.document_type || undefined,
      status: filters?.status ?? 'active',
      workflow_status: filters?.workflow_status || undefined,
      section_id:
        filters?.section_id && filters.section_id !== UNSECTIONED_SECTION_KEY
          ? filters.section_id
          : undefined,
      pinned_only: filters?.pinned_only || undefined,
    }),
    projectSectionsApi.listProjectSections(orgId, projectId),
  ]).then(([grouped, sections]) => ({ grouped, sections }))
}

export { pinProjectDocument, detachDocumentFromProject }

export function createProjectSection(
  orgId: string,
  projectId: string,
  values: ProjectSectionFormValues
) {
  return projectSectionsApi.createProjectSection(orgId, projectId, values)
}

export function updateProjectSection(
  orgId: string,
  projectId: string,
  sectionId: string,
  values: ProjectSectionFormValues
) {
  return projectSectionsApi.updateProjectSection(orgId, projectId, sectionId, values)
}

export const archiveProjectSection = projectSectionsApi.archiveProjectSection
export const createDefaultProjectSections = projectSectionsApi.createDefaultProjectSections
export const reorderProjectSections = projectSectionsApi.reorderProjectSections
export const reorderDocumentsInSection = projectSectionsApi.reorderDocumentsInSection
export const moveDocumentToSection = projectSectionsApi.moveDocumentToSection

export function exportProjectHandoffPackage(orgId: string, projectId: string) {
  return exportProjectHandoffPackageRaw(orgId, projectId, {
    include_requirements_list: true,
    include_evidence_index: true,
    package_format: 'zip',
  })
}
