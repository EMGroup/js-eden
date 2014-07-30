#!/bin/sh

set -e

git config --global user.email "bot@travis-ci.org"
git config --global user.name "travis ci auto commit"
git config --global credential.helper "store --file=${PWD}/.git/credentials"
git remote rm origin
git remote add origin "https://github.com/EMGroup/js-eden.git"
echo "https://${GH_TOKEN}:@github.com" > .git/credentials
node write_version.js
grunt gh-pages
