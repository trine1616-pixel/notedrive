#!/bin/bash

# NoteDrive Cloud Run 배포 스크립트
# 필수: gcloud CLI 설치 및 로그인 필요

# 1. 설정 변수
PROJECT_ID=$(gcloud config get-value project)
SERVICE_NAME="notedrive"
REGION="asia-northeast3" # 서울 리전
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

if [ -z "$PROJECT_ID" ]; then
  echo "오류: gcloud 프로젝트가 설정되지 않았습니다. 'gcloud config set project [PROJECT_ID]'를 실행하세요."
  exit 1
fi

echo ">>> 프로젝트 ID: ${PROJECT_ID}"
echo ">>> 서비스명: ${SERVICE_NAME}"
echo ">>> 리전: ${REGION}"

# 2. Docker 이미지 빌드 및 푸시 (Artifact Registry 추천되나 편의상 GCR 사용)
echo ">>> 이미지를 빌드하고 Google Container Registry로 푸시합니다..."
gcloud builds submit --tag ${IMAGE_NAME} .

# 3. Cloud Run 배포
echo ">>> Cloud Run으로 배포를 시작합니다 (max-instances: 1)..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --max-instances 1 \
  --port 3000

# 4. 완료 메시지
echo ">>> 배포가 완료되었습니다!"
gcloud run services describe ${SERVICE_NAME} --platform managed --region ${REGION} --format 'value(status.url)'
