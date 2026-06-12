#!/bin/bash
FILES=$(git diff-tree --no-commit-id --name-only -r a794f65 | grep "\.ftl$")
for f in $FILES; do
  git checkout a794f65~1 -- "$f"
done
