# Routes

The renderer intentionally has no routing dependency.

| Route             | Rendered component         | Purpose                         |
| ----------------- | -------------------------- | ------------------------------- |
| `/`               | `Foundation` through `App` | JAR-001 health-check foundation |
| `#/design-system` | `Showcase` through `App`   | JAR-002 development validation  |

Electron development opens the showcase hash. Production opens the foundation unless an explicit
smoke-evidence flag supplies the showcase hash. No product navigation or application shell is
implemented.
