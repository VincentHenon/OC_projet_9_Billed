/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import BillsUI from "../views/BillsUI.js"
import { ROUTES, ROUTES_PATH} from "../constants/routes.js"
import {localStorageMock} from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import router from "../app/Router.js"

jest.mock("../app/Store", () => mockStore) // mock the store

const onNavigate = ((pathname) => {
  document.body.innerHTML = ROUTES({ pathname })
})

describe("Given I am connected as an employee", () => {
  beforeEach(()=>{
    Object.defineProperty(window, "localStorage", { value: localStorageMock })
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        )
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
  })

  // CHECKING IF THE PAGE IS LOADED
  test("then, there should be a form", () => {
    document.body.innerHTML = NewBillUI()
    window.onNavigate(ROUTES_PATH.NewBill)  
      const form = screen.getByTestId("form-new-bill")
      const fileToAdd = screen.getByTestId("file")
      // Check if we got the html element
      expect(form).toBeTruthy()
      expect(fileToAdd).toBeTruthy()
  })

  // VALID FILE WITH HANDLECHANGFILE
  test("when a file is loaded with a valid format, it should be handled properly", () => {
    // init the document with the correct UI within the DOM and the correct path
    document.body.innerHTML = NewBillUI()
    window.onNavigate(ROUTES_PATH.NewBill)

    // create a new instance to access the function handleChangeFile
    const NewBillInstance = new NewBill({ 
      document, 
      onNavigate, 
      store : mockStore, 
      localStorage : window.localStorage 
    })

    // Create a mock handleChangeFile function
    const handleChangeFile = jest.fn(NewBillInstance.handleChangeFile)

    // Select the file we want to add
    const fileToAdd = screen.getByTestId("file")

    // select the error element that should remains hidden
    const fileError = screen.getByTestId("fileError")

    // Set the click and the file type
    fileToAdd.addEventListener("change", handleChangeFile)
    fireEvent.change(fileToAdd, {
      target: {
          files: [
            new File(["newBillImage.jpg"], "newBillImage.jpg", { type: "image/jpeg" })]
          }
      })
    
    // select the state checker
    const stateChecker = NewBillInstance.isFileValid

    expect(handleChangeFile).toHaveBeenCalled() //Function should have been called 
    expect(fileError).toBeTruthy()
    expect(fileError.classList.contains('hidden')).toBeTruthy()
    expect(stateChecker).toBe(true) // the state should be true
  })

  // NOT VALID FILE WITH HANDLECHANGFILE
  test("when a file is loaded with an invalid format, it should be handled properly", () => {
    document.body.innerHTML = NewBillUI()
    window.onNavigate(ROUTES_PATH.NewBill)
    // create a new instance to access the function handleChangeFile
    const NewBillInstance = new NewBill({ 
      document, 
      onNavigate, 
      store : mockStore, 
      localStorage : window.localStorage 
    })
    // Create a mock handleChangeFile function
    const handleChangeFile = jest.fn(NewBillInstance.handleChangeFile)
    // Select the file we want to add
    const fileToAdd = screen.getByTestId("file")
    const fileError = screen.getByTestId("fileError")
    // Set the mock click
    fileToAdd.addEventListener("change", handleChangeFile)
    
    // mock the condition where the extension is not valid
    fireEvent.change(fileToAdd, {
      target: {
        files: [new File(["newBillImage.pdf"], "newBillImage.pdf", { type: "application/pdf"})]
      }
    })
    
    expect(fileToAdd).toBeTruthy()
    expect(fileError).toBeTruthy()
    expect(handleChangeFile).toHaveBeenCalled()
    expect(screen.getByTestId("fileError")).toBeTruthy()

    expect(fileError.classList.contains('hidden')).not.toBeTruthy()
    expect(fileError.textContent).toBe("Le document doit être au format jpg ou png.")
  })

  // HANDLESUBMIT
  test("then, on submit, function handleSubmit should be triggered", async () => {
    jest.spyOn(mockStore, "bills")

    const mockCreatedBill = await mockStore.bills().create()
    const fileName = mockCreatedBill.fileUrl.split('/').pop(); // Splits the URL when '/' occurs and keeps the last part

    document.body.innerHTML = NewBillUI()
    window.onNavigate(ROUTES_PATH.NewBill)

    // create a new instance
    const NewBillInstance = new NewBill({ 
      document, 
      onNavigate, 
      store : mockStore, 
      localStorage : window.localStorage 
    })

    // mock the condition to launch handleSubmit with no error
    NewBillInstance.isFileValid = true // a priori pas nécessaire

    const handleSubmit = jest.fn(NewBillInstance.handleSubmit)

    const formNewBill = screen.getByTestId("form-new-bill")

    formNewBill.addEventListener("submit", handleSubmit)
  
    NewBillInstance.fileName = fileName

    // submit the valid file
    fireEvent.submit(formNewBill)

    expect(handleSubmit).toHaveBeenCalled()
  })  

  // CHECK API
  describe("Given I am a user connected as Employee", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")

      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      })
    describe("When I navigate to newBill", () => {
      // POST SUCCESS
      test("promise from mock API POST returns object bills with correct values", async () => {
        window.onNavigate(ROUTES_PATH.NewBill)
        
        const bills = await mockStore.bills().create()
        expect(bills.key).toBe("1234")
        expect(bills.fileUrl).toBe("https://localhost:3456/images/test.jpg")
      }) 

      // RETURNS AN ERROR 404
      test("Then, fetches bills from an API and fails with 404 message error", async () => {
        window.onNavigate(ROUTES_PATH.NewBill)
    
        mockStore.bills.mockImplementationOnce(() => {
          return {
            create: () => {
              return Promise.reject(new Error("Erreur 404"))
            },
          }
        })
        //window.onNavigate(ROUTES_PATH.Bills)
			  await new Promise(process.nextTick)
        document.body.innerHTML = BillsUI(
          { error: "Erreur 404" }
          )
        const message = screen.getByText("Erreur 404")
        expect(message).toBeTruthy()
      })

      // RETURNS ERROR 500
      test("Then, fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            create: () => {
              return Promise.reject(new Error("Erreur 500"))
            },
            list:()=> {
              return Promise.resolve([])
            }
          }
        })
			  await new Promise(process.nextTick)
        document.body.innerHTML = BillsUI(
          { error: "Erreur 500" }
          )
        const message = screen.getByText("Erreur 500")
        expect(message).toBeTruthy()
      })
    })
  })
})

