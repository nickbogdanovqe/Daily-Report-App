export type OverallStatus = 'On track' | 'At risk' | 'Blocked'

export type DefectStatus =
  | 'New'
  | 'Open'
  | 'In progress'
  | 'Fixed'
  | 'Verified'
  | "Won't fix"

export interface ListItem {
  id: string
  text: string
  jiraId?: string
}

export interface Defect {
  id: string
  title: string
  status: DefectStatus
  link: string
  note: string
}

export interface Draft {
  reportDate: string
  overallStatus: OverallStatus
  overallStatusCustom: string
  jiraBaseUrl: string
  summary: string
  tasks: ListItem[]
  blockers: ListItem[]
  highlights: ListItem[]
  defects: Defect[]
}

export const OVERALL_STATUSES: OverallStatus[] = [
  'On track',
  'At risk',
  'Blocked',
]

export const DEFECT_STATUSES: DefectStatus[] = [
  'New',
  'Open',
  'In progress',
  'Fixed',
  'Verified',
  "Won't fix",
]
