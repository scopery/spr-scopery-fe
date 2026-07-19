import { apiClient } from '@/shared/lib/apiClient'
import { CONFIGURATION_ENDPOINTS } from './endpoints'
import type {
  CreateTaxonomyPayload,
  CreateTaxonomyTermPayload,
  Taxonomy,
  TaxonomyTerm,
} from '../../domain/model/taxonomy'

export async function listTaxonomies(workspaceId: string): Promise<Taxonomy[]> {
  return apiClient.get<Taxonomy[]>(CONFIGURATION_ENDPOINTS.taxonomies.list(workspaceId))
}

export async function createTaxonomy(
  workspaceId: string,
  body: CreateTaxonomyPayload
): Promise<Taxonomy> {
  return apiClient.post<Taxonomy>(CONFIGURATION_ENDPOINTS.taxonomies.create(workspaceId), body)
}

export async function listTaxonomyTerms(
  workspaceId: string,
  taxonomyId: string
): Promise<TaxonomyTerm[]> {
  return apiClient.get<TaxonomyTerm[]>(
    CONFIGURATION_ENDPOINTS.taxonomies.terms.list(workspaceId, taxonomyId)
  )
}

export async function createTaxonomyTerm(
  workspaceId: string,
  taxonomyId: string,
  body: CreateTaxonomyTermPayload
): Promise<TaxonomyTerm> {
  return apiClient.post<TaxonomyTerm>(
    CONFIGURATION_ENDPOINTS.taxonomies.terms.create(workspaceId, taxonomyId),
    body
  )
}
