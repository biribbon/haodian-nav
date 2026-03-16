# OpenClaw Notes

- When working with `openclaw` in this workspace, treat `/Users/biri/Downloads/ClaudeProxy` as a required companion project for `78code` access.
- Read `/Users/biri/Downloads/ClaudeProxy/README.md` before changing `openclaw` provider/proxy settings if the setup may matter.
- Preferred local proxy settings for OpenClaw:
  - Base URL: `http://127.0.0.1:8318`
  - API Key: `sk-proxy`
  - Model: `claude-opus-4-6`
- The real `78code` key is expected to live in the ClaudeProxy process via `ANTHROPIC_API_KEY`, not directly in OpenClaw.
- If OpenClaw + `78code` behavior looks wrong, check the ClaudeProxy project health/readme first.
