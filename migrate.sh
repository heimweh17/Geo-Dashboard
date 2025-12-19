#!/bin/bash
# Run Alembic migrations
# Usage: ./migrate.sh [upgrade|downgrade] [revision]

set -e

if [ "$1" = "upgrade" ]; then
    alembic upgrade head
elif [ "$1" = "downgrade" ]; then
    alembic downgrade "$2"
elif [ "$1" = "revision" ]; then
    alembic revision --autogenerate -m "$2"
else
    echo "Usage: ./migrate.sh [upgrade|downgrade|revision] [revision/message]"
    exit 1
fi

