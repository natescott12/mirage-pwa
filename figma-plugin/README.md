# Sloan Live — Figma Plugin

Watches for design tasks from Sloan and executes them live in her Figma sandbox.

## Setup

1. Open Figma desktop app
2. Go to **Plugins > Development > Import plugin from manifest**
3. Select `figma-plugin/manifest.json` from this repo
4. Open **Sloan — Creative Sandbox** (file key: `OvtRCtjVRT4DveuZUZkwrc`)
5. Run the plugin: **Plugins > Development > Sloan Live**

## How it works

- Polls `GET /sloan/figma/pending` every 3 seconds for queued design tasks
- When a task arrives, navigates to the correct sandbox page based on keywords (typography, color, layout, audit, mood, or general direction)
- Executes the generated Figma Plugin API code from the `figma_code` field
- Marks the task complete via `PATCH /sloan/figma/:id`
- Shows a Figma notification when done

## Theatre Mode

On by default. Makes each design element appear with a natural delay (150-400ms per statement), simulating Sloan working live. A progress bar fills as elements are created.

Turn it off for instant execution.

## Keep it open

Leave the plugin running while you work with Sloan via SMS. When you text her a design task (`figma: build a type scale`), she generates the approach + code on the proxy side, and the plugin picks it up and executes it in Figma automatically.

## Task flow

1. You text Sloan: `design task: explore a color palette for Mirage`
2. Sloan responds via SMS with her approach and rationale
3. The proxy generates Figma Plugin API code and stores it in `sloan_figma_tasks`
4. This plugin picks up the pending task, executes the code, and notifies you
5. Review the work in Figma, leave feedback in the Notes panel
