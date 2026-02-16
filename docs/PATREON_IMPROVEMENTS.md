# Patreon Key & Dashboard – Improvement Suggestions

Recommendations for security and user experience. Implement in order of priority where applicable.

---

## 1. Security (安全性)

### 1.1 Key in URL / Query (High)

**Issue:** `GET /api/patreon/me?key=...` sends the key in the URL. URLs are logged (server, proxy, browser history, Referer header), so the key can leak.

**Recommendation:**
- For **GET /api/patreon/me**, accept key **only** via header `X-Patreon-Key` (or `Authorization: Bearer <key>`). Remove support for `req.query.key` and `req.body.key` on GET.
- Frontend: always send key in the header for GET/PUT/PATCH; use body only for POST /api/patreon/validate (no key in URL).
- Optional: add a short-lived **session token** after validate (e.g. signed JWT or random token stored server-side with key ID). Then use that token in header for subsequent requests so the real key is never sent again in that session.

### 1.2 Brute-Force Protection (Medium)

**Issue:** Key is 16 alphanumeric chars; rate limit 30/60s still allows many guesses over time.

**Recommendation:**
- Stricter limit for **POST /api/patreon/validate** only: e.g. 5 failed attempts per IP per 15 minutes (separate rate limiter or lower points for validate).
- Optional: after N failed validations for a given key (or per IP), temporarily block or require CAPTCHA (if you add a CAPTCHA service later).

### 1.3 Admin KEY Delivery (Medium)

**Issue:** KEY is printed in the Discord channel when using `.root addpatreon` / `.root regenkeypatreon`, so it stays in channel history.

**Recommendation:**
- Prefer replying with the KEY in an **ephemeral** message (only the admin sees it), or send the KEY by **DM** to the admin. Requires Discord API (reply with `flags: 64` for ephemeral, or create DM and send there). Document in help: “KEY 僅會以私訊或僅你可見的方式發送”.

### 1.4 Key Storage on Client (Low–Medium)

**Issue:** Key is stored in `sessionStorage`; any XSS can read it.

**Recommendation:**
- Keep key out of URLs (see 1.1).
- Ensure CSP and input sanitization are strong across the app to reduce XSS risk.
- Optional: after validate, use a **short-lived session token** (e.g. 1–2 hours) stored in memory or sessionStorage instead of the key; API accepts that token and looks up the key server-side. Key is then only sent once per login.

### 1.5 API Input Validation (Low)

**Issue:** `targetId`, `platform`, `name` in slots have no length/format limits; very long strings could cause issues.

**Recommendation:**
- Validate and cap length: e.g. `targetId` max 64 chars, `platform` max 32, `name` max 64.
- Reject invalid characters if needed (e.g. IDs are often numeric; platform from a fixed list).
- Return 400 with a clear message when validation fails.

### 1.6 Constant-Time Key Compare (Low)

**Issue:** String comparison can leak information via timing (theoretical).

**Recommendation:**
- Use `crypto.timingSafeEqual(Buffer.from(key, 'utf8'), Buffer.from(stored, 'utf8'))` when comparing key (ensure same length before compare). Optional unless you have high security requirements.

### 1.7 HTTPS Only (Operational)

**Recommendation:**
- In production, serve the Patreon page and all `/api/patreon/*` over HTTPS only; redirect HTTP to HTTPS. Rely on existing server/reverse-proxy config if already in place.

---

## 2. User Experience (使用者角度)

### 2.1 Key Input (Medium)

**Recommendation:**
- **Auto-format:** While typing, optionally insert `-` every 4 characters (e.g. `XXXX-XXXX-XXXX-XXXX`) and allow paste with or without dashes (normalize before validate).
- **Paste-friendly:** On paste, strip spaces and normalize to uppercase; then format for display.
- **Clear hint:** e.g. “請貼上管理員提供的 KEY，格式為 XXXX-XXXX-XXXX-XXXX”，並在錯誤時提示“請檢查 KEY 是否完整、未過期”。

### 2.2 Instructions & Discovery (Medium)

**Recommendation:**
- Add a short “如何取得 KEY？” section: “若你為 Patreon 會員，請向 HKTRPG 管理員索取登入 KEY，或於 Patreon 訊息中查收。”
- Link to Patreon page from the main site (e.g. in header dropdown “訂閱” or a “Patreon 會員登入” link) so patrons can find the page easily.

### 2.3 Save & Loading State (Low)

**Recommendation:**
- On “儲存名額” click: disable the button and show “儲存中…” (or spinner) until the request returns.
- On success: keep the current “已儲存名額” message; optionally auto-hide after 3 seconds.
- On network error: show “網路錯誤，請檢查連線後再試” and re-enable the button.

### 2.4 Slot Hints by Platform (Low)

**Recommendation:**
- For “User/Channel ID”: add short hints, e.g. “Discord：為數字 ID，可透過開發者模式取得” or “Discord: numeric ID (enable Developer Mode to copy)”.
- Optional: validate format per platform (e.g. Discord IDs are numeric) and show inline error before save.

### 2.5 Empty State & Tier Limit (Low)

**Recommendation:**
- When `maxSlots` is 0 or no slots used, show one line: “你目前可分配 X 個名額（依 TIER）。在下方填寫 User/Channel ID 並儲存.”
- Show “已使用 X / Y 個名額” near the slots area so the limit is clear.

### 2.6 Logout Clarity (Low)

**Recommendation:**
- Keep the red “登出” button; add a small tooltip or aria-label: “登出並清除本頁登入狀態”，避免使用者以為會登出其他服務.
- Optional: on logout, clear only Patreon key/session and show the key entry screen again with a short “已登出” message.

### 2.7 Session Timeout (Optional)

**Recommendation:**
- After e.g. 30–60 minutes of no API activity, clear key from sessionStorage and show the login form again with “登入已過期，請重新輸入 KEY”. Can be implemented with a last-activity timestamp and a timer on the page.

### 2.8 Accessibility (Optional)

**Recommendation:**
- Ensure key input has a visible `<label for="patreonKey">` (already present).
- After failed login, move focus to the key input and announce error (e.g. `aria-live="polite"` on the error div).
- Use `aria-describedby` for slot column headers on PC so screen readers understand the table.

### 2.9 Error Messages (Low)

**Recommendation:**
- Use consistent, user-friendly messages: e.g. “KEY 無效或已過期，請向管理員確認” instead of only “Invalid or inactive key”.
- For 429: “操作太頻繁，請稍後再試.”
- For 500: “伺服器暫時錯誤，請稍後再試.”

---

## 3. Summary Priority

| Priority | Area        | Suggestion                                      |
|----------|-------------|--------------------------------------------------|
| High     | Security    | Stop sending key in URL (GET/query); header only |
| Medium   | Security    | Stricter rate limit for validate; admin KEY via DM/ephemeral |
| Medium   | UX          | Key auto-format & paste; “如何取得 KEY” 說明    |
| Low      | Security    | Input length limits; optional session token      |
| Low      | UX          | Save loading state; slot hints; clearer errors   |

Implementing **1.1** (no key in URL) and **1.2** (stricter validate rate limit) gives the best security gain for moderate effort. Then add **2.1** and **2.2** for a better patron experience.
