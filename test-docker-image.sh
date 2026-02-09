# Build the image
npm run docker:build

# Test locally with environment variables
docker run -p 3000:3000 \
  -e STATE_MACHINE_SERVICE_URL=http://your-downstream-service:9090 \
  -e DATABASE_URL=postgresql://postgres:postgres@host:5432/database \
  state-machine-amz-portal:latest

# Test health endpoint
curl http://localhost:3000/api/health
