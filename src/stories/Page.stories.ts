import type { Meta, StoryObj } from "@storybook/react"
import { expect, userEvent, within } from "@storybook/test"
import { Page } from "./Page"

const meta = {
  title: "Layout/Page",
  component: Page,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "The main page layout with header and content area",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    user: {
      control: "object",
      description: "User object with name and optional avatar",
    },
    onLogin: {
      action: "login",
      description: "Event handler for login action",
    },
    onLogout: {
      action: "logout",
      description: "Event handler for logout action",
    },
  },
} satisfies Meta<typeof Page>

export default meta
type Story = StoryObj<typeof meta>

export const LoggedOut: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole("banner")).toBeInTheDocument()

    const loginButton = canvas.getByRole("button", { name: /login/i })
    await expect(loginButton).toBeInTheDocument()
    await userEvent.click(loginButton)

    await expect(canvas.getByText("Welcome to the app")).toBeInTheDocument()
  },
}

// More on component testing: https://storybook.js.org/docs/writing-tests/component-testing
export const LoggedIn: Story = {
  args: {
    user: {
      name: "Jane Doe",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole("banner")).toBeInTheDocument()
    await expect(canvas.getByText("Jane Doe")).toBeInTheDocument()

    const logoutButton = canvas.getByRole("button", { name: /logout/i })
    await expect(logoutButton).toBeInTheDocument()
    await userEvent.click(logoutButton)

    await expect(canvas.getByText("Welcome back, Jane Doe")).toBeInTheDocument()
  },
}
