import { DayRolloverBanner } from './components/DayRolloverBanner'
import { DefectEditor } from './components/DefectEditor'
import { EditableList } from './components/EditableList'
import { ReportHistoryPicker } from './components/ReportHistoryPicker'
import { ReportMeta } from './components/ReportMeta'
import { ReportPreview } from './components/ReportPreview'
import { Section } from './components/Section'
import { TestSummaryTables } from './components/TestSummaryTables'
import { Toolbar } from './components/Toolbar'
import { ViewingPastBanner } from './components/ViewingPastBanner'
import { useDraft } from './hooks/useDraft'
import { hasJiraBaseUrl } from './lib/jiraUrl'
import { todayIsoDate } from './lib/storage'

function App() {
  const {
    draft,
    updateDraft,
    resetDraft,
    lastSaved,
    rolledFromDate,
    dismissRolloverNotice,
    viewingDate,
    selectViewingDate,
    isViewingToday,
    historyDates,
    hasReportForDate,
  } = useDraft()

  const enabledSummaryTableCount =
    Number(draft.showTestDesignSummary) + Number(draft.showTestExecutionSummary)

  return (
    <div className="flex min-h-svh flex-col bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_34rem),linear-gradient(135deg,#f8fafc_0%,#eef2ff_48%,#f8fafc_100%)]">
      <main className="mx-auto grid w-full max-w-[1720px] flex-1 grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(500px,620px)_minmax(0,1fr)] lg:items-start lg:gap-8 lg:p-8 xl:grid-cols-[minmax(560px,700px)_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col gap-5">
          <ReportHistoryPicker
            viewingDate={viewingDate}
            historyDates={historyDates}
            hasReportForDate={hasReportForDate}
            onSelectDate={selectViewingDate}
          />

          {!isViewingToday && (
            <ViewingPastBanner
              viewingDate={viewingDate}
              hasReport={hasReportForDate(viewingDate)}
              onBackToToday={() => selectViewingDate(todayIsoDate())}
            />
          )}

          {isViewingToday && rolledFromDate && (
            <DayRolloverBanner
              rolledFromDate={rolledFromDate}
              onDismiss={dismissRolloverNotice}
            />
          )}

          <fieldset
            disabled={!isViewingToday}
            className={`min-w-0 space-y-5 border-0 p-0 ${!isViewingToday ? 'opacity-95' : ''}`}
          >
            <ReportMeta draft={draft} onChange={updateDraft} />

            <Section
              title="Highlights"
              count={draft.highlights.length}
              variant="highlights"
              storageKey="highlights"
            >
              <EditableList
                items={draft.highlights}
                onChange={(highlights) => updateDraft({ highlights })}
                placeholder="e.g. Completed smoke testing on release candidate"
                addLabel="Add highlight"
                showJiraId={hasJiraBaseUrl(draft.jiraBaseUrl)}
              />
            </Section>

            <Section
              title="In scope items"
              count={draft.inScopeItems.length}
              variant="highlights"
              storageKey="in-scope-items"
            >
              <EditableList
                items={draft.inScopeItems}
                onChange={(inScopeItems) => updateDraft({ inScopeItems })}
                placeholder="e.g. User login, account settings, payment flows"
                addLabel="Add in-scope item"
              />
            </Section>

            <Section
              title="Out of scope"
              count={draft.outOfScopeItems.length}
              variant="scope"
              storageKey="out-of-scope"
            >
              <EditableList
                items={draft.outOfScopeItems}
                onChange={(outOfScopeItems) => updateDraft({ outOfScopeItems })}
                placeholder="e.g. Legacy admin portal, third-party integrations"
                addLabel="Add out-of-scope item"
              />
            </Section>

            <Section
              title="Optional test summary tables"
              count={enabledSummaryTableCount}
              variant="defects"
              storageKey="optional-test-summary-tables"
            >
              <TestSummaryTables draft={draft} onChange={updateDraft} />
            </Section>

            <Section
              title="Defects"
              count={draft.defects.length}
              variant="defects"
              storageKey="defects"
            >
              <DefectEditor
                defects={draft.defects}
                onChange={(defects) => updateDraft({ defects })}
                jiraBaseUrl={draft.jiraBaseUrl}
              />
            </Section>
          </fieldset>
        </div>

        <div className="flex min-h-[640px] flex-col lg:sticky lg:top-4 lg:h-[calc(100svh-6rem)] lg:min-h-0">
          <ReportPreview
            draft={draft}
            isReadOnly={!isViewingToday}
            hasReport={hasReportForDate(viewingDate)}
          />
        </div>
      </main>

      <Toolbar
        draft={draft}
        lastSaved={lastSaved}
        onReset={resetDraft}
        isViewingToday={isViewingToday}
        viewingDate={viewingDate}
      />
    </div>
  )
}

export default App
