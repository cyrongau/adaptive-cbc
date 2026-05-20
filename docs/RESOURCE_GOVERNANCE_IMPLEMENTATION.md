Now I have a thorough understanding of both governance documents and the current codebase. Here's the implementation plan:
Resource Governance Implementation Plan
Phase 1: Core Governance Infrastructure (Foundation)
1.1 Governance Module (backend/src/modules/governance/)
- 
GovernanceModule - Central module exports all governance services
- 
UsageTrackerService - Redis-backed usage counter (sliding window)
- 
QuotaEnforcerService - Checks limits before allowing operations
- 
CreditLedgerService - Tracks credit consumption/allocations
- 
CostRouterService - Decides which AI/OCR tier to use based on task complexity + user tier
1.2 Database Entities
- 
UsageLog - Per-operation log (userId, service, cost, timestamp, tier)
- 
CreditBalance - User/institution credit balances (AI credits, OCR pages, compute credits)
- 
QuotaConfig - Tier-based limits (Free/Standard/Tutor/School/Enterprise)
- 
GovernanceRule - Dynamic rules (daily caps, escalation thresholds)
1.3 Redis Integration
- 
Connect NestJS CacheModule to Redis
- 
Token bucket implementation for rate limiting
- 
Sliding window counters for daily quotas
- 
Priority queue metadata for job scheduling
1.4 Guards & Interceptors
- 
QuotaGuard - Decorator-based quota check (@Quota('ocr', 2))
- 
UsageTrackingInterceptor - Auto-logs API usage to Redis + DB
- 
CostRoutingInterceptor - Routes requests to appropriate AI tier
Phase 2: OCR Governance (Immediate Cost Control)
2.1 Hybrid OCR Pipeline (modify services/ocr-service/)
- 
Step 1: Tesseract (free) → confidence score
- 
Step 2: If confidence < 85%, escalate only low-confidence blocks to Google Vision
- 
Step 3: Math formulas → Mathpix (deferred, placeholder)
- 
Store confidence per block for escalation decisions
2.2 Duplicate Detection
- 
Perceptual hashing (imagehash) on uploaded PDFs
- 
Check MinIO for existing similar documents before OCR
- 
Skip processing if duplicate found, return existing result
2.3 OCR Quotas (per tier)
- 
Free: 3 pages/day
- 
Standard: 20 pages/day
- 
Tutor: 100 pages/day
- 
School: 2000 pages/month (shared pool)
- 
Low-priority Celery queue for free users
2.4 OCR Cost Tracking
- 
Log each page processed with cost estimate
- 
Track per-user, per-institution, per-day spend
- 
Alert when approaching daily cap ($15/day max OCR)
Phase 3: AI Governance (Token Cost Control)
3.1 AI Cost Routing (modify ai-service/ + backend calls)
- 
Layer 1: Regex/local logic for simple tasks (question numbering, option detection)
- 
Layer 2: Cheap OpenRouter models (google/gemini-2.0-flash-001) for medium tasks
- 
Layer 3: Premium models (anthropic/claude-3.5-sonnet) only when confidence low or premium user
3.2 AI Quotas (per tier)
- 
Free: 15 AI requests/day
- 
Standard: 100 AI requests/day
- 
Tutor: 500 AI requests/day
- 
School: Shared pool (configurable)
3.3 AI Response Caching
- 
Cache key: hash(request_type + content_hash + user_tier)
- 
Reuse explanations for identical questions globally
- 
Cache embeddings permanently
- 
Never regenerate identical intelligence
3.4 AI Usage Tracking
- 
Log token usage per request (input/output tokens)
- 
Track cost per user/institution
- 
Daily cap: $20/day max AI spend
Phase 4: User Tier System
4.1 Tier Definitions
- 
Extend User entity with tier field (or derive from role + subscription)
- 
Default tier mapping:
- 
STUDENT → Free
- 
TEACHER → Tutor
- 
TUTOR → Tutor
- 
INSTITUTION_ADMIN → School
- 
SUPER_ADMIN → Enterprise
4.2 Institution Resource Pools
- 
Extend Institution.subscription JSONB with:
- 
ocrPagesRemaining, aiCreditsRemaining, liveClassHoursRemaining
- 
Monthly reset date
- 
Pool allocation per student/teacher
4.3 Priority Scheduling
- 
Celery queue routing: high (School), medium (Tutor), low (Free)
- 
AI request queue with tier-based priority
Phase 5: Observability & Admin Controls
5.1 Cost Analytics Endpoints
- 
GET /admin/governance/costs - Cost per feature/service
- 
GET /admin/governance/usage/:userId - User usage breakdown
- 
GET /admin/governance/quotas - Current quota utilization
- 
GET /admin/governance/forecast - Projected monthly spend
5.2 Admin Dashboard Data
- 
Real-time usage counters
- 
Quota breach alerts
- 
Cost per institution/student
- 
AI success rates + fallback frequency
5.3 Graceful Degradation
- 
When quota exceeded: return error with retry-after header
- 
When AI service down: fallback to cached responses or local logic
- 
When OCR cap reached: queue for next cycle, notify user
Implementation Order & Dependencies
Week 1-2: Phase 1 (Core Infrastructure)
  ├── Redis integration
  ├── UsageTrackerService
  ├── QuotaEnforcerService
  └── Database entities + migrations
Week 2-3: Phase 2 (OCR Governance)
  ├── Hybrid OCR pipeline (Tesseract first)
  ├── Duplicate detection
  ├── OCR quotas + priority queues
  └── Cost tracking
Week 3-4: Phase 3 (AI Governance)
  ├── AI cost routing (3-tier)
  ├── AI quotas + caching
  └── Token usage tracking
Week 4-5: Phase 4 (User Tiers)
  ├── Tier system + institution pools
  ├── Priority scheduling
  └── Frontend quota displays
Week 5-6: Phase 5 (Observability)
  ├── Admin analytics endpoints
  ├── Cost forecasting
  └── Graceful degradation
Key Files to Create/Modify
Action	File
Create	backend/src/modules/governance/governance.module.ts
Create	backend/src/modules/governance/entities/usage-log.entity.ts
Create	backend/src/modules/governance/entities/credit-balance.entity.ts
Create	backend/src/modules/governance/entities/quota-config.entity.ts
Create	backend/src/modules/governance/services/usage-tracker.service.ts
Create	backend/src/modules/governance/services/quota-enforcer.service.ts
Create	backend/src/modules/governance/services/credit-ledger.service.ts
Create	backend/src/modules/governance/services/cost-router.service.ts
Create	backend/src/modules/governance/guards/quota.guard.ts
Create	backend/src/modules/governance/interceptors/usage-tracking.interceptor.ts
Create	backend/src/common/redis.service.ts
Modify	services/ocr-service/app/stages/ocr_extraction.py (hybrid Tesseract → Google Vision)
Modify	services/ocr-service/app/tasks.py (priority queue routing)
Modify	backend/src/modules/digital-library/digital-library.service.ts (quota check before OCR)
Modify	backend/src/modules/practice/practice.service.ts (AI quota check)
Modify	ai-service/src/index.ts (cost routing + caching)
Modify	backend/src/common/email.service.ts (quota breach notifications)
Modify	docker-compose.yml (Redis config for backend)