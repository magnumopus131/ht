#!/bin/bash
# Dear, Tear Complete Setup Script

set -e

echo "=========================================="
echo "Dear, Tear Setup Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}Python 3 is required but not installed.${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js is required but not installed.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}npm is required but not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites met${NC}"
echo ""

# Backend setup
echo -e "${BLUE}Setting up backend...${NC}"
cd backend

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing Python dependencies..."
pip install -q -r requirements.txt

if [ ! -d "models" ]; then
    mkdir -p models
fi

echo -e "${GREEN}✓ Backend setup complete${NC}"
cd ..
echo ""

# Frontend setup
echo -e "${BLUE}Setting up frontend...${NC}"
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

echo -e "${GREEN}✓ Frontend setup complete${NC}"
cd ..
echo ""

# Summary
echo "=========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "To start the backend:"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  python main.py"
echo ""
echo "To start the frontend (in a new terminal):"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Then visit:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:8000"
echo "  - API Docs: http://localhost:8000/docs"
echo ""
echo "To seed sample data:"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  python seed_data.py"
echo ""
echo "For more information, see:"
echo "  - QUICKSTART.md"
echo "  - DOCUMENTATION.md"
echo "  - SOLUTION_SUMMARY.md"
echo ""
