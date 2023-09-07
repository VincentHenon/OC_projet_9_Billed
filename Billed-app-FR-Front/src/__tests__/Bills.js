/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import "@testing-library/jest-dom/extend-expect"
import userEvent from "@testing-library/user-event"
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH} from "../constants/routes.js"
import {localStorageMock} from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import router from "../app/Router.js"

jest.mock("../app/store", () => mockStore) // mock the store

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains('active-icon')).toBeTruthy()
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML);
      const antiChrono = (a, b) => (a > b) ? 1 : -1;
      const datesSorted = [ ...dates ].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    })
 
    test("then if I press the newBill button it should call the function handleClickNewBill", ()=> {

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      document.body.innerHTML = BillsUI({ data: { bills } })
      
      const handleClickNewBill = jest.fn(() => {
        onNavigate(ROUTES_PATH['NewBill']) 
      })

      const billsInstance = new Bills({
        document,
        onNavigate,
        store: null,
        bills: bills,
        localStorage: window.localStorage,
      })

      const buttonNewBill = screen.getByTestId("btn-new-bill")
      buttonNewBill.addEventListener("click", handleClickNewBill)
      userEvent.click(buttonNewBill)

      expect(buttonNewBill.textContent).toBe("Nouvelle note de frais") // √  button defined
      expect(handleClickNewBill).toHaveBeenCalled() //√  function called
      expect(screen.getByTestId("form-new-bill")).toBeTruthy()//√  NewBill page loaded
    })

    test("then if eye shaped icon is pressed, it should display a modal", ()=> {
      const billsInstance = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage
      })
      // render HTML
      document.body.innerHTML = BillsUI({ data: bills })
      // select icons
      const iconEye = screen.getAllByTestId("icon-eye")
      // select modale
      const modaleEl = document.getElementById("modaleFile")

      $.fn.modal = jest.fn() // JQuery modal mock

      // select the function
      const handleClickIconEye = jest.fn(billsInstance.handleClickIconEye)

      iconEye.forEach(icon => {
        icon.addEventListener("click", () => handleClickIconEye(icon))
        userEvent.click(icon)

        expect(handleClickIconEye).toHaveBeenCalled()
        expect($.fn.modal).toHaveBeenCalled()
      })
    }) 
  })
})

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      
      Object.defineProperty(window, "localStorage", { value: localStorageMock })
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      )

      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })

    test("fetches bills from mock API GET", async () => {
      window.onNavigate(ROUTES_PATH.Bills)
      const bills = await mockStore.bills().list()
      expect(await waitFor(() => screen.getByTestId("tbody"))).toBeTruthy() // do we get the table layout?
      expect(bills.length).toBe(4) // do we get the whole data?
    })

    test("Then, fetches bills from an API and fails with 404 message error", async () => {
			mockStore.bills.mockImplementationOnce(() => {
				return {
					list: () => {
						return Promise.reject(new Error("Erreur 404"))
					},
				}
			})
			window.onNavigate(ROUTES_PATH.Bills)
			await new Promise(process.nextTick)
			const message = await screen.getByText(/Erreur 404/)
			expect(message).toBeTruthy()
		})

		test("Then, fetches messages from an API and fails with 500 message error", async () => {
			mockStore.bills.mockImplementationOnce(() => {
				return {
					list: () => {
						return Promise.reject(new Error("Erreur 500"))
					},
				}
			})
			window.onNavigate(ROUTES_PATH.Bills)
			await new Promise(process.nextTick)
			const message = await screen.getByText(/Erreur 500/)
			expect(message).toBeTruthy()
		})
  })
})


