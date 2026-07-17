# Security Policy

This document describes the management of vulnerabilities for the
pino-pretty project and defines its threat model.

pino-pretty is a development-time formatter for Pino and NDJSON log records.
It is not intended to provide a security boundary or to process adversarial
production log streams.

## Reporting vulnerabilities

Individuals who find potential vulnerabilities in pino-pretty are invited
to report them via email at matteo.collina@gmail.com.

### Strict measures when reporting vulnerabilities

Avoid creating new "informative" reports. Only report a potential
vulnerability if you are reasonably sure it is an actual vulnerability.
Be mindful of the maintainers' time.

## Threat model

### Intended use and assumptions

pino-pretty is expected to run as a normal, non-privileged process in a local
development environment. The following inputs are trusted:

* The local machine and source checkout
* Configuration files and the current working directory
* Command-line arguments and programmatic options
* `messageFormat` functions and custom prettifiers
* Output destinations
* Installed dependencies

Configuration files and custom callbacks are executable code and are not
sandboxed.

### Potentially untrusted input

Log record contents may contain malformed or unexpected values, including
values derived from HTTP requests or other external input handled by the
application under development.

### Security invariants

Malformed or externally influenced log content must not:

* Cause JavaScript code or shell commands to execute
* Select or load configuration modules
* Choose an output destination or access arbitrary files
* Pollute object prototypes through parsed JSON

Configuration and custom callbacks may perform these actions because they are
explicitly trusted code.

### Accepted risks

Within the intended development use, the following are accepted as low-impact
risks:

* Control characters or embedded newlines may distort terminal output
* Very large or deeply nested records may slow or terminate the formatter
* Sensitive values already present in logs may be displayed
* JavaScript configuration files execute code when loaded
* Formatting failures may interrupt the developer's logging workflow

These behaviors primarily affect the local developer process. They are not
generally considered vulnerabilities unless they violate one of the security
invariants above.

### Out of scope

pino-pretty does not provide:

* Secret redaction
* Log authenticity or tamper resistance
* Availability guarantees under adversarial load
* Sandboxing for configuration or custom functions
* Secure log storage or access control
* Isolation suitable for multi-tenant or hostile production logs

Redaction, input limits, process isolation, and secure storage must be
implemented upstream when required.

### Use outside the intended scope

Using pino-pretty with production, remote, or multi-tenant logs, or running it
inside an untrusted checkout, invalidates the assumptions above. Such use may
require terminal-control sanitization, resource limits, process isolation, and
disabling executable configuration discovery.

## Handling vulnerability reports

When a potential vulnerability is reported, the following actions are taken:

### Triage

**Delay:** 5 business days

Within 5 business days, a member of the security team provides a first answer
to the individual who submitted the potential vulnerability. The possible
responses are:

* Acceptance: what was reported is considered a new vulnerability
* Rejection: what was reported is not considered a vulnerability
* Need more information: the security team needs more information to evaluate
  what was reported

Triaging should include updating issue fields:

* Asset - set or create the module affected by the report
* Severity - TBD, currently left empty

### Correction follow-up

**Delay:** 90 days

When a vulnerability is confirmed, a member of the security team volunteers
to follow up on the report.

With the help of the individual who reported the vulnerability, they contact
the maintainers of the vulnerable package to make them aware of the
vulnerability. The maintainers can be invited as participants in the reported
issue.

With the package maintainer, they define a release date for publication of the
vulnerability. Ideally, publication should not happen before the package has
been patched.

The report's vulnerable versions upper limit should be set to:

* `*` if there is no fixed version available by the time of publishing the
  report
* The last vulnerable version, for example `<=1.2.3` if a fix exists in `1.2.4`

### Publication

**Delay:** 90 days

Within 90 days after the triage date, the vulnerability must be made public.

**Severity:** Vulnerability severity is assessed using
[CVSS v.3](https://www.first.org/cvss/user-guide).

If the package maintainer is actively developing a patch, an additional delay
can be added with the approval of the security team and the individual who
reported the vulnerability.

At this point, a CVE will be requested by the team.
