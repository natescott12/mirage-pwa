// Sloan Live — code.js (minimal)
// Figma API only. Network lives in ui.html.

figma.showUI(__html__, { visible: false, width: 0, height: 0 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'EXECUTE_TASK') {
    try {
      const task = msg.task;
      if (!task || !task.id) return;

      // Navigate to correct page
      const pageKey = pageForTask(task.task || '');
      const page = figma.root.children.find(p => p.name.toLowerCase().includes(pageKey));
      if (page) await figma.setCurrentPageAsync(page);

      const code = task.figma_code || '';
      if (!code.trim()) {
        figma.notify('\u2713 Sloan \u2014 Brief posted (no code)', { timeout: 4000 });
        figma.ui.postMessage({ type: 'TASK_DONE', id: task.id, status: 'complete', result: 'Brief only' });
        return;
      }

      // Execute the generated code
      const fn = new Function('figma', code);
      await fn(figma);

      figma.notify('\u2713 Sloan \u2014 Ready for review', { timeout: 4000 });
      figma.ui.postMessage({ type: 'TASK_DONE', id: task.id, status: 'complete', result: 'Executed successfully' });
    } catch (e) {
      figma.notify('Error: ' + e.message, { error: true });
      figma.ui.postMessage({ type: 'TASK_DONE', id: msg.task && msg.task.id, status: 'failed', result: e.message });
    }
  }

  if (msg.type === 'ERROR') {
    figma.notify('UI Error: ' + (msg.error || 'unknown'), { error: true });
  }
};

function pageForTask(task) {
  var t = (task || '').toLowerCase();
  if (/\b(type|typography|grid|font)\b/.test(t)) return '02';
  if (/\b(color|colour|palette|swatch)\b/.test(t)) return '03';
  if (/\b(layout|screen|interface|ui)\b/.test(t)) return '04';
  if (/\b(audit|image|review|library)\b/.test(t)) return '01';
  if (/\b(mood|reference|moodboard)\b/.test(t)) return '06';
  return '05';
}
