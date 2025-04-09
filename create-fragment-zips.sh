#!/bin/sh
COLLECTIONS=$(find . -type d -maxdepth 1 -exec test -e '{}'/collection.json \; -print)
FRAGMENTS=$(find . -type d -maxdepth 1 -exec test -e '{}'/fragment.json \; -print)

rm -rf zips
mkdir zips

for FRAGMENT in $FRAGMENTS; do
   FRAGMENT=$(basename "$FRAGMENT" | sed s/"$\.\/"//)
   zip -r ./zips/"$FRAGMENT".zip "$FRAGMENT"
done

for COLLECTION in $COLLECTIONS; do
   COLLECTION=$(basename "$COLLECTION" | sed s/"$\.\/"//)
   zip -r ./zips/"$COLLECTION"-collection.zip "$COLLECTION"
done