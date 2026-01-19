#!/bin/sh
set -e

# Setup SSH for nextjs user (if not already done)
mkdir -p /app/.ssh
chmod 700 /app/.ssh

# Add the user provided key
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDbk0Gqt3mz7QV0EydixC8+2PE6nn2WuhJA2e8+1+H22 haniakrim@gmail.com" > /app/.ssh/authorized_keys
chmod 600 /app/.ssh/authorized_keys

# Generate host keys if they don't exist (running as nextjs user)
if [ ! -f /app/.ssh/ssh_host_rsa_key ]; then
    ssh-keygen -t rsa -f /app/.ssh/ssh_host_rsa_key -N ""
fi
if [ ! -f /app/.ssh/ssh_host_ecdsa_key ]; then
    ssh-keygen -t ecdsa -f /app/.ssh/ssh_host_ecdsa_key -N ""
fi
if [ ! -f /app/.ssh/ssh_host_ed25519_key ]; then
    ssh-keygen -t ed25519 -f /app/.ssh/ssh_host_ed25519_key -N ""
fi

# Debug info
echo "Current user: $(id)"
ls -la /app/.ssh

# Start SSH server in background (Debug mode to stderr, non-daemon)
echo "Starting sshd on port 2222..."
/usr/sbin/sshd -D -e -f /app/sshd_config &

# Run migration
echo "Running migrations..."
./node_modules/.bin/tsx scripts/db-migrate.ts

# Start application
# Start application and pipe logs to file (for SSH inspection) AND stdout (for Sliplane UI)
echo "Starting application..."
exec node server.js 2>&1 | tee /app/server.log
