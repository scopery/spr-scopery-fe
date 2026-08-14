import type {
  ApplicationComponentDetail,
  ComponentOption,
  DataEntityField,
  ScreenEventItem,
  ScreenFieldDetail,
  ScreenMode,
  ScreenProcessItem,
} from './screen-spec'

export interface ScreenSpecDoc {
  id: string
  projectId: string
  documentCode: string
  documentName: string
  projectName: string | null
  systemName: string | null
  phaseName: string | null
  language: string | null
  overview: string | null
  figmaUrl: string | null
  status: string
  screens?: ScreenSpecDocScreenRef[]
}

export interface ScreenSpecDocScreenRef {
  screenId: string
  displayOrder: number | null
  note: string | null
  code: string | null
  name: string | null
  routePath: string | null
}

export interface CreateScreenSpecDocBody {
  projectId: string
  documentCode: string
  documentName: string
  projectName?: string | null
  systemName?: string | null
  phaseName?: string | null
  language?: string | null
  overview?: string | null
  figmaUrl?: string | null
}

export interface UpdateScreenSpecDocBody {
  documentName: string
  projectName?: string | null
  systemName?: string | null
  phaseName?: string | null
  language?: string | null
  overview?: string | null
  figmaUrl?: string | null
}

export interface AddScreenSpecDocScreenBody {
  screenId: string
  displayOrder?: number | null
  note?: string | null
}

export interface ScreenSpecDocRevision {
  id: string
  revisionNo: string
  targetSheetName: string | null
  details: string | null
  personInCharge: string | null
  color: string | null
  changedAt: string | null
  displayOrder: number | null
}

export interface UpsertScreenSpecDocRevisionBody {
  revisionNo: string
  targetSheetName?: string | null
  details?: string | null
  personInCharge?: string | null
  color?: string | null
  changedAt?: string | null
  displayOrder?: number | null
}

export interface ScreenFullSpecSection {
  id: string
  name: string
  description: string | null
  displayOrder: number | null
  status?: string
}

export interface ScreenFullSpecDataField extends DataEntityField {
  tableName: string | null
  entityName: string | null
}

export interface ScreenFullSpecComponent extends ApplicationComponentDetail {
  options: ComponentOption[] | null
}

export interface ScreenFullSpecField extends ScreenFieldDetail {
  component: ScreenFullSpecComponent | null
  dataField: ScreenFullSpecDataField | null
}

export interface ScreenFullSpec {
  id: string
  code: string
  name: string
  routePath: string | null
  status: string
  modes: ScreenMode[]
  sections: ScreenFullSpecSection[]
  fields: ScreenFullSpecField[]
  processItems: ScreenProcessItem[]
  eventItems: ScreenEventItem[]
}

export interface ScreenSpecDocFullSpecScreen {
  displayOrder: number | null
  note: string | null
  screen: ScreenFullSpec
}

export interface ScreenSpecDocFullSpec {
  id: string
  projectId: string
  documentCode: string
  documentName: string
  projectName: string | null
  systemName: string | null
  phaseName: string | null
  language: string | null
  overview: string | null
  figmaUrl: string | null
  status: string
  revisions: ScreenSpecDocRevision[]
  screens: ScreenSpecDocFullSpecScreen[]
}
