import type { DefectStatus, Draft, OverallStatus } from '../types'

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function formatOverallLabel(draft: Draft): string {
  return draft.overallStatus
}

export function overallStatusColors(status: OverallStatus): {
  bg: string
  text: string
  border: string
} {
  switch (status) {
    case 'Green':
      return { bg: '#ecfdf5', text: '#047857', border: '#6ee7b7' }
    case 'Amber':
      return { bg: '#fffbeb', text: '#b45309', border: '#fcd34d' }
    case 'Red':
      return { bg: '#fef2f2', text: '#b91c1c', border: '#fca5a5' }
  }
}

export function statusColors(status: DefectStatus): {
  bg: string
  text: string
} {
  switch (status) {
    case 'New':
      return { bg: '#e0e7ff', text: '#3730a3' }
    case 'Open':
      return { bg: '#dbeafe', text: '#1d4ed8' }
    case 'In progress':
      return { bg: '#fef3c7', text: '#b45309' }
    case 'Fixed':
      return { bg: '#d1fae5', text: '#047857' }
    case 'Verified':
      return { bg: '#ecfdf5', text: '#065f46' }
    case "Won't fix":
      return { bg: '#f1f5f9', text: '#475569' }
  }
}

export function resolveOverallStatus(draft: Draft): OverallStatus {
  return draft.overallStatus
}
