# Security policy

This server drives a real Chrome, with a real profile, over the DevTools Protocol on
`127.0.0.1:9222`. The README states the properties that follow from that design; the
three that matter for a report are: the CDP port is unauthenticated, `eval` runs
arbitrary JavaScript in the page, and file paths for `screenshot` / `upload_file` are
restricted to the temp directories and your home directory.

The path check resolves symlinks and existing parents before access. It is a
check-time restriction, not a sandbox or protection against local filesystem races.
The default roots include the entire home directory. The server does not control
Chrome's debugging-port exposure or restrict what a trusted tool caller can do
through the browser's logged-in sessions.

## Reporting

Use GitHub's [private vulnerability
reporting](https://github.com/dhtfish988/TabWeave/security/advisories/new)
for a bypass of those restrictions. Other bugs belong in a normal issue.

Useful in a report: the Node version, the client you drove the server from, and the
tool call with its arguments.

## In scope

- A path restriction bypass — reaching a file outside the allowed directories,
  including through a symlink, a URL, or an argument the validator does not see.
- A page, an iframe or page content that can talk the server into calling a tool it
  was not asked to call.
- Anything that makes the CDP listener reachable from outside localhost beyond what
  Chrome itself already exposes.

## Out of scope

- Reports that amount to "this tool can automate a site I do not own". The README
  states what the tool is for; using it against other people's services is not a
  security finding about this code.
