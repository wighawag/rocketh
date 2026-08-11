---
---

Notes only: the `ask-policy-interactive-resolver` decisions note cited `requireSuccessfulExecutedTransaction`, a symbol that does not exist. The function that landed is `waitForPastedTransaction`, which absorbed the successful-status check during the same requeue that added the unknown-hash bound. Corrected in place with a dated correction line; the substance of the decision is unchanged.
