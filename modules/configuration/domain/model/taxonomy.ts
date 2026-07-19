import type { TaxonomyStatus } from '../enums/configuration.enum'

export interface Taxonomy {
  id: string
  taxonomyCode: string
  name: string
  status: TaxonomyStatus | string
}

export interface TaxonomyTerm {
  id: string
  taxonomyId: string
  parentTermId: string | null
  termCode: string
  label: string
}

export interface CreateTaxonomyPayload {
  taxonomyCode: string
  name: string
}

export interface CreateTaxonomyTermPayload {
  termCode: string
  label: string
  parentTermId?: string
}
