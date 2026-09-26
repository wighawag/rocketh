# Advisory template

Fill-in form for a security advisory published from this repository. It exists so that the text is not composed under pressure; the five-part shape and the CVE policy it follows are in [SECURITY.md](../SECURITY.md#what-a-published-advisory-from-here-will-contain).

Delete the guidance in brackets as you go. If a section turns out to be empty, say why it is empty rather than dropping the heading: "no mitigating factors, every default configuration is affected" is information.

---

## Summary

[One or two sentences. What breaks, for whom. A reader who stops here should know whether to keep reading.]

## Affected component and versions

| Package        | Affected              | Fixed in  |
| -------------- | --------------------- | --------- |
| [`@rocketh/…`] | [`>= 0.x.y, < 0.x.z`] | [`0.x.z`] |

[One row per published package. A flaw in `@rocketh/core` is a coordinated release: regular internal dependencies are declared `workspace:*` and publish as an exact pin, so every dependent needs its own row with its own versions. Peers are `workspace:^` and do not. Do not write a single range across packages that version independently.]

## Mitigating factors

[What has to be true for this to bite. A configuration, a signer variant, a network, an interactive run, a particular extension in `extensions`. State it before the impact: for most findings here this is the part that decides whether a reader is affected at all. If the answer is "nothing, the default is affected", say exactly that.]

## Impact

[What an attacker, or an unlucky operator, gets out of it. Concrete: which transaction goes out, which address ends up in a record, what a user of the published package ends up running. Name the trust boundary it crosses, using the vocabulary in SECURITY.md. If it is a divergence between what a deploy script asked for and what was broadcast, say so, because that is the vulnerability class this project defines for itself.]

## Fixed in

[The versions carrying the fix, and what upgrading takes. Name any change a user has to make beyond bumping a version. If there is a workaround for someone who cannot upgrade today, it goes here.]

## Credit

[The reporter's chosen name, unless they asked not to be named. If the finding was internal, say so rather than leaving the section out.]

## Timeline

[Optional, and worth including when the gap between report and fix was long enough that a reader would otherwise wonder. Dates only, no defensiveness.]

- [YYYY-MM-DD] Reported.
- [YYYY-MM-DD] Confirmed.
- [YYYY-MM-DD] Fix published.
- [YYYY-MM-DD] Advisory published.

---

**Before publishing:** the fix is on the registry, the advisory names the exact fixed versions, and a CVE has been requested from the GitHub CNA. Publish without waiting for the identifier and add it once assigned.
