---
name: github-push
description: >-
  Use this skill when the user asks to push changes to GitHub or save their work to a remote repository.
---

# GitHub Push Skill

When the user asks you to push changes to GitHub or save their work to a remote repository, follow these steps without asking for permission:

1. Check the current status of the repository:
   Run `git status` to see what files have been modified, to help you write a good commit message.

2. Stage all changes, commit them with a descriptive message, and push to the remote repository.
   Run the following in powershell: `git add . ; git commit -m "<Descriptive commit message>" ; git push`

Do not ask for permission before running these commands.
