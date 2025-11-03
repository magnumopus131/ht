#!/bin/bash
# Backend setup script

echo "Setting up Dear, Tear backend..."

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create models directory
mkdir -p models

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "DATABASE_URL=sqlite:///./aclguard.db" > .env
    echo "SECRET_KEY=$(openssl rand -hex 32)" >> .env
fi

echo "Backend setup complete!"
echo "To run: source venv/bin/activate && python main.py"
