export const REPORT_REASONS = [
  {
    id: 'spam' as const,
    label: 'Spam',
    hint: 'Unwanted ads, repeated posts, or misleading links.',
    placeholder: 'Explain why this is spam (e.g. repeated ads, fake links…)',
  },
  {
    id: 'abuse' as const,
    label: 'Abuse',
    hint: 'Harassment, hate speech, threats, or bullying.',
    placeholder: 'Describe the abusive behavior you saw…',
  },
  {
    id: 'fake' as const,
    label: 'Fake account',
    hint: 'Impersonation, scam profile, or stolen identity.',
    placeholder: 'Explain why you think this account is fake…',
  },
  {
    id: 'other' as const,
    label: 'Other',
    hint: 'Something else that breaks community rules.',
    placeholder: 'Tell us what happened and why you are reporting…',
  },
];

export type ReportReasonId = (typeof REPORT_REASONS)[number]['id'];

export function getReportReason(id: ReportReasonId) {
  return REPORT_REASONS.find((r) => r.id === id)!;
}
