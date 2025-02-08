# Basic Git Workflow Cheat Sheet

# 1. Check the repository status

git status

# 2. Stage all changes (or specify individual files)

git add .

# 3. Commit changes with a descriptive message

git commit -m "Your descriptive commit message here"

# 4. Push changes to the remote repository (assuming branch is 'main')

git push -u origin main

# 5. Pull updates from the remote repository

git pull origin main

# Additional Useful Commands:

# View commit history

git log

# Create and switch to a new branch (e.g., 'new-feature')

git checkout -b new-feature

# Switch back to an existing branch (e.g., 'main')

git checkout main

# Merge a branch (e.g., 'new-feature') into your current branch

git merge new-feature

# View differences between working directory and staged changes

git diff

# Stash changes temporarily (if you need to switch context)

git stash

# Reapply stashed changes

git stash pop
