---
title: "The Mini Shai-Hulud Case and the Real Risk of Dependencies"
description: "The May 2026 Mini Shai-Hulud wave didn't just steal an npm token — it abused the build and publishing pipeline itself: pull_request_target, cache poisoning, OIDC trusted publishing, and install scripts. What actually happened, and what I'd audit first."
date: 2026-05-12
readTime: "4 min"
cover: "/art/blog/mini-shai-hulud-dependency-risk.png"
tags: ["security", "supply-chain", "npm", "ci-cd", "dependencies"]
canonical: "https://www.linkedin.com/pulse/mini-shai-hulud-case-real-risk-dependencies-luz-paschoarelli-1u76e/"
---

On May 11, 2026, a new wave of Mini Shai-Hulud compromised npm and PyPI packages in a supply chain attack.

The incident first gained attention through TanStack: 84 malicious versions across 42 @tanstack/* packages were published within minutes. Later, the campaign appeared in other packages and namespaces.

The most important point: this was not just a case of "someone stole an npm token."

Based on what has been published so far, the attack abused the build and publishing pipeline itself. In the compromised TanStack packages, for example, an obfuscated file called `router_init.js` was added. A suspicious optionalDependency named `@tanstack/setup` also appeared, pointing to a GitHub commit.

That Git package had a prepare script that executed `bun run tanstack_runner.js`. Since lifecycle scripts can run during installation, simply installing an affected version could execute the payload on a developer machine or CI runner.

The payload attempted to collect environment credentials, including GitHub Actions tokens, npm tokens, cloud credentials, Kubernetes tokens, Vault tokens, and SSH keys.

The serious part is that, in the TanStack case, publication went through legitimate parts of the infrastructure: GitHub Actions, OIDC/trusted publishing, and the release pipeline. In other words, the package could look legitimate because it was published through a legitimate path that had been abused by the attacker.

**In short, the most relevant technical points were:**

- **pull_request_target**: a GitHub Actions workflow ran with higher privileges when handling pull requests.
- **Cache poisoning**: the attacker was able to influence the cache used by the pipeline.
- **OIDC/trusted publishing**: publication could happen without a classic npm token, using a temporary identity from the pipeline itself.
- **Install scripts**: malicious code ran during installation and attempted to collect credentials from the environment.

**If I were reviewing an environment right now, I would focus mainly on:**

- Lockfiles: `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `uv.lock`, `poetry.lock`.
- CI caches and Docker images.
- Runners that installed any affected version.
- Secrets accessible from those environments: GitHub, npm, cloud, Kubernetes, Vault, SSH, and deployment tokens.
- Workflows using `pull_request_target`.
- Jobs with `id-token: write`.
- Automatic installation of freshly published versions.

The lesson here is very direct: a dependency is not just a "library." It is third-party code running on your machine, inside your CI, and sometimes inside your deployment chain.

Supply chain security is not just CVE scanning. It is CI/CD, credentials, publishing, permissions, and fast incident response.

**Main sources**

- TanStack official postmortem: [https://tanstack.com/blog/npm-supply-chain-compromise-postmortem](https://tanstack.com/blog/npm-supply-chain-compromise-postmortem)
- Official GitHub Security Advisory for TanStack packages: [https://github.com/TanStack/router/security/advisories/GHSA-g7cv-rxg3-hmpx](https://github.com/TanStack/router/security/advisories/GHSA-g7cv-rxg3-hmpx)
- General list maintained by Socket Research: [https://socket.dev/blog/tanstack-npm-packages-compromised-mini-shai-hulud-supply-chain-attack#All-Compromised-Packages](https://socket.dev/blog/tanstack-npm-packages-compromised-mini-shai-hulud-supply-chain-attack#All-Compromised-Packages)
- Socket Mini Shai-Hulud campaign tracker: [https://socket.dev/supply-chain-attacks/mini-shai-hulud](https://socket.dev/supply-chain-attacks/mini-shai-hulud)
