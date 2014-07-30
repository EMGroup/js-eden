#!/bin/sh
# writes version.txt. Should be called whenever code is updated.

git describe --abbrev=4 HEAD
