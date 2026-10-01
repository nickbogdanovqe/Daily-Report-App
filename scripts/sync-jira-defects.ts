/**
 * Export Aurora Mobile defects for a release from Jira into a JSON file that
 * the Daily Report app can import (Defects section -> "Import from Jira").
 *
 * Uses the locally installed and authenticated `twg` CLI, so no API tokens
 * are stored in this repo.
 *
 * Usage:
 *   npm run sync:jira                                  # Aurora Gatlinburg -> ./jira-defects.json
 *   npm run sync:jira -- --release "Aurora Hoover"     # another fixVersion
 *   npm run sync:jira -- --open-only                   # drop Done / Cancelled
 *   npm run sync:jira -- --jql '<custom JQL>'          # full override
 *   npm run sync:jira -- --out ./tmp/defects.json
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'
import {
  DEFAULT_RELEASE,
  JIRA_SITE,
  JiraQueryResponseSchema,
  buildDefectsJql,
  isClosedStatus,
  mapJiraIssueToImport,
  summarizeImport,
  type DefectsImportFile,
  type ImportedDefect,
  type JiraIssue,
} from '../src/lib/jiraDefects.ts'

interface CliOptions {
  release: string
  jql: string | null
  openOnly: boolean
  out: string
  pageSize: number
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    release: DEFAULT_RELEASE,
    jql: null,
    openOnly: false,
    out: path.resolve(process.cwd(), 'jira-defects.json'),
    pageSize: 200,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    const next = (): string => {
      const value = argv[index + 1]
      if (value === undefined) {
        throw new Error(`Missing value for ${arg}`)
      }
      index += 1
      return value
    }

    switch (arg) {
      case '--release':
        options.release = next()
        break
      case '--jql':
        options.jql = next()
        break
      case '--open-only':
        options.openOnly = true
        break
      case '--out':
        options.out = path.resolve(process.cwd(), next())
        break
      case '--page-size':
        options.pageSize = Number(next())
        break
      case '--help':
      case '-h':
        printHelp()
        process.exit(0)
        break
      default:
        throw new Error(`Unknown argument: ${arg}`)
    }
  }

  return options
}

function printHelp(): void {
  console.log(
    [
      'Sync Aurora Mobile defects from Jira into jira-defects.json',
      '',
      'Options:',
      `  --release <name>   Jira fixVersion (default: "${DEFAULT_RELEASE}")`,
      '  --jql <jql>        Override the generated JQL entirely',
      '  --open-only        Exclude defects mapped to Verified / Won\'t fix',
      '  --out <path>       Output file (default: ./jira-defects.json)',
      '  --page-size <n>    Results per twg page (default: 200)',
    ].join('\n'),
  )
}

function resolveTwgBinary(): string {
  const fallback = path.join(homedir(), '.local', 'bin', 'twg')
  const probe = spawnSync('twg', ['--version'], { encoding: 'utf8' })
  if (probe.status === 0) return 'twg'
  if (existsSync(fallback)) return fallback
  throw new Error(
    'The `twg` CLI was not found. Install it from https://developer.atlassian.com/cloud/twg-cli/getting-started/installation/ and run `twg login`.',
  )
}

function runTwgQuery(
  twg: string,
  jql: string,
  pageSize: number,
  after: string | undefined,
): { issues: JiraIssue[]; nextCursor: string | undefined } {
  const args = [
    'jira',
    'workitem',
    'query',
    '--jql',
    jql,
    '--fields',
    'key,summary,status,priority,labels,fixVersions',
    '--limit',
    String(pageSize),
    '-o',
    'json',
    '--output-summary',
    'none',
  ]
  if (after) args.push('--after', after)

  const result = spawnSync(twg, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })

  if (result.error) {
    throw new Error(`Failed to run twg: ${result.error.message}`)
  }
  if (result.status !== 0) {
    const stderr = result.stderr.trim()
    const hint = /auth|login|unauthor|forbidden|401|403/i.test(stderr)
      ? ' It looks like twg is not authenticated; run `twg login` and retry.'
      : ''
    throw new Error(`twg exited with code ${result.status}.${hint}\n${stderr}`)
  }

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(result.stdout)
  } catch {
    throw new Error(
      `twg did not return JSON. First bytes:\n${result.stdout.slice(0, 400)}`,
    )
  }

  const parsed = JiraQueryResponseSchema.safeParse(parsedJson)
  if (!parsed.success) {
    throw new Error(`Unexpected twg response shape: ${parsed.error.message}`)
  }

  const pageInfo = parsed.data.pageInfo
  return {
    issues: parsed.data.data.issues,
    nextCursor: pageInfo?.hasNextPage ? pageInfo.nextCursor : undefined,
  }
}

function fetchAllIssues(twg: string, jql: string, pageSize: number): JiraIssue[] {
  const issues: JiraIssue[] = []
  let cursor: string | undefined
  let page = 0

  do {
    page += 1
    const result = runTwgQuery(twg, jql, pageSize, cursor)
    issues.push(...result.issues)
    cursor = result.nextCursor
    if (page > 50) {
      throw new Error('Stopped after 50 pages; the JQL is probably too broad.')
    }
  } while (cursor)

  return issues
}

function copyToClipboard(text: string): boolean {
  if (process.platform !== 'darwin') return false
  const result = spawnSync('pbcopy', { input: text, encoding: 'utf8' })
  return result.status === 0
}

function formatTable(defects: ImportedDefect[]): string {
  const rows = defects.map((defect) => [
    defect.isProduction ? 'PROD' : '',
    defect.jiraId,
    (defect.priority ?? '').padEnd(8),
    defect.status.padEnd(11),
    defect.title.length > 70 ? `${defect.title.slice(0, 67)}...` : defect.title,
  ])
  return rows.map((row) => row.join('  ')).join('\n')
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))
  const jql = options.jql ?? buildDefectsJql(options.release)
  const twg = resolveTwgBinary()

  console.log(`JQL: ${jql}`)

  const issues = fetchAllIssues(twg, jql, options.pageSize)
  let defects = issues.map(mapJiraIssueToImport)
  if (options.openOnly) {
    defects = defects.filter((defect) => !isClosedStatus(defect.status))
  }

  const file: DefectsImportFile = {
    source: 'jira',
    release: options.release,
    syncedAt: new Date().toISOString(),
    jiraBaseUrl: JIRA_SITE,
    defects,
  }

  const json = JSON.stringify(file, null, 2)
  await writeFile(options.out, `${json}\n`, 'utf8')

  const { total, production } = summarizeImport(defects)
  console.log('')
  console.log(formatTable(defects))
  console.log('')
  console.log(`${total} defects (${production} Production) -> ${options.out}`)

  if (copyToClipboard(json)) {
    console.log('Copied to clipboard. In the app: Defects -> Import from Jira -> paste.')
  } else {
    console.log('In the app: Defects -> Import from Jira -> choose this file (or paste its contents).')
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`sync:jira failed: ${message}`)
  process.exit(1)
})
