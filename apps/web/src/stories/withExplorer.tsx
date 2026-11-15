import type { Decorator } from '@storybook/react-vite'
import { ExplorerStoryProvider, type StoryExplorerOptions } from './ExplorerStoryProvider.tsx'

export const withExplorer: Decorator = (Story, context) => {
  const options: StoryExplorerOptions = context.parameters.explorer ?? {}
  return (
    <ExplorerStoryProvider key={context.id} {...options}>
      <Story />
    </ExplorerStoryProvider>
  )
}
