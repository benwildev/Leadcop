import { isForwardingEmail, isForwardingMx } from "../lib/reputation.js";

async function runTests() {
  console.log("🚀 Testing Advanced Relay Detection\n");

  const domainTests = [
    { domain: "mozmail.com", expected: true },
    { domain: "duck.com", expected: true },
    { domain: "gmail.com", expected: false },
    { domain: "custom-brand.org", expected: false },
  ];

  console.log("Method 1: Domain-based Detection");
  domainTests.forEach(t => {
    const result = isForwardingEmail(t.domain);
    console.log(`- Domain '${t.domain}' relay? ${result === t.expected ? "✅" : "❌"} (Result: ${result})`);
  });

  const mxTests = [
    { name: "Custom domain with SimpleLogin", mxs: ["mx1.simplelogin.co", "mx2.simplelogin.co"], expected: true },
    { name: "Custom domain with AnonAddy", mxs: ["mail.anonaddy.me"], expected: true },
    { name: "Apple Private Relay server", mxs: ["mx-relay.appleid.com"], expected: true },
    { name: "Regular Gmail MX", mxs: ["gmail-smtp-in.l.google.com"], expected: false },
    { name: "Empty MX list", mxs: [], expected: false },
  ];

  console.log("\nMethod 2: MX Fingerprinting");
  mxTests.forEach(t => {
    const result = isForwardingMx(t.mxs);
    console.log(`- ${t.name} relay? ${result === t.expected ? "✅" : "❌"} (Result: ${result})`);
  });

  console.log("\n🏁 Tests Completed.");
}

runTests();
