# Rebasing Your Feature Branch  

When collaborating on projects with multiple developers, changes often overlap causing merge conflicts.

It is imperative to keep your local feature branch up to date with the `main` branch because new commits are frequently added.

You need the full, up-to-date history of all of commits made to `main`, otherwise your code will be based on out-of-date work.


## Scene 1:
#### you pull the recent changes to main, commit 4 (hash=`def456`) was just added

remote = `local`: branch = `main`  
4: `def456` <-- HEAD: `main`  
3: `cde345`  
2: `bcd234`  
1: `abc123`  

## Scene 2:
#### you create a branch `dev/RFM-000-your-branch-name` and add some changes to it, and make a commit (hash=`zyx987`)

remote = `local`: branch = `dev/RFM-000-your-branch-name`  
5: `zyx987` <-- HEAD: `dev/RFM-000-your-branch-name`  
4: `def456` <-- HEAD: `main`  
3: `cde345`  
2: `bcd234`  
1: `abc123`  

## Scene 3:
#### another dev pushes their branch, makes a PR, it gets approved, and then merged into `main`, adding commit 5 (hash=`efg567`)

Remote = `origin`: branch = `main`  
5: `efg567` <-- HEAD: `main`  
4: `def456`  
3: `cde345`  
2: `bcd234`  
1: `abc123`  

![rebase pt1](./documentation/interesting-rebase-pt1.png)

## Scene 4a:  
#### your branch is now out of date, the `main` HEAD on remote: `origin` is at `efg567` while it still shows `def456` on your feature branch:

remote = `local`: branch = `dev/RFM-000-your-branch-name`  
5: `zyx987` <-- HEAD: `dev/RFM-000-your-branch-name`  
4: `def456` <-- HEAD: `main`  
3: `cde345`  
2: `bcd234`  
1: `abc123`  

## Scene 4b:  
#### you update/sync your `local main` with `origin main` to pull in commit `efg567` and rebase your branch in one command: `git pull --rebase origin main`

remote = `local`: branch = `dev/RFM-000-your-branch-name`  
6: `zyx987` <-- HEAD: `dev/RFM-000-your-branch-name`  
5: `efg567` <-- HEAD: `main`  
4: `def456`  
3: `cde345`  
2: `bcd234`  
1: `abc123`  

![rebase pt2](./documentation/interesting-rebase-pt2.png)

## Scene 4c:
#### you then run thru all of the steps to fix merge conflicts, if any

`git add . && git rebase --continue`
`git add . && git commit --amend`

## Scene 5:
#### you push your changes to `origin`

`git push` if your branch has never been pushed to `origin`  
`git push --force-with-lease` if your branch already exists at `origin`  
and then rerequest a review  

`git checkout main && git pull`  
`git checkout RFM-000-branch-name`  
`git pull --rebase origin main`  
