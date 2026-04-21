# LeadCop Quick Reference Guide

**Choose Your Path Based On Your Role**

---

## 👤 I'm A Business Owner / Manager

### What You Need to Know in 2 Minutes

**The Problem:**
- Fake sign-ups waste $15,000-$225,000/year
- Support team distracted by non-existent users
- Your data isn't trustworthy for decisions

**The Solution:**
- LeadCop catches 93% of fake emails automatically
- Takes 5 minutes to set up
- Saves you $74K+/year immediately

**Your Next Step:**

1. [Create Free Account](https://app.leadcop.io/signup) (30 seconds)
2. Ask your developer to add one line of code
3. Come back in 1 week to see real results

**Expected Results (First Month):**
- Fake accounts down 90%+
- Support tickets reduced by 94%
- Data quality improved 28 points
- Monthly savings: $6K-$70K depending on size

**Budget:** $10-$30/month (Pro or Max plan)

---

## 💻 I'm A Developer

### Quick Start

**1. Get Your API Key**
```
Dashboard → Settings → API → Copy Key
```

**2. Test It**
```bash
curl -X POST https://api.leadcop.io/check-email \
  -H "Authorization: Bearer sk_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@tempmail.com"}'
```

**3. Integrate into Your App**

**Option A: HTML Form (Easiest)**

```html
<script 
  src="https://leadcop.io/temp-email-validator.js"
  data-api-key="sk_live_YOUR_KEY"
  data-form-selector="form#signup">
</script>
```

**Option B: REST API (Most Flexible)**

```javascript
const result = await fetch('https://api.leadcop.io/check-email', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer sk_live_YOUR_KEY`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ email: 'user@example.com' })
}).then(r => r.json());
```

**Response:**
```json
{
  "valid": true,
  "disposable": false,
  "reputationScore": 85,
  "riskLevel": "low"
}
```

**Option C: Smart Integration**

See [Full API Docs](./API_DOCUMENTATION.md) for:
- Bulk checks
- Webhooks
- Error handling
- Code examples in every language

### Common Scenarios

**Validate During Signup:**
```javascript
const { valid, disposable } = await checkEmail(userEmail);
if (!valid || disposable) {
  throw new Error('Invalid email');
}
```

**Check Existing Users:**
```javascript
const results = await checkEmailsBulk(userEmails);
const fakeUsers = results.filter(r => r.disposable);
```

**Webhook Alerts:**
```
Set up in Dashboard → Settings → Webhooks
We'll POST every result to your endpoint
```

### Performance Tips

✅ Use batch endpoint for 100s of emails  
✅ Cache results to avoid repeat checks  
✅ Debounce form validation (don't check on every keystroke)  
✅ Validate on blur, not on type  

---

## 📊 I'm Running Marketing / Analytics

### What You'll See in Dashboard

**Analytics Tab:**
- How many fake leads today?
- Most common disposable domains
- Your data quality trend (visual chart)
- Cost savings calculation

**Verification History:**
- Every email checked
- Result for each (valid/disposable)
- When checked
- Who triggered it

**Bulk Report:**
- Upload CSV of emails
- Get detailed report back
- Export results

### Common Use Cases

**Lead Gen Campaign:**
- Upload landing page leads → get clean list
- See true conversion rates
- Identify best traffic sources
- Stop paying for fake clicks

**CRM Cleanup:**
- Upload your user database
- Find bad emails
- Export for deletion
- Improve deliverability

**Campaign Validation:**
- Before sending email blast
- Check list quality
- See bounce prediction
- Optimize send time

---

## 🎨 I'm Managing Product / Design

### How to Customize

**Error Message:**
```javascript
"Please use your real email to access exclusive features"
// vs default "This email is temporary"
```

**Colors:**
```javascript
data-error-color="#ef4444"  // Red
data-success-color="#10b981"  // Green
data-background-color="#f3f4f6"  // Light
```

**When to Show Error:**
```javascript
data-show-on="blur"  // Show after user leaves field
// vs "type" (show while typing)
```

**Error Position:**
```javascript
data-error-position="below"  // Below field
// vs "tooltip", "top", "bottom"
```

### User Experience Tips

✅ **Be Friendly:** Explain why we need real email  
✅ **Be Clear:** Show a helpful error message  
✅ **Be Fast:** Validate silently in background  
✅ **Be Subtle:** Don't interrupt user flow  

**Example Message:**
```
"This email is temporary. 
To get started, use your permanent email address."
```

vs

```
"REJECTED: DISPOSABLE EMAIL DETECTED"
```

---

## 🔧 I Need Integration Help

### Platform-Specific Setup

**WordPress:**
- [Plugin coming soon] or use HTML method
- Add to theme → header.php
- Customize colors in plugin settings

**Shopify:**
- Add to checkout form
- Customize error messaging
- See results in LeadCop dashboard

**React / Next.js:**
See [React Example](./API_DOCUMENTATION.md#react)

**Vue / Angular:**
Use REST API endpoint in your validation

**Custom Form:**
Any HTML form works - add one script tag

**Mobile App:**
Use REST API with your auth method

### Still Stuck?

**Email:** support@leadcop.io  
**Chat:** [leadcop.io](https://leadcop.io)  
**Docs:** [API Reference](./API_DOCUMENTATION.md)

---

## 📈 I Want to Maximize ROI

### The Math

**Example: E-Commerce Store**

```
Monthly Checkouts: 2,000
Fake Checkout Rate: 8% (160/month)
Avg Chargeback: $450
Monthly Loss: $72,000

With LeadCop:
Fake Blocked: 150 (94%)
Chargebacks Prevented: $67,500
LeadCop Cost: $30/month
Net Savings: $67,470/month

ROI: 2,249x 🚀
Payback: < 1 hour
```

### Optimization Tips

1. **Start with Free Plan**
   - 100 checks/month
   - See if it works for you
   - Measure results

2. **Upgrade When Needed**
   - Calculate your fake signup cost
   - Compare to plan cost
   - ROI almost always 100x+

3. **Track Metrics**
   - Fake accounts before/after
   - Support tickets saved
   - Cost per real signup
   - Customer lifetime value increase

4. **A/B Test Error Messages**
   - Try different wordings
   - See which converts best
   - Optimize your message

### Success Metrics to Track

| Metric | Before | Target | Formula |
|--------|--------|--------|---------|
| Fake Accounts | 1,250/mo | 78/mo | -93% |
| Data Quality | 70% | 98% | +28 pts |
| Support Tickets | 800 | 50 | -94% |
| Cost per Real User | $3.00 | $2.50 | -17% |
| Customer Retention | 52% | 78% | +26 pts |

---

## 🆘 Troubleshooting

### "It's not working"

**Check 1:** Is the API key correct?
```
Settings → API Keys → Copy again
```

**Check 2:** Is it on the right form?
```
data-form-selector="form#signup"
// Make sure selector matches your HTML
```

**Check 3:** Is JavaScript enabled?
```
Browser Console (F12) → Check for errors
```

**Check 4:** Is HTTPS working?
```
API only works over HTTPS, not HTTP
```

### "Results seem wrong"

**False Positives Rare:**
- Only 0.8% of real emails flagged
- User can use different email
- Check the reputation score

**Need Manual Review:**
- Export to CSV
- Review borderline cases
- Contact support@leadcop.io

### "It's too slow"

**Normal Speed:**
- Quick scan: 200ms
- Full verification: 5-8 seconds
- This is expected

**Optimize:**
- Validate on blur, not type
- Use batch for multiple
- Implement caching
- Use webhooks for async

---

## 📞 Support Paths

### I Need...

**General Questions**
→ Email: support@leadcop.io
→ Response: 24 hours

**Integration Help**
→ Chat: [leadcop.io](https://leadcop.io)
→ Response: Usually <1 hour

**Bug Report**
→ Email: bugs@leadcop.io
→ Include error message & API key

**Enterprise Support**
→ Contact: sales@leadcop.io
→ Dedicated account manager

**Documentation**
→ Main: [Full Docs](./DISPOSABLE_EMAIL_GUIDE.md)
→ API: [Technical API](./API_DOCUMENTATION.md)
→ Examples: See this file

---

## 🎯 Quick Decision Tree

**START HERE:**

```
"What's my role?"

  → Manager/Owner
     → Go to: Business Owner Section
     → Action: Create free account
     → Time: 2 minutes

  → Developer
     → Go to: Developer Section
     → Action: Get API key & integrate
     → Time: 5-30 minutes

  → Marketer/Analyst
     → Go to: Marketing Section
     → Action: Set up analytics
     → Time: 10 minutes

  → Need Help
     → Go to: Troubleshooting
     → Action: Check your issue
     → Then email support
```

---

## 📋 Implementation Checklist

### Getting Started
- [ ] Create account at [leadcop.io](https://leadcop.io)
- [ ] Copy API key from dashboard
- [ ] Choose integration method (HTML, API, or widget)

### Development
- [ ] Add one line of code / one API call
- [ ] Test with known disposable email
- [ ] Test with known real email
- [ ] Check error handling

### Deploy
- [ ] Deploy to staging environment
- [ ] Run 24-hour test with real traffic
- [ ] Monitor for issues
- [ ] Deploy to production

### Monitor
- [ ] Check dashboard weekly
- [ ] Review analytics for trends
- [ ] Track ROI metrics
- [ ] Celebrate fake account reduction!

---

## 🎓 Learn More

**For Managers:**
- [Full Business Guide](./DISPOSABLE_EMAIL_GUIDE.md)
- [ROI Calculator](https://leadcop.io/roi-calculator)
- [Case Studies](https://leadcop.io/customers)

**For Developers:**
- [API Documentation](./API_DOCUMENTATION.md)
- [Code Examples](./API_DOCUMENTATION.md#code-examples)
- [Integration Guides](./API_DOCUMENTATION.md#integration-examples)

**For Marketing:**
- [Analytics Guide](./DISPOSABLE_EMAIL_GUIDE.md#dashboard-features)
- [Best Practices](./DISPOSABLE_EMAIL_GUIDE.md#use-cases)

---

**Last Updated:** April 20, 2026

**Questions?** support@leadcop.io
