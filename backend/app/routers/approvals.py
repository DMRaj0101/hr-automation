"""
STUB -- NOT currently included in main.py's router list.

The previous version had a full per-task Approval Dashboard (every
provisioning item was a human-approved task). PDD Suggestion #1
(Section 11) flags that the new 6-step process, as written, goes
straight from Decision Agent to provisioning with no approval step --
but the PDD also lists "Approval Dashboard" as a reused screen (Section
9), which only makes sense if some approval step still exists somewhere.

TODO (owner: whoever resolves PDD Suggestion #1 -- recommend deciding
this BEFORE building against this stub, see the shared
Gap_Analysis_Reuse_Migration_Plan.md's Section 6, risk #1):

Once decided, this file should implement ONE of:
  (a) No approval at all -- delete this file, remove "Approval
      Dashboard" from the frontend nav.
  (b) One approval per employee, on the Decision Agent's plan, before
      any provisioning starts -- add a `plan_approved` boolean (or a
      lightweight ApprovalRecord model) and a pause point in
      orchestrators/onboarding_orchestrator.py (already marked with a
      TODO comment at the right spot).
  (c) Approval only for judgment calls (e.g. partial-failure follow-up
      per PDD Open Item #4), not for the initial plan -- narrower
      scope, would need its own small model.

Whichever is chosen, keep the same "AI suggests, human decides" shape
from the previous version's OnboardingTask pattern if it still applies
-- it was a well-tested pattern, not a design mistake, it's just not
clear yet WHERE in the new flow it should apply.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/approvals", tags=["approvals"])

# TODO: no endpoints yet -- implement once the shape above is decided.
