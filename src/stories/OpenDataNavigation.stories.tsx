import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime.js'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { OpenDataNavigation } from '../design-system/open-data/OpenDataNavigation.tsx'

const meta = {
  title: 'Controls/Open Data navigation',
  component: OpenDataNavigation,
  args: { locale: 'en' },
  parameters: { controls: { disable: true } },
  decorators: [(Story) => <PathnameContext.Provider value="/en/data/graph"><Story /></PathnameContext.Provider>],
} satisfies Meta<typeof OpenDataNavigation>

export default meta
type Story = StoryObj<typeof meta>

export const CurrentSection: Story = {}
