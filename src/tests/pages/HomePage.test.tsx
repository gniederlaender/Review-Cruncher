/* eslint-disable react/react-in-jsx-scope */
import { TextEncoder } from 'util'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import HomePage from '../../pages/HomePage'
import { models } from '../../utility/options'

global.TextEncoder = TextEncoder

const mockAPIKey = 'test_mock_api_key'

describe('HomePage - Page components', () => {
    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(jest.fn())
        jest.spyOn(console, 'debug').mockImplementation(jest.fn())
        jest.spyOn(console, 'error').mockImplementation(jest.fn())
    })

    afterAll(() => {
        cleanup()
    })

    it('Expect to have all starting components rendered', async () => {
        render(<HomePage />)
        const selectElements = screen.getAllByRole('combobox')
        const inputElements = screen.getAllByRole('textbox')
        const submitButton = screen.getByRole('button')

        expect(selectElements[0]).toBeInTheDocument()
        expect(selectElements[0]).toHaveValue(models[0])
        expect(selectElements[1]).toBeInTheDocument()
        expect(selectElements[2]).toBeInTheDocument()

        expect(inputElements[0]).toBeInTheDocument()
        expect(inputElements[1]).toBeInTheDocument()

        expect(submitButton).toBeInTheDocument()
        expect(submitButton).toBeDisabled()
    })

    it('Expect button to be enabled if all the entered values are valid', () => {
        render(<HomePage />)
        const inputElements = screen.getAllByRole('textbox')
        const submitButton = screen.getByRole('button')

        fireEvent.change(inputElements[0], { target: { value: mockAPIKey } })
        expect(submitButton).toBeInTheDocument()
        expect(submitButton).toBeEnabled()
    })

    it('Expect no warnings if main button is disabled and you click on it', () => {
        render(<HomePage />)
        const submitButton = screen.getByRole('button')
        fireEvent.click(submitButton)

        expect(screen.queryByTestId('errorTextContainer')).not.toBeInTheDocument()
        expect(screen.queryByTestId('lengthIssueTextContainer')).not.toBeInTheDocument()
    })
})
