#!/bin/sh
set -e

echo "Waiting for database setup to complete..."

# Wait for the setup completion marker and the final success message
timeout=180  # 3 minutes timeout for setup
elapsed=0

while [ $elapsed -lt $timeout ]; do
  # Check if setup completion marker exists (created after "builtwith sqlite DB written to" message)
  if [ -f /app/database/.setup_done ]; then
    echo "✅ Setup completion marker found - database setup is complete!"
    break
  fi
  
  # Fallback: check if database exists and has substantial content
  if [ -f /app/database/builtwith.db ] && [ -s /app/database/builtwith.db ]; then
    file_size=$(stat -f%z /app/database/builtwith.db 2>/dev/null || stat -c%s /app/database/builtwith.db 2>/dev/null || echo "0")
    if [ "$file_size" -gt 100000 ]; then  # 100KB indicates setup is likely complete
      echo "⚠️  No marker found but database has substantial content - proceeding..."
      break
    fi
  fi
  
  echo "Waiting for setup completion... (${elapsed}s elapsed)"
  sleep 3
  elapsed=$((elapsed + 3))
done

if [ $elapsed -ge $timeout ]; then
  echo "ERROR: Database setup timed out after ${timeout} seconds"
  echo "Database directory contents:"
  ls -la /app/database/ 2>/dev/null || echo "Database directory not found"
  exit 1
fi

echo "🚀 Starting application..."
exec "$@"
