import { addons } from 'storybook/manager-api'

// The published catalogue is for browsing: the addon panel, toolbar and keyboard shortcuts stay hidden.
if ((globalThis as { SOUNDLINES_PUBLIC_STORYBOOK?: boolean }).SOUNDLINES_PUBLIC_STORYBOOK) {
  addons.setConfig({
    ui: { enableShortcuts: false },
    layoutCustomisations: { showPanel: () => false, showToolbar: () => false },
  })
}
