#!/bin/bash

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "GitHub CLI (gh) is not installed. Please install it first."
    echo "Visit: https://cli.github.com/manual/installation"
    exit 1
fi

# Check if user is authenticated with GitHub
if ! gh auth status &> /dev/null; then
    echo "Please authenticate with GitHub first using: gh auth login"
    exit 1
fi

# Get the repository name
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)

echo "Setting up GitHub secrets for $REPO"
echo "----------------------------------------"

# Firebase configuration
read -p "Enter Firebase API Key: " FIREBASE_API_KEY
read -p "Enter Firebase Auth Domain: " FIREBASE_AUTH_DOMAIN
read -p "Enter Firebase Project ID: " FIREBASE_PROJECT_ID
read -p "Enter Firebase Storage Bucket: " FIREBASE_STORAGE_BUCKET
read -p "Enter Firebase Messaging Sender ID: " FIREBASE_MESSAGING_SENDER_ID
read -p "Enter Firebase App ID: " FIREBASE_APP_ID

# Get Firebase service account key
echo "Please provide the path to your Firebase service account key JSON file:"
read -p "Path to service-account.json: " SERVICE_ACCOUNT_PATH

if [ ! -f "$SERVICE_ACCOUNT_PATH" ]; then
    echo "Error: Service account file not found at $SERVICE_ACCOUNT_PATH"
    exit 1
fi

# Get Expo token
read -p "Enter Expo token: " EXPO_TOKEN

# Set secrets
echo "Setting secrets..."
gh secret set FIREBASE_API_KEY -b"$FIREBASE_API_KEY"
gh secret set FIREBASE_AUTH_DOMAIN -b"$FIREBASE_AUTH_DOMAIN"
gh secret set FIREBASE_PROJECT_ID -b"$FIREBASE_PROJECT_ID"
gh secret set FIREBASE_STORAGE_BUCKET -b"$FIREBASE_STORAGE_BUCKET"
gh secret set FIREBASE_MESSAGING_SENDER_ID -b"$FIREBASE_MESSAGING_SENDER_ID"
gh secret set FIREBASE_APP_ID -b"$FIREBASE_APP_ID"
gh secret set FIREBASE_SERVICE_ACCOUNT < "$SERVICE_ACCOUNT_PATH"
gh secret set EXPO_TOKEN -b"$EXPO_TOKEN"

echo "----------------------------------------"
echo "All secrets have been set successfully!"
echo "You can now push to the main or develop branch to trigger the CI/CD pipeline." 