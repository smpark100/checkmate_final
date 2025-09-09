# MISO API 설정 가이드

## 🔧 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# MISO API 설정
MISO_ENDPOINT=https://api.holdings.miso.gs
MISO_API_KEY=your_actual_api_key_here
```

## 📝 설정 방법

1. **프로젝트 루트에 `.env.local` 파일 생성**
   ```bash
   touch .env.local
   ```

2. **환경변수 값 입력**
   - `MISO_ENDPOINT`: MISO API 서버 주소
   - `MISO_API_KEY`: 발급받은 API 키

3. **개발 서버 재시작**
   ```bash
   npm run dev
   ```

## ⚠️ 주의사항

- `.env.local` 파일은 Git에 커밋하지 마세요 (보안상 중요)
- API 키는 절대 공개하지 마세요
- 환경변수 변경 후에는 반드시 개발 서버를 재시작하세요

## 🐛 문제 해결

### 환경변수 오류
```
Missing MISO_ENDPOINT or MISO_API_KEY environment variables
```
→ `.env.local` 파일이 존재하고 올바른 값이 설정되었는지 확인

### API 호출 오류
```
MISO API 호출 실패 (401)
```
→ API 키가 올바른지 확인

```
MISO API 호출 실패 (404)
```
→ API 엔드포인트 URL이 올바른지 확인

## 📞 지원

API 키나 엔드포인트 정보가 필요하시면 관리자에게 문의하세요.
