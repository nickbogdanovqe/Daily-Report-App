import type { Defect } from '../types'

/** A defect is worth printing when any user-visible field is filled in. */
export function hasDefectContent(defect: Defect): boolean {
  return Boolean(
    defect.title.trim() ||
      (defect.jiraId ?? '').trim() ||
      defect.note.trim() ||
      defect.link.trim(),
  )
}

export interface DefectGroups {
  production: Defect[]
  nonProduction: Defect[]
}

/** Split defects for the report; Production is always printed first. */
export function groupDefects(defects: Defect[]): DefectGroups {
  return {
    production: defects.filter((defect) => defect.isProduction),
    nonProduction: defects.filter((defect) => !defect.isProduction),
  }
}
