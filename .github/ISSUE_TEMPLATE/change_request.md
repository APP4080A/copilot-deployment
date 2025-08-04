name: Change Request
description: Request modification to an approved implementation
title: "[CHANGE] <brief summary>"
labels: change-request
assignees: ''

body:
- type: input
  id: requestor
  attributes:
  label: Requestor Name
  placeholder: "Who's requesting this?"

- type: textarea
  id: reason
  attributes:
  label: Reason for Change
  placeholder: "What led to this change?"

- type: input
  id: original_plan
  attributes:
  label: Original Spec Reference
  placeholder: "Link to previous issue or PR"

- type: textarea
  id: impact
  attributes:
  label: Expected Impact