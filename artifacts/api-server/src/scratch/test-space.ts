import { loadDomainCache, isDisposableDomain } from "../lib/domain-cache.js";

async function test() {
  await loadDomainCache();
  
  const d1 = "mailinator.com";
  const d2 = "mailinator.com "; // trailing space
  
  console.log(`Is '${d1}' disposable? ${isDisposableDomain(d1)}`);
  console.log(`Is '${d2}' disposable? ${isDisposableDomain(d2)}`);
  
  process.exit(0);
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
