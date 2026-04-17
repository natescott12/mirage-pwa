figma.showUI(__html__, { width: 300, height: 48 });

figma.ui.onmessage = function(msg) {
  if (msg.type === 'EXECUTE_TASK') {
    figma.notify('Task received: ' + (msg.task && msg.task.task ? msg.task.task.slice(0,40) : 'unknown'));
    figma.ui.postMessage({ type: 'TASK_DONE', id: msg.task.id, status: 'complete', result: 'OK' });
  }
  if (msg.type === 'ERROR') {
    figma.notify('Error: ' + String(msg.error), { error: true });
  }
};
