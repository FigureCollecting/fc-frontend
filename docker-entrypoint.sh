#!/bin/sh
set -e

# Check required environment variables
if [ -z "$BACKEND_HOST" ]; then
    echo "ERROR: BACKEND_HOST environment variable is required"
    echo "  Production: BACKEND_HOST=backend"
    echo "  Development: BACKEND_HOST=backend-dev"
    echo "  Test: BACKEND_HOST=backend-test"
    exit 1
fi

if [ -z "$BACKEND_PORT" ]; then
    echo "ERROR: BACKEND_PORT environment variable is required"
    echo "  Production: BACKEND_PORT=5050"
    echo "  Development: BACKEND_PORT=5090"
    echo "  Test: BACKEND_PORT=5070"
    exit 1
fi

if [ -z "$FRONTEND_PORT" ]; then
    echo "ERROR: FRONTEND_PORT environment variable is required"
    echo "  Production: FRONTEND_PORT=5051"
    echo "  Development: FRONTEND_PORT=5091"
    echo "  Test: FRONTEND_PORT=5071"
    exit 1
fi

echo "Starting Frontend with configuration:"
echo "  Environment: ${NODE_ENV:-not set}"
echo "  BACKEND_HOST: ${BACKEND_HOST}"
echo "  BACKEND_PORT: ${BACKEND_PORT}"
echo "  FRONTEND_PORT: ${FRONTEND_PORT}"

# Process the nginx template with environment variables
echo "Processing nginx configuration template..."
envsubst '${BACKEND_HOST} ${BACKEND_PORT} ${FRONTEND_PORT}' \
    < /etc/nginx/templates/nginx.conf.template \
    > /etc/nginx/nginx.conf

echo "Nginx configuration processed successfully"

# Start nginx
exec nginx -g 'daemon off;'