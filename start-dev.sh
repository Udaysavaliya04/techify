#!/bin/bash

# Development environment setup
# This script helps run the frontend with production-like API URL configuration

echo "Setting up development environment..."

# Set API URL for frontend (adjust as needed)
export REACT_APP_API_URL="http://localhost:5000"

echo "Frontend will connect to: $REACT_APP_API_URL"
echo "Starting frontend development server..."

cd frontend && npm start
