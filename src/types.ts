export type OverallStatus = 'Red' | 'Amber' | 'Green'

export const DEFECT_STATUSES = [
  'New',
  'Open',
  'In progress',
  'Fixed',
  'Verified',
  "Won't fix",
] as const

export type DefectStatus = (typeof DEFECT_STATUSES)[number]

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
  /** Production defects are grouped first in the report. */
  isProduction: boolean
  /** Jira priority name (e.g. "Critical"); populated by the Jira import. */
  priority?: string
  /** Raw Jira status name (e.g. "Peer Review"); populated by the Jira import. */
  jiraStatus?: string
}

export interface TestDesignSummaryRow {
  id: string
  functionality: string
  totalPlanned: string
  totalCompleted: string
  totalInProgress: string
  totalNotStarted: string
  totalCompletedToday: string
  totalAutomated: string
  totalManual: string
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
  /** Key Highlights authored in a small Markdown subset (see lib/markdownLite). */
  highlightsMarkdown: string
  defects: Defect[]
}

export const OVERALL_STATUSES: OverallStatus[] = [
  'Red',
  'Amber',
  'Green',
]