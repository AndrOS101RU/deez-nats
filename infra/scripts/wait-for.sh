#!/usr/bin/env sh
# wait-for host:port
set -e
HOSTPORT=$1
HOST=$(echo $HOSTPORT | cut -d: -f1)
PORT=$(echo $HOSTPORT | cut -d: -f2)
until nc -z $HOST $PORT; do echo "waiting for $HOSTPORT"; sleep 1; done