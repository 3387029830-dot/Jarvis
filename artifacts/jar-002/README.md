# JAR-002 visual acceptance evidence

These images were captured from the production Electron renderer through the existing typed
health-check smoke path. Evidence mode changes only the showcase route, viewport, and visual state;
it does not expand the preload bridge.

| Evidence                      | Viewport | What it verifies                                                    |
| ----------------------------- | -------- | ------------------------------------------------------------------- |
| `showcase-1440x900.png`       | 1440×900 | Complete showcase opening composition and desktop hierarchy         |
| `showcase-1024x900.png`       | 1024×900 | Minimum supported width without horizontal overflow                 |
| `dialog-open-1440x900.png`    | 1440×900 | Open modal layer, explicit close/action controls, readable overlay  |
| `keyboard-focus-1440x900.png` | 1440×900 | Real focused button plus visible two-layer keyboard focus treatment |
| `reduced-motion-1440x900.png` | 1440×900 | Reduced-motion simulation and static state-feedback explanation     |

## Manual checks

- Tab traversal reaches buttons, icon buttons, links, the Dialog trigger, and ScrollArea.
- Dialog initial focus lands on the primary action.
- Tab and Shift+Tab wrap inside the open Dialog.
- Escape closes the Dialog and focus returns to its trigger.
- The 1024px viewport keeps the hero, sections, and four surface swatches readable.
- Chinese body copy uses the Windows Chinese system-font stack with `1.85` line height.
- Mixed Chinese, Latin terminology, punctuation, and numerals retain a stable baseline.
- Reduced motion removes translation, scaling, spinning, and continuous animation while preserving
  color, boundary, and static status feedback.
