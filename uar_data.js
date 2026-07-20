// IAM Access Atlas — UAR cycle status
// Hand-edited each UAR cycle by the IAM team. Not generated.
//
// How to edit:
//   1. Update `cycle` (human-readable label, e.g. "Q2 2026 UAR").
//   2. Update `generated` to today's ISO date (YYYY-MM-DD).
//   3. For each application in scope this cycle, add one entry to the
//      `reviews` array using the shape shown below.
//   4. `appName` MUST match the application name in data.js exactly
//      (same spelling and casing) — otherwise the strip won't render.
//   5. `statusCategory` MUST be one of: "todo" | "in_progress" | "done".
//      It controls the strip color. `status` is the free-text label shown.
//   6. `key` and `url` link out to the Jira ticket or runbook driving the
//      cycle. Leave url blank if there's no ticket yet.
//   7. Save, commit, push. Netlify auto-deploys within ~30s.
//
// When a selected app has no matching review, the strip is silently hidden.

const UAR_DATA = {
  cycle: "Q2 2026 UAR",
  generated: "2026-05-28",
  reviews: [
    {
      appName: "Okta Admin Console",
      statusCategory: "in_progress",
      status: "Review in progress",
      launchDate: "2026-05-15",
      assignee: "Sanjay Sharma Josyula",
      key: "UAR-Q2-OKTA",
      url: "https://cloverhealth.atlassian.net/browse/UAR-Q2-OKTA",
      isSox: true,
      isHiTrust: true
    },
    {
      appName: "Salesforce",
      statusCategory: "todo",
      status: "Launches Jun 1",
      launchDate: "2026-06-01",
      assignee: "IAM Team",
      key: "UAR-Q2-SFDC",
      url: "https://cloverhealth.atlassian.net/browse/UAR-Q2-SFDC",
      isSox: true,
      isHiTrust: false
    },
    {
      appName: "Atlassian Cloud - Jira",
      statusCategory: "done",
      status: "Complete",
      launchDate: "2026-04-20",
      assignee: "IAM Team",
      key: "UAR-Q1-JIRA",
      url: "https://cloverhealth.atlassian.net/browse/UAR-Q1-JIRA",
      isSox: false,
      isHiTrust: false
    }
  ]
};
