# LeadCop API Documentation

**Complete Reference for Developers**

---

## Quick Start

### Get Your API Key

1. Sign up at [leadcop.io](https://leadcop.io)
2. Go to Dashboard → API Keys
3. Copy your key

### Your First Request

```bash
curl -X POST https://api.leadcop.io/check-email \
  -H "Authorization: Bearer sk_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@tempmail.com"}'
```

---

## Core Endpoints

### 1. Check Single Email

**Endpoint:** `POST /check-email`

**Authentication Required:** Yes

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response (Success - 200):**

```json
{
  "email": "user@example.com",
  "valid": true,
  "disposable": false,
  "mxExists": true,
  "inboxExists": true,
  "freeEmail": false,
  "roleAccount": false,
  "dnsblListed": false,
  "reputationScore": 85,
  "riskLevel": "low",
  "tags": ["corporate", "verified"],
  "domain": "example.com",
  "provider": "corporate",
  "domainAge": "15 years"
}
```

**Response (Disposable Email):**

```json
{
  "email": "user@tempmail.com",
  "valid": false,
  "disposable": true,
  "mxExists": true,
  "inboxExists": false,
  "freeEmail": false,
  "roleAccount": false,
  "dnsblListed": false,
  "reputationScore": 18,
  "riskLevel": "high",
  "tags": ["disposable", "temporary"],
  "domain": "tempmail.com",
  "provider": "tempmail"
}
```

---

### 2. Bulk Check (Multiple Emails)

**Endpoint:** `POST /check-emails/bulk`

**Rate Limit:** Max 100 emails per request

**Request:**

```json
{
  "emails": [
    "alice@company.com",
    "bob@tempmail.com",
    "charlie@gmail.com",
    "david@10minutemail.com",
    "invalid@"
  ]
}
```

**Response:**

```json
{
  "results": [
    {
      "email": "alice@company.com",
      "valid": true,
      "disposable": false,
      "reputationScore": 85,
      "riskLevel": "low"
    },
    {
      "email": "bob@tempmail.com",
      "valid": false,
      "disposable": true,
      "reputationScore": 18,
      "riskLevel": "high"
    },
    {
      "email": "charlie@gmail.com",
      "valid": true,
      "disposable": false,
      "reputationScore": 68,
      "riskLevel": "medium"
    },
    {
      "email": "david@10minutemail.com",
      "valid": false,
      "disposable": true,
      "reputationScore": 22,
      "riskLevel": "high"
    },
    {
      "email": "invalid@",
      "valid": false,
      "disposable": false,
      "reputationScore": 0,
      "error": "Invalid email format"
    }
  ],
  "summary": {
    "total": 5,
    "valid": 2,
    "invalid": 3,
    "disposable": 2,
    "processed": 5,
    "failed": 0,
    "processingTimeMs": 8450
  }
}
```

---

### 3. Public Free API (No Auth)

**Endpoint:** `POST /verify/free`

**No Authentication Required** ✓

**Rate Limit:** 1 request/second per IP (60 requests/minute)

**Request:**

```json
{
  "email": "test@tempmail.com"
}
```

**Response:**

```json
{
  "email": "test@tempmail.com",
  "valid": false,
  "disposable": true,
  "mxExists": true,
  "inboxExists": false,
  "reputationScore": 18,
  "riskLevel": "high"
}
```

**Rate Limit Headers:**

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1713628800
```

---

## Response Fields Explained

| Field | Type | Description |
|-------|------|-------------|
| `email` | string | The email address checked |
| `valid` | boolean | Is this a valid email? |
| `disposable` | boolean | Is this a disposable/temporary email? |
| `mxExists` | boolean | Does the domain have MX records? |
| `inboxExists` | boolean | Does the inbox actually exist? |
| `freeEmail` | boolean | Is this a free provider (Gmail, Yahoo, etc.)? |
| `roleAccount` | boolean | Is this a role account (admin@, support@, etc.)? |
| `dnsblListed` | boolean | Is this domain on spam blacklists? |
| `reputationScore` | number | Risk score 0-100 (higher = safer) |
| `riskLevel` | string | One of: `low`, `medium`, `high`, `critical` |
| `tags` | array | Categories: disposable, corporate, verified, etc. |
| `domain` | string | The domain part of the email |
| `provider` | string | Email provider name if detected |
| `domainAge` | string | How old the domain is |

---

## Error Handling

### Invalid Email Format

```json
{
  "email": "invalid@format",
  "valid": false,
  "error": "Invalid email format",
  "errorCode": "INVALID_FORMAT"
}
```

### Rate Limited

```json
{
  "error": "Rate limit exceeded",
  "errorCode": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

### Invalid API Key

```json
{
  "error": "Invalid API key",
  "errorCode": "INVALID_API_KEY"
}
```

---

## Code Examples

### JavaScript/Node.js

```javascript
const API_KEY = 'sk_live_YOUR_API_KEY';

async function checkEmail(email) {
  const response = await fetch('https://api.leadcop.io/check-email', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

// Usage
const result = await checkEmail('user@tempmail.com');
console.log(result);
// {
//   email: "user@tempmail.com",
//   valid: false,
//   disposable: true,
//   ...
// }
```

---

### Python

```python
import requests

API_KEY = 'sk_live_YOUR_API_KEY'

def check_email(email):
    response = requests.post(
        'https://api.leadcop.io/check-email',
        headers={
            'Authorization': f'Bearer {API_KEY}',
            'Content-Type': 'application/json'
        },
        json={'email': email}
    )
    
    if response.status_code != 200:
        raise Exception(f'API error: {response.status_code}')
    
    return response.json()

def check_emails_bulk(emails):
    response = requests.post(
        'https://api.leadcop.io/check-emails/bulk',
        headers={
            'Authorization': f'Bearer {API_KEY}',
            'Content-Type': 'application/json'
        },
        json={'emails': emails}
    )
    
    return response.json()

# Usage
result = check_email('test@tempmail.com')
print(result)

bulk_results = check_emails_bulk([
    'alice@company.com',
    'bob@tempmail.com',
    'charlie@gmail.com'
])
```

---

### React

```jsx
import { useState } from 'react';

const API_KEY = process.env.REACT_APP_LEADCOP_KEY;

function EmailValidator() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const validateEmail = async (emailValue) => {
    if (!emailValue) return;
    
    setLoading(true);
    try {
      const response = await fetch('https://api.leadcop.io/check-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: emailValue })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter email"
      />
      <button 
        onClick={() => validateEmail(email)}
        disabled={loading}
      >
        {loading ? 'Checking...' : 'Validate'}
      </button>

      {result && (
        <div>
          <p>Email: {result.email}</p>
          <p>Valid: {result.valid ? '✓' : '✗'}</p>
          <p>Disposable: {result.disposable ? 'Yes' : 'No'}</p>
          <p>Risk Level: {result.riskLevel}</p>
          <p>Score: {result.reputationScore}/100</p>
        </div>
      )}
    </div>
  );
}
```

---

### Form Integration (React)

```jsx
import { useEffect, useState } from 'react';

function SignupForm() {
  const [email, setEmail] = useState('');
  const [validation, setValidation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Debounced validation
    const timer = setTimeout(() => {
      if (email) validateEmail(email);
    }, 500);

    return () => clearTimeout(timer);
  }, [email]);

  const validateEmail = async (emailValue) => {
    try {
      const response = await fetch('https://api.leadcop.io/check-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_LEADCOP_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: emailValue })
      });

      const data = await response.json();
      setValidation(data);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validation?.valid) {
      alert('Please enter a valid email');
      return;
    }

    if (validation.disposable) {
      alert('Temporary emails not allowed. Use your real email.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          riskScore: validation.reputationScore
        })
      });

      if (response.ok) {
        alert('Signup successful!');
        setEmail('');
      }
    } catch (error) {
      alert('Signup failed: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
      />

      {validation && (
        <div className={validation.valid && !validation.disposable ? 'success' : 'error'}>
          {validation.disposable && (
            <p>❌ This email is temporary. Use your real email.</p>
          )}
          {!validation.disposable && validation.valid && (
            <p>✅ Email verified ({validation.riskLevel} risk)</p>
          )}
          {!validation.valid && !validation.disposable && (
            <p>⚠️ Invalid email format</p>
          )}
        </div>
      )}

      <button 
        type="submit" 
        disabled={!validation?.valid || validation?.disposable || isSubmitting}
      >
        {isSubmitting ? 'Creating account...' : 'Sign Up'}
      </button>
    </form>
  );
}
```

---

### PHP

```php
<?php

class LeadCopValidator {
    private $apiKey;
    private $baseUrl = 'https://api.leadcop.io';

    public function __construct($apiKey) {
        $this->apiKey = $apiKey;
    }

    public function checkEmail($email) {
        $response = $this->makeRequest('POST', '/check-email', [
            'email' => $email
        ]);
        
        return json_decode($response, true);
    }

    public function checkEmailsBulk($emails) {
        $response = $this->makeRequest('POST', '/check-emails/bulk', [
            'emails' => $emails
        ]);
        
        return json_decode($response, true);
    }

    private function makeRequest($method, $endpoint, $data) {
        $url = $this->baseUrl . $endpoint;
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $this->apiKey,
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        return $response;
    }
}

// Usage
$validator = new LeadCopValidator('sk_live_YOUR_API_KEY');

$result = $validator->checkEmail('test@tempmail.com');
var_dump($result);
```

---

### Webhooks

**Setup Webhooks in Dashboard:**

1. Go to Settings → Webhooks
2. Add your endpoint URL
3. We'll POST to that URL when an email is checked

**Webhook Payload:**

```json
{
  "event": "email.checked",
  "timestamp": "2026-04-20T14:30:00Z",
  "data": {
    "email": "user@tempmail.com",
    "valid": false,
    "disposable": true,
    "reputationScore": 18,
    "riskLevel": "high"
  }
}
```

**Handling in Node.js:**

```javascript
app.post('/leadcop-webhook', (req, res) => {
  const { event, data } = req.body;
  
  if (event === 'email.checked') {
    if (data.disposable) {
      console.log(`Blocked disposable email: ${data.email}`);
      // Log, alert, or trigger actions
    }
  }
  
  res.json({ success: true });
});
```

---

## Rate Limiting

### Limits by Plan

| Plan | Requests/Month | Requests/Second |
|------|----------------|-----------------|
| FREE | 100 | 1 |
| PRO | 500 | 10 |
| MAX | 10,000 | 50 |
| Enterprise | Custom | Custom |

### Rate Limit Headers

All responses include:

```
X-RateLimit-Limit: 500
X-RateLimit-Remaining: 456
X-RateLimit-Reset: 1713628800
```

### What Happens When Rate Limited

```json
{
  "error": "Rate limit exceeded",
  "errorCode": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

Status Code: `429 Too Many Requests`

---

## Performance Tips

### 1. Batch Requests

❌ Slow: Check 100 emails one by one

```javascript
for (let email of emails) {
  await validateEmail(email); // 100 requests, ~500ms each
}
```

✅ Fast: Check in batches

```javascript
const batches = chunk(emails, 50);
for (let batch of batches) {
  await validateEmailsBulk(batch); // 2 requests, 8s total
}
```

### 2. Cache Results

Don't validate the same email twice:

```javascript
const cache = {};

async function validateWithCache(email) {
  if (cache[email]) {
    return cache[email];
  }
  
  const result = await validateEmail(email);
  cache[email] = result;
  return result;
}
```

### 3. Validate on Form Blur

Don't validate on every keystroke. Debounce or validate on blur:

```javascript
input.addEventListener('blur', () => {
  validateEmail(input.value);
});
```

### 4. Use Webhooks for Async Processing

For high-volume: Submit email, get callback when done

```javascript
// Queue email for checking
fetch('/api/queue-check', { 
  method: 'POST',
  body: JSON.stringify({ email })
});

// We'll POST results to your webhook endpoint later
```

---

## Security

### API Key Best Practices

✅ **DO:**
- Store keys in environment variables
- Rotate keys regularly
- Use different keys for different environments
- Never commit keys to Git

❌ **DON'T:**
- Expose keys in client-side code
- Share keys via email
- Use same key for dev/production
- Hard-code keys

### HTTPS Required

All API calls must use HTTPS. HTTP requests will be rejected.

---

## Troubleshooting

### "Invalid API Key"

```json
{
  "error": "Invalid API key",
  "errorCode": "INVALID_API_KEY"
}
```

**Solution:** Check your API key is correct and active

### "Rate limit exceeded"

```json
{
  "error": "Rate limit exceeded",
  "errorCode": "RATE_LIMIT_EXCEEDED"
}
```

**Solution:** 
- Upgrade your plan
- Wait for rate limit window
- Use batch endpoint for multiple emails
- Implement caching

### "Invalid email format"

```json
{
  "error": "Invalid email format",
  "errorCode": "INVALID_FORMAT"
}
```

**Solution:** Validate email format before sending

### Slow responses

**If checks take 8+ seconds:**
- Normal! SMTP verification takes time
- Use asynchronous processing
- Consider webhook integration
- Cache results when possible

---

## Support

**Need Help?**

- **Email:** support@leadcop.io
- **Chat:** [leadcop.io](https://leadcop.io)
- **Docs:** [Full Documentation](https://docs.leadcop.io)
- **Status:** [LeadCop Status Page](https://status.leadcop.io)

---

**Last Updated:** April 20, 2026
