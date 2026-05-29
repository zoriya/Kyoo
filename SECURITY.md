# Security Policy

## Supported Versions

Kyoo is maintained as an open-source project. Security fixes are generally provided for the latest released version and the current development branch.

| Version / Branch                           | Supported                              |
| ------------------------------------------ | -------------------------------------- |
| Latest release                             | Yes                                    |
| `master`                                   | Yes, when reproducible on current code |
| Older releases                             | Best effort                            |
| Unmaintained forks or modified deployments | No                                     |

If you are unsure whether your version is affected, please include the version, commit hash, deployment method, and relevant configuration details in your report.

## Reporting a Vulnerability

Please do **not** report security vulnerabilities through public GitHub issues, pull requests, or discussions.

To report a vulnerability, use one of the following private channels:

1. GitHub private vulnerability reporting, if enabled for this repository.
2. Email: `security@example.com`

Please include as much detail as possible to help us understand and reproduce the issue:

* A clear description of the vulnerability
* The affected component or endpoint
* Impact and attack scenario
* Steps to reproduce
* Proof of concept, if available
* Affected version, commit hash, or Docker image tag
* Deployment details, such as reverse proxy, authentication setup, and exposed services
* Any suggested remediation or patch

We will acknowledge receipt of a valid report as soon as possible and will work with the reporter to validate the issue, develop a fix, and coordinate disclosure.

## Scope

Security issues may include, but are not limited to:

* Authentication or authorization bypass
* Privilege escalation
* Remote code execution
* Server-side request forgery
* Path traversal or arbitrary file access
* SQL injection or other injection vulnerabilities
* Cross-site scripting with meaningful security impact
* Exposure of secrets, tokens, or sensitive user data
* Vulnerabilities in the Docker deployment or default configuration

The following are generally out of scope unless they demonstrate a clear security impact:

* Missing security headers without an exploitable impact
* Denial-of-service issues requiring unrealistic resource exhaustion
* Vulnerabilities only affecting outdated, unsupported dependencies without a working exploit path in Kyoo
* Reports from automated scanners without validation
* Issues requiring physical access to the server
* Social engineering attacks

## Coordinated Disclosure

Please allow the maintainers reasonable time to investigate and address the issue before making details public.

We ask reporters to:

* Keep vulnerability details private until a fix or advisory is published
* Avoid accessing, modifying, or deleting other users’ data
* Avoid service disruption or destructive testing
* Provide enough information for maintainers to reproduce the issue safely

After the issue is fixed, the maintainers may publish a GitHub Security Advisory and credit the reporter, unless the reporter prefers to remain anonymous.

## Security Updates

Security fixes may be released as:

* A patched release
* A Docker image update
* A commit on the default branch
* A GitHub Security Advisory
* Documentation or configuration guidance, where appropriate

Users are encouraged to keep Kyoo and its dependencies up to date.
