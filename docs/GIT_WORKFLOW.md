# Git And GitHub Workflow

## Check Current State

```bash
git status --short --branch
git log --oneline --decorate --max-count=10
```

## Save And Upload Changes

Run from `D:\AI\PerformanceLab_1\app`:

```bash
npm run build
git status --short --branch
git add -A
git commit -m "Describe the change"
git push
```

After `git push`, GitHub Actions deploys the site automatically.

## If Someone Else Changed GitHub First

```bash
git pull --rebase
npm run build
git push
```

## Roll Back Locally To A Previous Commit

View commits:

```bash
git log --oneline --decorate
```

Temporarily inspect an old version:

```bash
git switch --detach <commit>
```

Return to current work:

```bash
git switch main
```

Create a rollback commit that undoes a bad commit:

```bash
git revert <commit>
git push
```

Prefer `git revert` for shared GitHub history. Avoid `git reset --hard` unless you are certain and have a backup.
