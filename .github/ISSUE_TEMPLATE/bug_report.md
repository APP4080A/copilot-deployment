name: Bug Report 
description: Report a reproducible bug or crash
title: "[BUG] <describe issue concisely>"
labels: bug
assignees: ''

body:
- type: markdown
  attributes:
  value: "Please complete all required fields for a valid report."

- type: input
  id: summary
  attributes:
  label: Bug Summary
  placeholder: "Describe the bug briefly"

- type: textarea
  id: steps
  attributes:
  label: Steps to Reproduce
  description: "List exact steps to trigger the issue"
  placeholder: "1. Go to... 2. Click on..."

- type: input
  id: environment
  attributes:
  label: Environment
  placeholder: "OS, browser, Node version, etc."

- type: textarea
  id: expected
  attributes:
  label: Expected vs Actual