import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime.js'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { withExplorer } from './withExplorer.tsx'
import { ContributionPage } from '../design-system/open-data/ContributionPage.tsx'
import { OpenDataChangelog } from '../design-system/open-data/OpenDataChangelog.tsx'
import { OpenDataDataset } from '../design-system/open-data/OpenDataDataset.tsx'
import { OpenDataGraph } from '../design-system/open-data/OpenDataGraph.tsx'
import { OpenDataPage } from '../design-system/open-data/OpenDataPage.tsx'
import { OpenDataQuery } from '../design-system/open-data/OpenDataQuery.tsx'
import { DEFAULT_LOCALE, localizePath } from '../i18n/routing.ts'
import { openDataPath, type OpenDataSection } from '../openData.ts'

const meta = {
  title: 'Screens/Open Data',
  component: OpenDataPage,
  decorators: [withExplorer],
  args: { locale: DEFAULT_LOCALE, children: null },
  parameters: { layout: 'fullscreen', controls: { disable: true } },
} satisfies Meta<typeof OpenDataPage>

export default meta
type Story = StoryObj<typeof meta>

function section(page: OpenDataSection, children: ReactNode): Story {
  return {
    args: { children },
    render: (args) => (
      <PathnameContext.Provider value={localizePath(openDataPath(page), args.locale)}>
        <OpenDataPage {...args} />
      </PathnameContext.Provider>
    ),
  }
}

export const Dataset = section('dataset', <OpenDataDataset />)
export const Graph = section('graph', <OpenDataGraph />)
export const Query = section('query', <OpenDataQuery locale={DEFAULT_LOCALE} />)
export const Changelog = section('changelog', <OpenDataChangelog locale={DEFAULT_LOCALE} />)
export const Contribute = section('contribute', <ContributionPage locale={DEFAULT_LOCALE} />)
