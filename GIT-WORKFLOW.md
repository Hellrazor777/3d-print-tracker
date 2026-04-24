# Git Workflow Cheat Sheet

A quick reference for day-to-day version control on this project.

---

## The big picture

Git saves **snapshots** (commits) of your code. Every commit has a message describing what changed. You can always roll back to any commit if something breaks.

```
Working files  →  Staged  →  Committed  →  Pushed (GitHub/remote)
   (your edits)     (git add)   (git commit)    (git push)
```

---

## Daily workflow

### 1. Check what's changed
```bash
git status
```
Shows modified files (not yet saved) and untracked new files.

### 2. See the actual diff
```bash
git diff                          # all unstaged changes
git diff src/modals/MyModal.jsx   # one file only
```

### 3. Stage files you want to commit
```bash
git add src/modals/MyModal.jsx    # one file
git add src/                      # everything under src/
git add -A                        # everything (modified + new)
```

### 4. Commit with a message
```bash
git commit -m "Short description of what you changed"
```
Keep messages in the present tense, e.g. *"Add dark mode toggle"* not *"Added dark mode toggle"*.

### 5. Push to GitHub
```bash
git push
```

---

## Useful one-liners

| What you want | Command |
|---|---|
| See recent commits | `git log --oneline -10` |
| Undo edits to a file (before staging) | `git restore src/views/ProductView.jsx` |
| Unstage a file (keep edits) | `git restore --staged src/views/ProductView.jsx` |
| See what changed in a past commit | `git show <commit-hash>` |
| Create a new branch | `git checkout -b feature/my-thing` |
| Switch back to main | `git checkout main` |
| Merge a branch into main | `git checkout main && git merge feature/my-thing` |

---

## Rolling back if something breaks

```bash
# Undo the last commit but keep your file changes
git reset --soft HEAD~1

# Fully discard the last commit AND its changes (use with care!)
git reset --hard HEAD~1
```

---

## Branching (optional but recommended for big features)

For a large feature (like Parts Box was), a branch keeps main stable:

```bash
git checkout -b feature/parts-box   # start working
# ... make changes, commit as you go ...
git checkout main
git merge feature/parts-box         # bring it in when done
git branch -d feature/parts-box     # clean up
```

---

## What NOT to commit

These are already in `.gitignore` but worth knowing:
- `node_modules/` — reinstalled by `npm install`
- `dist/` — rebuilt by `npm run build`
- `.env` files — secrets never go in git
