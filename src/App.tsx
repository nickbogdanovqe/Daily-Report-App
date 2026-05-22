import { DayRolloverBanner } from './components/DayRolloverBanner'
import { DefectEditor } from './components/DefectEditor'
import { EditableList } from './components/EditableList'
import { ReportMeta } from './components/ReportMeta'
import { ReportPreview } from './components/ReportPreview'
import { Section } from './components/Section'
import { TestSummaryTables } from './components/TestSummaryTables'
import { Toolbar } from './components/Toolbar'
import { useDraft } from './hooks/useDraft'

function App() {
  const {
    draft,
    updateDraft,
    resetDraft,
    lastSaved,
    rolledFromDate,
    dismissRolloverNotice,
  } = useDraft()

  const defectCount = draft.defects.filter((d) => d.title.trim()).length
  const highlightCount = draft.highlights.filter((h) => h.text.trim()).length
  const enabledSummaryTableCount =
    Number(draft.showTestDesignSummary) + Number(draft.showTestExecutionSummary)

  return (
    <div className="flex min-h-svh flex-col bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_34rem),linear-gradient(135deg,#f8fafc_0%,#eef2ff_48%,#f8fafc_100%)]">
      <header className="relative overflow-hidden border-b border-blue-900/10 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 px-4 py-7 text-white shadow-xl shadow-blue-950/15 sm:px-6 lg:py-8">
        <div
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 left-1/3 h-48 w-96 rounded-full bg-indigo-300/10 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto flex max-w-[1720px] flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-300/90">
              Aurora Mobile
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
              Daily QA Report
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/85">
              Compose a management-ready update with structured QA details, a wider
              Outlook-style preview, and one-click formatted copy.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:min-w-[360px]">
            <div className="min-h-[92px] rounded-[1.35rem] border border-white/10 bg-white/[0.12] px-4 py-3.5 shadow-lg shadow-blue-950/10 backdrop-blur">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200/80">
                Highlights
              </p>
              <p className="mt-2 text-3xl font-bold leading-none text-white">{highlightCount}</p>
            </div>
            <div className="min-h-[92px] rounded-[1.35rem] border border-white/10 bg-white/[0.12] px-4 py-3.5 shadow-lg shadow-blue-950/10 backdrop-blur">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200/80">
                Defects
              </p>
              <p className="mt-2 text-3xl font-bold leading-none text-white">{defectCount}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1720px] flex-1 grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(500px,620px)_minmax(0,1fr)] lg:items-start lg:gap-8 lg:p-8 xl:grid-cols-[minmax(560px,700px)_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col gap-5">
          {rolledFromDate && (
            <DayRolloverBanner
              rolledFromDate={rolledFromDate}
              onDismiss={dismissRolloverNotice}
            />
          )}
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
              placeholder="e.g. Completed smoke on release candidate"
              addLabel="Add highlight"
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
              placeholder="e.g. Debit Card Controls (Lock/ Unlock, Card Activation, PIN Set/ Change)"
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
              placeholder="e.g. Account Servicing for SMB Products"
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
            />
          </Section>
        </div>

        <div className="flex min-h-[520px] flex-col lg:sticky lg:top-8 lg:h-[calc(100svh-9rem)] lg:min-h-0">
          <ReportPreview draft={draft} />
        </div>
      </main>

      <Toolbar draft={draft} lastSaved={lastSaved} onReset={resetDraft} />
    </div>
  )
}

export default App
