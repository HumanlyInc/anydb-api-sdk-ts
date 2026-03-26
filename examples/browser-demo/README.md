# AnyDB Browser Demo (Vite)

Tiny browser demo for testing `uploadFile` in browser runtime.

## 1) Install

```bash
cd examples/browser-demo
npm install
```

## 2) Run

```bash
npm run dev
```

Open the local URL shown by Vite, fill in your credentials/IDs, pick a file, and click **Upload**.

## Notes

- Uses SDK config: `runtime: "browser"` and `uploadTransport: "fetch"`.
- `filepath` uploads are Node-only. Browser uploads should use `fileContent: await file.arrayBuffer()`.
- Do not use long-lived production API keys directly in frontend apps. Prefer a backend token/proxy strategy.
