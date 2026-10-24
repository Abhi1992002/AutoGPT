| story | state | viewport | pixel diff |
| --- | --- | --- | --- |
| needs-attention | rest (row 2 disabled) | desktop | 0 px |
| needs-attention | hover Approve | desktop | 0 px |
| needs-attention | hover row link | desktop | 0 px |
| needs-attention | focus-visible Approve | desktop | 0 px |
| needs-attention | focus-visible row link | desktop | 0 px |
| needs-attention | Decline armed | desktop | 0 px |
| composer-notices | rest | desktop | 0 px |
| composer-notices | hover dismiss | desktop | 0 px |
| composer-notices | focus-visible dismiss | desktop | 0 px |
| composer-notices | focus-visible setup guide link | desktop | 0 px |
| chat-notices | rest | desktop | 0 px |
| chat-notices | hover Copy link | desktop | 0 px |
| chat-notices | focus-visible Copy link | desktop | 0 px |
| scheduled-chat-notices | rest | desktop | 0 px |
| scheduled-chat-notices | hover Run less often | desktop | 0 px |
| scheduled-chat-notices | focus-visible View plans | desktop | 0 px |
| scheduled-chat-notices | focus-visible Resume | desktop | 0 px |
| scheduled-chat-notices | dialog open | desktop | 0 px |
| scheduled-chat-notices | dialog closed by Esc | desktop | 0 px |
| pending-reviews | rest | desktop | 0 px |
| pending-reviews | hover Approve | desktop | 0 px |
| pending-reviews | focus-visible group header | desktop | 0 px |
| pending-reviews | focus-visible Reject | desktop | 0 px |
| pending-reviews | group closed | desktop | 0 px |
| pending-reviews | group reopened | desktop | 0 px |
| pending-reviews | auto-approve on | desktop | 0 px |
| pending-reviews-empty | rest | desktop | 0 px |
| pending-review-card-standalone | rest | desktop | 0 px |
| pending-review-card-standalone | auto-approve on | desktop | 0 px |
| briefing | rest | desktop | 0 px |
| briefing | hover linked row | desktop | 0 px |
| briefing | hover Show all | desktop | 0 px |
| briefing | focus-visible linked row | desktop | 0 px |
| briefing | focus-visible Show all | desktop | 0 px |
| briefing | expanded | desktop | 0 px |
| trial-onboarding | rest | desktop | 0 px |
| trial-onboarding | hover Start | desktop | 0 px |
| trial-onboarding | focus-visible Start | desktop | 0 px |
| trial-billing | rest | desktop | 0 px |
| trial-billing | hover Start | desktop | 0 px |
| trial-billing | focus-visible Start | desktop | 0 px |
| needs-attention | rest (row 2 disabled) | mobile | 0 px |
| needs-attention | hover Approve | mobile | 0 px |
| needs-attention | hover row link | mobile | 0 px |
| needs-attention | focus-visible Approve | mobile | 0 px |
| needs-attention | focus-visible row link | mobile | 0 px |
| needs-attention | Decline armed | mobile | 0 px |
| composer-notices | rest | mobile | 0 px |
| composer-notices | hover dismiss | mobile | 0 px |
| composer-notices | focus-visible dismiss | mobile | 0 px |
| composer-notices | focus-visible setup guide link | mobile | 0 px |
| chat-notices | rest | mobile | 0 px |
| chat-notices | hover Copy link | mobile | 0 px |
| chat-notices | focus-visible Copy link | mobile | 0 px |
| scheduled-chat-notices | rest | mobile | 0 px |
| scheduled-chat-notices | hover Run less often | mobile | 0 px |
| scheduled-chat-notices | focus-visible View plans | mobile | 0 px |
| scheduled-chat-notices | focus-visible Resume | mobile | 0 px |
| scheduled-chat-notices | dialog open | mobile | 0 px |
| scheduled-chat-notices | dialog closed by Esc | mobile | 0 px |
| pending-reviews | rest | mobile | 0 px |
| pending-reviews | hover Approve | mobile | 0 px |
| pending-reviews | focus-visible group header | mobile | 0 px |
| pending-reviews | focus-visible Reject | mobile | 0 px |
| pending-reviews | group closed | mobile | 0 px |
| pending-reviews | group reopened | mobile | 0 px |
| pending-reviews | auto-approve on | mobile | 0 px |
| pending-reviews-empty | rest | mobile | 0 px |
| pending-review-card-standalone | rest | mobile | 0 px |
| pending-review-card-standalone | auto-approve on | mobile | 0 px |
| briefing | rest | mobile | 0 px |
| briefing | hover linked row | mobile | 0 px |
| briefing | hover Show all | mobile | 0 px |
| briefing | focus-visible linked row | mobile | 0 px |
| briefing | focus-visible Show all | mobile | 0 px |
| briefing | expanded | mobile | 0 px |
| trial-onboarding | rest | mobile | 0 px |
| trial-onboarding | hover Start | mobile | 0 px |
| trial-onboarding | focus-visible Start | mobile | 0 px |
| trial-billing | rest | mobile | 0 px |
| trial-billing | hover Start | mobile | 0 px |
| trial-billing | focus-visible Start | mobile | 0 px |

| story | ARIA snapshot | Tab order (head) | Tab order vs base |
| --- | --- | --- | --- |
| needs-attention | identical | 4 stops: a[role=] "Approve outreach email

Ana · Lead Finder" → button[role=] "Approve: Approve outreach email" → button[role=] "Decline: Approve outreach email" → a[role=] "A very long review title that has to truncate befo" | identical |
| composer-notices | identical | 3 stops: button[role=] "Dismiss attachment limit notice" → a[role=] "(setup guide)" → a[role=] "Settings → Integrations" | identical |
| chat-notices | identical | 1 stops: button[role=] "Copy link" | identical |
| scheduled-chat-notices | identical | 3 stops: a[role=] "View plans" → button[role=] "Run less often" → button[role=] "Resume" | identical |
| scheduled-chat-notices: Esc closes RunLessOftenDialog, focus returns to trigger | - | focus after Esc: base "Paused until your usage resets

This routine ran out of usage for today. It picks up again when your limit resets.

View plans
Run less often
Resume

Routine resumed

It runs on its usual schedule again.", head "Paused until your usage resets

This routine ran out of usage for today. It picks up again when your limit resets.

View plans
Run less often
Resume

Routine resumed

It runs on its usual schedule again." | identical |
| pending-reviews | identical | 10 stops: button[role=] "Approve outreach email

In workflow “Lead Finder”
" → textarea[role=] "Value" → textarea[role=] "Value" → button[role=switch] "" → button[role=] "Approve 2 reviews" → button[role=] "Reject 2 reviews" → button[role=] "Post the weekly summary

Node #n-2

1 review" → button[role=switch] "" → button[role=] "Approve" → button[role=] "Reject" | identical |
| pending-reviews-empty | identical | 0 stops: none | identical |
| pending-review-card-standalone | identical | 2 stops: button[role=switch] "" → button[role=switch] "" | identical |
| briefing | identical | 5 stops: a[role=] "Workflow 1

Expert 1 · Summary of what run 1 found" → a[role=] "Workflow 3

Expert 3 · Summary of what run 3 found" → a[role=] "Workflow 1

Expert 1 · Summary of what run 1 found" → a[role=] "Workflow 3

Expert 3 · Summary of what run 3 found" → button[role=] "Show all results (6)" | identical |
| trial-onboarding | identical | 1 stops: button[role=] "Start 7-day trial" | identical |
| trial-billing | identical | 1 stops: button[role=] "Start 7-day trial" | identical |

82 state screenshots, 11 keyboard/aria checks: 0 differing