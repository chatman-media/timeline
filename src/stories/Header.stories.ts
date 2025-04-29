import type { Meta, StoryObj } from "@storybook/react"
import { expect, userEvent, within } from "@storybook/test"

import { Header } from "./Header"

const meta = {
  title: "Layout/Header",
  component: Header,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: "fullscreen",
    docs: {
      description: {
        component: "The main header component with authentication state",
      },
    },
  },
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
    onCreateAccount: {
      action: "createAccount",
      description: "Event handler for create account action",
    },
  },
} satisfies Meta<typeof Header>

export default meta
type Story = StoryObj<typeof meta>

export const LoggedIn: Story = {
  args: {
    user: {
      name: "Jane Doe",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const header = canvas.getByRole("banner")
    await expect(header).toBeInTheDocument()
    await expect(canvas.getByText("Jane Doe")).toBeInTheDocument()
    await expect(canvas.getByRole("img", { name: "Jane Doe" })).toBeInTheDocument()

    const logoutButton = canvas.getByRole("button", { name: /logout/i })
    await userEvent.click(logoutButton)
  },
}

export const LoggedOut: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const header = canvas.getByRole("banner")
    await expect(header).toBeInTheDocument()

    const loginButton = canvas.getByRole("button", { name: /login/i })
    await expect(loginButton).toBeInTheDocument()
    await userEvent.click(loginButton)

    const signupButton = canvas.getByRole("button", { name: /sign up/i })
    await expect(signupButton).toBeInTheDocument()
    await userEvent.click(signupButton)
  },
}
