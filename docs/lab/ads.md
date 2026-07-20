---
layout: null
title: Global Air Operations Command
---

<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#071014">
  <meta
    name="description"
    content="Interactive fictional global air operations and defence command simulation."
  >
  <title>Global Air Operations Command</title>

  <style>
    :root {
      color-scheme: dark;
      font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
      background: #050b0e;
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      width: 100%;
      min-height: 100%;
      margin: 0;
      background: #050b0e;
      color: #d6edf2;
    }

    body {
      min-height: 100vh;
      overflow: hidden;
    }

    .simulation-shell {
      position: relative;
      width: 100%;
      height: 100vh;
      min-height: 680px;
      background: #050b0e;
    }

    .simulation-frame {
      display: block;
      width: 100%;
      height: 100%;
      border: 0;
      background: #071014;
    }

    .fallback {
      position: absolute;
      right: 14px;
      bottom: 14px;
      z-index: 10;
      padding: 9px 12px;
      border: 1px solid rgba(85, 229, 255, 0.38);
      border-radius: 8px;
      background: rgba(4, 14, 18, 0.82);
      color: #d6edf2;
      font-size: 12px;
      line-height: 1;
      text-decoration: none;
      backdrop-filter: blur(10px);
    }

    .fallback:hover {
      border-color: #55e5ff;
      color: #ffffff;
    }

    @media (max-width: 720px) {
      .simulation-shell {
        min-height: 760px;
      }

      .fallback {
        right: 8px;
        bottom: 8px;
      }
    }
  </style>
</head>

<body>
  <main class="simulation-shell">
    <iframe
      class="simulation-frame"
      src="../ads.html"
      title="Global Air Operations Command interactive simulation"
      loading="eager"
      allow="fullscreen"
      referrerpolicy="same-origin"
    ></iframe>

    <a
      class="fallback"
      href="../ads.html"
      target="_blank"
      rel="noopener"
    >
      Open simulator directly
    </a>
  </main>
</body>
</html>
