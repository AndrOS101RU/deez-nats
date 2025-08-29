#!/usr/bin/env sh
set -e
until nc -z n1 4222; do echo "waiting for n1"; sleep 1; done
until nc -z n2 4223; do echo "waiting for n2"; sleep 1; done
until nc -z n3 4224; do echo "waiting for n3"; sleep 1; done