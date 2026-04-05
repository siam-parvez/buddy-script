import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'

import { SignUpForm } from '@/components/sign-up-form'
import { createClient } from '@/lib/client'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/lib/client', () => ({
  createClient: jest.fn(),
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    return <img alt="mock-image" {...props} />
  },
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}))

describe('SignUpForm', () => {
  let mockPush: jest.Mock
  let mockSignUp: jest.Mock

  beforeEach(() => {
    mockPush = jest.fn()
    mockSignUp = jest.fn()

    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(createClient as jest.Mock).mockReturnValue({
      auth: { signUp: mockSignUp },
    })

    jest.clearAllMocks()
  })

  it('renders registration fields for first name, last name, email, and password', () => {
    render(<SignUpForm />)

    expect(screen.getByText('Registration')).toBeInTheDocument()
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Repeat Password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Register now/i })).toBeInTheDocument()
  })

  it('shows login link', () => {
    render(<SignUpForm />)
    const loginLink = screen.getByRole('link', { name: /Login/i })
    expect(loginLink).toHaveAttribute('href', '/login')
  })

  it('keeps terms checkbox checked by default', () => {
    render(<SignUpForm />)
    const checkbox = screen.getByRole('checkbox', { name: /agree to terms/i }) as HTMLInputElement
    expect(checkbox.checked).toBe(true)
  })

  it('updates first and last name inputs', async () => {
    const user = userEvent.setup()
    render(<SignUpForm />)

    const firstNameInput = screen.getByLabelText(/First Name/i) as HTMLInputElement
    const lastNameInput = screen.getByLabelText(/Last Name/i) as HTMLInputElement

    await user.type(firstNameInput, 'John')
    await user.type(lastNameInput, 'Doe')

    expect(firstNameInput.value).toBe('John')
    expect(lastNameInput.value).toBe('Doe')
  })

  it('shows error when first name is missing', async () => {
    const user = userEvent.setup()

    render(<SignUpForm />)

    await user.type(screen.getByLabelText(/Last Name/i), 'Doe')
    await user.type(screen.getByLabelText(/Email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/^Password$/i), 'password123')
    await user.type(screen.getByLabelText(/Repeat Password/i), 'password123')

    const form = screen.getByLabelText(/First Name/i).closest('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText(/First name is required/i)).toBeInTheDocument()
    })
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('shows error when last name is missing', async () => {
    const user = userEvent.setup()

    render(<SignUpForm />)

    await user.type(screen.getByLabelText(/First Name/i), 'John')
    await user.type(screen.getByLabelText(/Email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/^Password$/i), 'password123')
    await user.type(screen.getByLabelText(/Repeat Password/i), 'password123')

    const form = screen.getByLabelText(/First Name/i).closest('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText(/Last name is required/i)).toBeInTheDocument()
    })
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('signs up with valid credentials', async () => {
    const user = userEvent.setup()
    mockSignUp.mockResolvedValueOnce({ error: null })

    render(<SignUpForm />)

    await user.type(screen.getByLabelText(/First Name/i), 'John')
    await user.type(screen.getByLabelText(/Last Name/i), 'Doe')
    await user.type(screen.getByLabelText(/Email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/^Password$/i), 'password123')
    await user.type(screen.getByLabelText(/Repeat Password/i), 'password123')

    await user.click(screen.getByRole('button', { name: /Register now/i }))

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123',
        options: {
          data: {
            first_name: 'John',
            last_name: 'Doe',
          },
          emailRedirectTo: expect.stringContaining('/feed'),
        },
      })
      expect(mockPush).toHaveBeenCalledWith('/auth/sign-up-success')
    })
  })

  it('shows mismatch error when passwords do not match', async () => {
    const user = userEvent.setup()

    render(<SignUpForm />)

    await user.type(screen.getByLabelText(/First Name/i), 'John')
    await user.type(screen.getByLabelText(/Last Name/i), 'Doe')
    await user.type(screen.getByLabelText(/Email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/^Password$/i), 'password123')
    await user.type(screen.getByLabelText(/Repeat Password/i), 'password456')

    await user.click(screen.getByRole('button', { name: /Register now/i }))

    await waitFor(() => {
      expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument()
    })
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('shows error when terms are not agreed to', async () => {
    const user = userEvent.setup()

    render(<SignUpForm />)

    await user.click(screen.getByRole('checkbox', { name: /agree to terms/i }))
    await user.type(screen.getByLabelText(/First Name/i), 'John')
    await user.type(screen.getByLabelText(/Last Name/i), 'Doe')
    await user.type(screen.getByLabelText(/Email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/^Password$/i), 'password123')
    await user.type(screen.getByLabelText(/Repeat Password/i), 'password123')

    await user.click(screen.getByRole('button', { name: /Register now/i }))

    await waitFor(() => {
      expect(screen.getByText(/Please agree to terms and conditions/i)).toBeInTheDocument()
    })
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('shows server error message', async () => {
    const user = userEvent.setup()
    mockSignUp.mockResolvedValueOnce({ error: { message: 'Email already exists' } })

    render(<SignUpForm />)

    await user.type(screen.getByLabelText(/First Name/i), 'John')
    await user.type(screen.getByLabelText(/Last Name/i), 'Doe')
    await user.type(screen.getByLabelText(/Email/i), 'existing@example.com')
    await user.type(screen.getByLabelText(/^Password$/i), 'password123')
    await user.type(screen.getByLabelText(/Repeat Password/i), 'password123')

    await user.click(screen.getByRole('button', { name: /Register now/i }))

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument()
    })
  })

  it('disables submit button during registration', async () => {
    const user = userEvent.setup()
    mockSignUp.mockImplementationOnce(() => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100)))

    render(<SignUpForm />)

    await user.type(screen.getByLabelText(/First Name/i), 'John')
    await user.type(screen.getByLabelText(/Last Name/i), 'Doe')
    await user.type(screen.getByLabelText(/Email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/^Password$/i), 'password123')
    await user.type(screen.getByLabelText(/Repeat Password/i), 'password123')

    const submitButton = screen.getByRole('button', { name: /Register now/i }) as HTMLButtonElement
    await user.click(submitButton)

    expect(submitButton).toBeDisabled()
  })

  it('still has no phone number field', () => {
    render(<SignUpForm />)

    expect(screen.queryByLabelText(/Phone/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Phone Number/i)).not.toBeInTheDocument()
  })
})

