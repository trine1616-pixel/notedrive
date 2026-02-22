#!/bin/bash

# Configuration
PROJECT_ID=$(gcloud config get-value project)
SERVICE_NAME="notedrive"
REGION="asia-northeast3" # Seoul or your preferred region
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "🚀 Starting deployment for $SERVICE_NAME to $REGION..."

# 1. Build the image using Google Cloud Build
echo "📦 Building Docker image..."
gcloud builds submit --tag "$IMAGE_NAME" ./notedrive

# 2. Deploy to Cloud Run
echo "🚢 Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_NAME" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --max-instances 1 \
  --memory 512Mi \
  --cpu 1 \
  --set-env-vars "NOTEDRIVE_STORAGE_PROVIDER=gdrive"

echo "✅ Deployment complete!"
gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format 'value(status.url)'
echo "서베 포인트를 확인하세요 위 URL로 접속 가능합니다."
echo "⚠️ 중요: GOOGLE_DRIVE_CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN 등은 GCP Console의 Cloud Run 설정에서 'Variables & Secrets'를 통해 별도로 등록해 주어야 합니다."
