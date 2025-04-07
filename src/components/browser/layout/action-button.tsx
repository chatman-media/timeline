import { PlusSquare } from "lucide-react"

interface ActionButtonProps {
  title: string
  onClick: () => void
  children: React.ReactNode
  icon?: React.ReactNode
}

const ActionButton = ({ title, onClick, children, icon }: ActionButtonProps) => (
  <span
    className="group flex items-center gap-1 text-gray-900 dark:text-gray-400 opacity-50 hover:opacity-100 hover:text-gray-800 dark:hover:text-gray-100 transition-opacity cursor-pointer"
    title={title}
    onClick={onClick}
  >
    {children}
    {icon || (
      <PlusSquare className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
    )}
  </span>
)
export { ActionButton }
