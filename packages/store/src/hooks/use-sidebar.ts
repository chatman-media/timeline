import { rootStore } from '../store'
import { useSelector } from '@xstate/store/react'

export const useSidebar = () => {
  const isOpen = useSelector(rootStore, (state) => state.context.sideBarOpen)

  const toggle = () => {
    rootStore.send({ type: 'toggleSideBar' })
  }

  return {
    isOpen,
    toggle,
  }
}
