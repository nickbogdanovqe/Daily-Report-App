export type OverallStatus = 'Red' | 'Amber' | 'Green'

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
  jiraId?: string
  link: string
  note: string
}

export interface TestDesignSummaryRow {
  id: string
  functionality: string
  totalPlanned: string
  totalCompleted: string
  totalInProgress: string
  totalNotStarted: string
  totalCompletedToday: string
}

export interface TestExecutionSummaryRow {
  id: string
  functionality: string
  totalPlanned: string
  totalExecuted: string
  totalPassed: string
  totalFailed: string
  totalNa: string
  totalNotComplete: string
  totalBlocked: string
  totalNoRun: string
}

export interface Draft {
  reportDate: string
  reportTitle: string
  applicationName: string
  projectQaStartDate: string
  projectQaSignOffDate: string
  plannedGoLiveDate: string
  testingType: string
  testEnvironment: string
  qeOwner: string
  overallStatus: OverallStatus
  overallStatusCustom: string
  anticipatedTrend: OverallStatus
  ragReason: string
  trendReason: string
  testResultsDistribution: string
  testEvidencePath: string
  testArtifacts: string
  environmentDowntime: string
  inScopeConfirmedDate: string
  inScopeItems: ListItem[]
  outOfScopeItems: ListItem[]
  showTestDesignSummary: boolean
  testDesignSummaryTitle: string
  testDesignSummaryRemarks: string
  testDesignSummaryRows: TestDesignSummaryRow[]
  showTestExecutionSummary: boolean
  testExecutionSummaryTitle: string
  testExecutionSummaryRemarks: string
  testExecutionSummaryRows: TestExecutionSummaryRow[]
  jiraBaseUrl: string
  summary: string
  tasks: ListItem[]
  blockers: ListItem[]
  highlights: ListItem[]
  defects: Defect[]
}

export const OVERALL_STATUSES: OverallStatus[] = [
  'Red',
  'Amber',
  'Green',
]

export const DEFECT_STATUSES: DefectStatus[] = [
  'New',
  'Open',
  'In progress',
  'Fixed',
  'Verified',
  "Won't fix",
]
