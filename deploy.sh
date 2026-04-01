#!/bin/bash
set -e

echo "=== WayInvest Deploy ==="

# 1. Pull latest code
echo "[1/5] Pulling latest code..."
git pull origin main

# 2. Create .env if not exists
if [ ! -f .env ]; then
  echo "[2/5] Creating .env..."
  cat > .env << 'EOF'
DATABASE_URL="postgresql://wayinvest:wayinvest@postgres:5432/wayinvest?schema=public"
NEXTAUTH_SECRET="CHANGE_ME_TO_A_RANDOM_SECRET"
NEXTAUTH_URL="http://YOUR_SERVER_IP"
EOF
  echo ">>> EDIT .env with your real values! Then re-run this script."
  exit 1
else
  echo "[2/5] .env exists, skipping..."
fi

# 3. Build and start
echo "[3/5] Building and starting containers..."
docker compose up -d --build

# 4. Run migrations
echo "[4/5] Running database migrations..."
docker compose exec app npx prisma migrate deploy

# 5. Seed database
echo "[5/5] Seeding database..."
docker compose exec app npx tsx prisma/seed.ts

echo ""
echo "=== Deploy complete! ==="
echo "Site: http://$(curl -s ifconfig.me)"
echo "Admin: admin@wayinvest.ru / admin123"
