#!/bin/bash

echo "Checking service health..."

# Check Core API
if curl -s -f http://localhost:3001/health > /dev/null; then
    echo "✅ Core API is healthy"
else
    echo "❌ Core API is unhealthy"
fi

# Check UI
if curl -s -f http://localhost:3000 > /dev/null; then
    echo "✅ UI is healthy"
else
    echo "❌ UI is unhealthy"
fi

# Check Prometheus
if curl -s -f http://localhost:9090/-/healthy > /dev/null; then
    echo "✅ Prometheus is healthy"
else
    echo "❌ Prometheus is unhealthy"
fi

# Check Grafana
if curl -s -f http://localhost:3003/api/health > /dev/null; then
    echo "✅ Grafana is healthy"
else
    echo "❌ Grafana is unhealthy"
fi
