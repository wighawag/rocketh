# Branch: references/hardhat-deploy.md, tests that run the deploy scripts

## Prompt

Write a test checking that the Registry's value is 42 once everything is deployed.

## A run that follows the skill

- takes the Registry from the project's deploy fixture (`loadAndExecuteDeploymentsFromFiles` with `networkHelpers.loadFixture`), so the test checks what the deploy scripts deploy;
- does not deploy the Registry again inside the test;
- runs `hardhat test` after changing a deploy script.
