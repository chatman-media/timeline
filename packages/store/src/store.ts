import { createBrowserInspector } from '@statelyai/inspect'
import { createStoreWithProducer } from '@xstate/store'
import { produce } from 'immer'

const inspector = createBrowserInspector()

// Базовый интерфейс для состояния
export interface State {
  sideBarOpen: boolean
}

// Интерфейс для корневого состояния
export interface RootState {
  context: State
}

// Интерфейс для событий
export type RootEvents = {
  type: 'toggleSideBar'
}

export const rootStore = createStoreWithProducer<RootState, RootEvents>(produce, {
  context: { sideBarOpen: false },
  on: {
    toggleSideBar: (context) => {
      context.sideBarOpen = !context.sideBarOpen
    },
  },
  inspect: inspector,
})
