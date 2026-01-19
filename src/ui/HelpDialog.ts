export interface HelpDialog {
  show(): void;
  hide(): void;
  isVisible(): boolean;
  destroy(): void;
}

const KEYBOARD_SHORTCUTS = [
  { key: 'Space', description: 'Play/Pause simulation' },
  { key: 'I', description: 'Toggle info panel' },
  { key: 'G', description: 'Toggle population graph' },
  { key: 'V', description: 'Toggle world visualization' },
  { key: '?', description: 'Show this help dialog' },
  { key: 'Escape', description: 'Close dialog / Deselect entity' },
  { key: 'Tab', description: 'Select next entity' },
  { key: 'Shift+Tab', description: 'Select previous entity' },
  { key: '0', description: 'Fit world to view' },
  { key: '+/=', description: 'Zoom in' },
  { key: '-', description: 'Zoom out' },
  { key: '[', description: 'Decrease speed' },
  { key: ']', description: 'Increase speed' },
  { key: 'Arrow keys', description: 'Pan camera' },
];

const MOUSE_CONTROLS = [
  { action: 'Double-click', description: 'Select entity' },
  { action: 'Drag', description: 'Pan camera' },
  { action: 'Scroll wheel', description: 'Zoom in/out' },
];

export function createHelpDialog(): HelpDialog {
  let visible = false;
  let overlay: HTMLDivElement | null = null;

  function render(): HTMLDivElement {
    const div = document.createElement('div');
    div.className = 'help-dialog-overlay';
    div.innerHTML = `
      <div class="help-dialog">
        <div class="help-dialog-header">
          <h2>Keyboard Shortcuts</h2>
          <button class="help-close-btn">&times;</button>
        </div>
        <div class="help-dialog-content">
          <div class="help-section">
            <h3>Keyboard</h3>
            <table class="help-table">
              ${KEYBOARD_SHORTCUTS.map(s => `
                <tr>
                  <td class="help-key"><kbd>${s.key}</kbd></td>
                  <td>${s.description}</td>
                </tr>
              `).join('')}
            </table>
          </div>
          <div class="help-section">
            <h3>Mouse</h3>
            <table class="help-table">
              ${MOUSE_CONTROLS.map(c => `
                <tr>
                  <td class="help-key"><kbd>${c.action}</kbd></td>
                  <td>${c.description}</td>
                </tr>
              `).join('')}
            </table>
          </div>
        </div>
      </div>
    `;

    // Close button handler
    const closeBtn = div.querySelector('.help-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => hide());
    }

    // Click outside to close
    div.addEventListener('click', (e) => {
      if (e.target === div) {
        hide();
      }
    });

    return div;
  }

  function show(): void {
    if (visible) return;
    visible = true;
    overlay = render();
    document.body.appendChild(overlay);
  }

  function hide(): void {
    if (!visible || !overlay) return;
    visible = false;
    document.body.removeChild(overlay);
    overlay = null;
  }

  return {
    show,
    hide,
    isVisible(): boolean {
      return visible;
    },
    destroy(): void {
      hide();
    },
  };
}
