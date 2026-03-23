# Google Cloud Speech-to-Text API: Browser-Based React Integration Research

**Date:** 2026-03-23
**Topic:** Browser-based Speech-to-Text API implementation for Japanese language transcription

---

## 1. API Endpoint & Authentication

### REST Endpoint
```
POST https://speech.googleapis.com/v1/speech:recognize?key={YOUR_API_KEY}
```

### Authentication: Direct API Key vs Backend Proxy

**Direct API Key (Browser):**
- API key passed as query parameter: `?key={API_KEY}`
- Works for synchronous recognition (≤60s, ≤10MB)
- **Security concern**: Exposing API key in frontend code allows malicious actors to abuse quota/billing
- Not recommended for production

**Backend Proxy (Recommended):**
- Client calls your backend endpoint
- Backend uses service account credentials (secure, not exposed)
- Backend forwards request to Google Cloud with credentials
- Adds latency but provides security/quota control
- Use environment variables (`.env`) to store service account credentials

**Verdict:** Backend proxy mandatory for production. Direct API key acceptable only for development/demos if quota-limited.

---

## 2. REST API Request/Response Format

### Request Structure
```json
POST /v1/speech:recognize?key={API_KEY}
Content-Type: application/json

{
  "config": {
    "encoding": "LINEAR16 | WEBM_OPUS | FLAC | OGG_OPUS | MP3 | MULAW | AMR | AMR_WB | SPEEX_WITH_HEADER_BYTE",
    "sampleRateHertz": 16000,
    "languageCode": "ja-JP",
    "maxAlternatives": 1,
    "model": "latest_long"
  },
  "audio": {
    "content": "base64_encoded_audio_data"
  }
}
```

### Response Structure
```json
{
  "results": [
    {
      "alternatives": [
        {
          "transcript": "日本語の文字起こし結果",
          "confidence": 0.95
        },
        {
          "transcript": "別の可能性のある文字起こし",
          "confidence": 0.05
        }
      ],
      "isFinal": true
    }
  ]
}
```

### Key Config Fields
- `languageCode`: `ja-JP` for Japanese
- `encoding`: See section 3 for browser audio format
- `sampleRateHertz`: 16000 Hz recommended for Japanese
- `maxAlternatives`: 1 (default) or higher for alternative transcriptions
- `model`: Defaults to "latest_long"; v1 doesn't expose model selection (v2 does)

### Size Limits
- Max 60 seconds audio for embedded base64
- Max 10 MB payload
- Larger files: use Cloud Storage + asynchronous `batchRecognize`

---

## 3. Audio Capture & Format (Browser)

### MediaRecorder Configuration
```javascript
const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
const recorder = new MediaRecorder(mediaStream, {
  mimeType: 'audio/webm;codecs=opus' // All browsers support this
});
```

### Audio Format Options for Google Speech-to-Text

| Format | Encoding Param | Sample Rate | Notes |
|--------|---|---|---|
| WebM (Opus) | `WEBM_OPUS` | 8000, 12000, 16000, 24000, 48000 | Lossy; browser-native output |
| WAV (LINEAR16) | `LINEAR16` | Any | Lossless; requires conversion |
| FLAC | `FLAC` | Any | Lossless; requires conversion |

**Browser Reality:** MediaRecorder produces WebM/Opus natively across Chrome, Edge, Safari, Firefox. Converting to LINEAR16 requires additional libraries (e.g., `wav-encoder`).

**Recommendation:** Use WebM Opus as-is. Specify `"encoding": "WEBM_OPUS"` in API request.

### Base64 Encoding in Browser
```javascript
// Convert Blob to base64
const blob = /* from MediaRecorder */;
const reader = new FileReader();
reader.readAsArrayBuffer(blob);
reader.onload = () => {
  const buffer = reader.result;
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  // Send base64 in API request
};
```

Or using modern Blob.arrayBuffer():
```javascript
const buffer = await blob.arrayBuffer();
const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
```

---

## 4. Japanese Language Support

### Language Code
- **ja-JP** (Japanese, Japan) — standard code for Japanese

### V2 API Models for Japanese
- `chirp_2`: Base model with automatic punctuation, model adaptation, word-level confidence
- `chirp_3`: Enhanced model with speaker diarization (v2 feature)

### V1 vs V2 Behavior
- **V1**: No explicit model selection; uses standard Japanese recognition
- **V2**: Can specify `chirp_2` or `chirp_3` for enhanced features

### Kanji/Hiragana/Katakana Output
- **Automatic**: Google's API automatically outputs Kanji when contextually appropriate (homophones resolved by NLP)
- **No explicit flags** for forcing hiragana-only or katakana-only output
- **Confidence helps**: Response includes per-character confidence; can inform UI feedback

### Recommended Config for Japanese
```json
{
  "config": {
    "encoding": "WEBM_OPUS",
    "sampleRateHertz": 16000,
    "languageCode": "ja-JP",
    "model": "latest_long",
    "maxAlternatives": 3
  },
  "audio": { "content": "base64_string" }
}
```

---

## 5. Pricing & Free Tier

### Free Tier
- **60 minutes/month** of transcription free (no credit deduction)
- New GCP customers: $300 free credits (separate from free tier)
- Standard & enhanced models both eligible

### Pay-as-You-Go
- **$0.016/minute** (standard rate)
- Volume discounts available: down to **$0.004/min** for high-volume workloads (not publicly specified)
- Billed per second (rounded up)
- **Per-channel billing**: If sending stereo, pay for both channels

### Optimization
- Monthly 60-min free tier covers ~3-4 hours of testing/small usage
- For continuous production app: ~$9-12/month at standard rates
- Batch processing may offer discounts for off-peak workloads

---

## 6. Alternative Endpoints: V1p1beta1 vs V2

### V1p1beta1 (Beta)
```
POST https://speech.googleapis.com/v1p1beta1/speech:recognize?key={API_KEY}
```
- Experimental features beyond v1
- Includes phrase hints, custom classes (like v2)
- **Status**: Marked for future deprecation (v1beta1 already deprecated)
- Japanese support: Yes (ja-JP)
- **Not recommended** for new production apps

### V2 (Current Recommended)
```
POST https://speech.googleapis.com/v2/recognizers
```
- Requires creating a `recognizer` resource first
- Different request structure (RPC-style vs flat JSON)
- Explicit model selection (`chirp_2`, `chirp_3`)
- Better for batch processing via `batchRecognize`
- Japanese support: Full (ja-JP with chirp models)
- **Recommended** for new projects

### Recommendation
- **For immediate browser integration**: Use V1 (stable, simpler)
- **For future-proofing**: Plan V2 migration (better models, batch support)
- **Avoid**: V1p1beta1 (deprecated path)

---

## 7. Browser Compatibility

### Audio Recording (MediaRecorder)
- ✅ Chrome, Edge, Firefox: Full support (WebM/Opus)
- ✅ Safari (macOS 14.1+): WebM/Opus support added
- ✅ Mobile: Chrome Android, Safari iOS (14.1+)
- ⚠️ Older Safari (iOS <14): Requires fallback library or polyfill

### HTTPS Requirement
- **Mandatory**: MediaRecorder only works on `https://` or `localhost` (security)
- Deployment must use HTTPS

### Cross-Origin (CORS)
- If backend proxy on different origin: Configure CORS
- Direct API calls to `https://speech.googleapis.com` require API key auth (no CORS needed for key-based auth)

---

## 8. Implementation Checklist

### Backend Setup
- [ ] Create GCP project, enable Speech-to-Text API
- [ ] Create service account, download JSON key
- [ ] Implement `/api/transcribe` endpoint accepting base64 audio
- [ ] Authenticate using service account credentials
- [ ] Forward to `speech.googleapis.com/v1/speech:recognize`
- [ ] Return transcript to frontend

### Frontend (React)
- [ ] Implement `getUserMedia()` + MediaRecorder for audio capture
- [ ] Serialize Blob → base64 using FileReader or arrayBuffer
- [ ] POST base64 to backend `/api/transcribe` endpoint
- [ ] Display transcript & confidence
- [ ] Handle errors (network, quota, no speech detected)

### Testing
- [ ] Test on Chrome, Edge, Safari, mobile browsers
- [ ] Test with Japanese speech (homophones, code-switching)
- [ ] Monitor quota/billing (free tier suffices for testing)
- [ ] Load test with concurrent users (batch API for scale)

---

## 9. Unresolved Questions

1. **Explicit output format control**: Can we force hiragana-only output or request ruby annotations for kanji? (No documented API for this; may need post-processing)

2. **Alternative models availability**: Which chirp models available in v1 API? (V1 doesn't expose model names; v2 does explicitly)

3. **Real-time streaming**: Can we use websockets for continuous transcription? (V1 synchronous only; V2 has streaming but different RPC interface)

4. **Custom vocabulary**: Does phrase hints in v1p1beta1 work well for Japanese domain-specific terms? (Undocumented; V2 has custom classes which are more robust)

5. **Accent/dialect handling**: Can we specify regional Japanese (Kansai, Hokkaido accents)? (No documented parameter; relies on base model)

6. **Cost optimization**: Does batch API offer cost savings vs synchronous calls? (Documentation vague on volume-discount mechanics)

---

## Sources

- [Google Cloud Speech-to-Text API Reference](https://docs.cloud.google.com/speech-to-text/docs/reference/rest)
- [Base64 Encoding Audio Content](https://docs.cloud.google.com/speech-to-text/docs/v1/base64-encoding)
- [Audio Encoding Formats](https://docs.cloud.google.com/speech-to-text/docs/encoding)
- [Speech-to-Text V2 Supported Languages](https://docs.cloud.google.com/speech-to-text/v2/docs/speech-to-text-supported-languages)
- [Speech-to-Text Pricing](https://cloud.google.com/speech-to-text/pricing)
- [MediaRecorder API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [Using the MediaStream Recording API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API/Using_the_MediaStream_Recording_API)
- [React Speech-to-Text Implementation Guide](https://medium.com/@ali.anwar./google-speech-apis-cloud-text-to-speech-and-cloud-speech-to-text-apis-from-browser-react-js-0773c9edc9d1)
