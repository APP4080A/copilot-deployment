name: Feature Request
description: Propose a new enhancement or module
title: "[FEATURE] <brief idea>"
labels: enhancement
assignees: ''

body:
- type: input
  id: summary
  attributes:
  label: Feature Summary
  placeholder: "What's the idea?"

- type: textarea
  id: details
  attributes:
  label: Detailed Description
  placeholder: "Who benefits, and how?"

- type: checkboxes
  id: scope
  attributes:
  label: Affects
  options:
  - label: Frontend
  - label: Backend
  - label: Database
  - label: DevOps

- type: textarea
  id: notes
  attributes:
  label: Additional Notes