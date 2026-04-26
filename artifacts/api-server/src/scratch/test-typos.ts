import { getDomainSuggestion } from "../lib/reputation.js";

async function runTests() {
  console.log("🚀 Testing Advanced Typo Detection\n");

  const testCases = [
    // Static mapping
    { domain: "gamil.com", expected: "gmail.com" },
    
    // Fuzzy matching (Distance 1)
    { domain: "gmaill.com", expected: "gmail.com" },  // extra 'l'
    { domain: "gmal.com", expected: "gmail.com" },    // missing 'i'
    { domain: "yhoo.com", expected: "yahoo.com" },    // missing 'a'
    { domain: "hotnail.com", expected: "hotmail.com" }, // 'n' instead of 'm'
    
    // TLD corrections
    { domain: "gmail.co", expected: "gmail.com" },
    { domain: "yahoo.cm", expected: "yahoo.com" },
    
    // Should NOT suggest for legitimate domains
    { domain: "google.com", expected: null },
    { domain: "microsoft.com", expected: null },
    { domain: "brand.com", expected: null },
  ];

  testCases.forEach(t => {
    const result = getDomainSuggestion(t.domain);
    const success = result === t.expected;
    console.log(`- Domain '${t.domain}' -> Result: '${result}' ${success ? "✅" : "❌"} (Expected: '${t.expected}')`);
  });

  console.log("\n🏁 Tests Completed.");
}

runTests();
