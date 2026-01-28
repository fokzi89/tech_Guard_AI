# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - heading "Start Troubleshooting Session" [level=3] [ref=e5]
    - generic [ref=e7]:
      - generic [ref=e8]:
        - text: Machine Model
        - combobox [ref=e9]:
          - generic: Select machine model
          - img [ref=e10]
        - combobox [ref=e12]
      - generic [ref=e13]:
        - text: Work Order / Ticket ID (Optional)
        - textbox "e.g. WO-12345" [ref=e14]
      - button "Start Session" [ref=e15]
  - button "Open Next.js Dev Tools" [ref=e21] [cursor=pointer]:
    - img [ref=e22]
  - alert [ref=e25]
```