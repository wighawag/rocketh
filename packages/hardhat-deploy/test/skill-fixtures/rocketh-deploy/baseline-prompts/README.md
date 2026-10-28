# Baseline prompts for the rocketh-deploy skill

One prompt per branch of `skills/rocketh-deploy/SKILL.md`: a realistic task a user gives an agent in a rocketh or hardhat-deploy v2 project, not a question about the rule. The maintainer runs each against a stock agent (without the skill) in a project like the fixture next to this folder, and prunes from the skill any line the agent already gets right. Running them is not part of the test suite.

Each file names the branch, gives the prompt, and lists what a run that follows the skill does, which is what to compare the stock agent against.
