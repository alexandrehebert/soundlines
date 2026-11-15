# Soundlines design system

The webapp imports its components from [src/design-system](../src/design-system/).
See the [architecture guide](./ARCHITECTURE.md#webapp-design-system) for the component
groups. The app and Storybook load the same foundation stylesheet and theme tokens.

## Required workflow for webapp UI changes

1. Check the local Storybook catalogue and the component source before editing.
   Reuse the matching component and tokens. Extend the existing API when the
   same control or pattern needs a new state or variant.
2. Add new UI components under `src/design-system` in the appropriate group.
   Import directly from the component file. Give reusable components typed props
   for their content, state, accessible labels, and actions. Keep route metadata,
   data loading, and Next.js server adapters at their application boundaries.
3. Add or update a Storybook story that shows the changed UI using the production
   component. Give reusable components standalone stories and use screen stories
   for composition-specific parts. Show relevant default, responsive, theme, and
   interaction states. Use `publicAsset()` for files in `public/` so stories can
   work in the public catalogue under its URL prefix.
4. Add or update a behavior test for changed interactions or accessibility
   contracts. Place component tests beside their source. Use Vitest with React
   Testing Library and `user-event` for DOM interactions. Add
   `// @vitest-environment jsdom` to DOM tests, query by role or accessible label,
   and assert outcomes such as focus, selection, or rendered content. Use
   Storybook interaction tests when behavior depends on browser layout or gestures.
5. Run `npm test`, `npm run lint`, `npx tsc --noEmit`, and
   `npm run build-storybook`. Check the changed stories in the browser at the
   relevant widths and themes. Preserve the existing design unless the task
   calls for a visual change.

Run `npm run storybook` for the local catalogue. The companion site publishes
the same stories in its browse-only Storybook.
