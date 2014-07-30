#!/bin/sh

set -e

git config --global user.email "bot@travis-ci.org"
git config --global user.name "travis ci auto commit"
git config --global credential.helper "store --file=${PWD}/.git/credentials"
git remote rm origin
git remote add origin "https://github.com/EMGroup/jseden"
echo "https://${GH_TOKEN}:@github.com" > .git/credentials
./write_version.sh
grunt gh-pages
