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

jest.mock("../app/store", () => mockStore) // mock the store

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

  test("then, there should be a form", () => {
    document.body.innerHTML = NewBillUI()
    window.onNavigate(ROUTES_PATH.NewBill)  
      const form = screen.getByTestId("form-new-bill")
      const fileToAdd = screen.getByTestId("file")
      // Check if we got the html
      expect(form).toBeTruthy()
      expect(fileToAdd).toBeTruthy()
  })

  test("when a file is loaded with a valid format, it should be handled properly", async () => {
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
      console.log('After file change event, isFileValid:', NewBillInstance.isFileValid);
    
    // select the state checker
    const stateChecker = await NewBillInstance.isFileValid

    expect(handleChangeFile).toHaveBeenCalled() //Function should have been called 
    expect(fileError).toBeTruthy()

    //____________NOT WORKING!!!!
    expect(fileError.classList.contains('hidden')).toBeTruthy() // NOT WORKING !!!!
    expect(stateChecker).toBe(true) // the state should be true // NOT WORKING !!!!
  })

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

  test("then, on submit, function handleSubmit should be triggered", async () => {
    jest.spyOn(mockStore, "bills")

    const mockCreatedBill = await mockStore.bills().create()
    const fileName = mockCreatedBill.fileUrl.split('/').pop(); // Split the URL by '/' and keep the last part

    document.body.innerHTML = NewBillUI()
    window.onNavigate(ROUTES_PATH.NewBill)

    // create a new instance
    const NewBillInstance = new NewBill({ 
      document, 
      onNavigate, 
      store : mockStore, 
      localStorage : window.localStorage 
    })

    const handleSubmit = jest.fn(NewBillInstance.handleSubmit)

    const formNewBill = screen.getByTestId("form-new-bill")

    formNewBill.addEventListener("submit", handleSubmit)
  
    NewBillInstance.fileName = fileName
    console.log("class fileName is ", NewBillInstance.fileName)

    // submit a valid file
    fireEvent.submit(formNewBill)

    // NOT WORKING!!!!
    expect(handleSubmit).toHaveBeenCalled()
  })  

  describe("Given I am a user connected as Admin", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")

      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      })
    describe("When I navigate to newBill", () => {
      // POST SUCCES
      test("promise from mock API POST returns object bills with correct values", async () => {
        window.onNavigate(ROUTES_PATH.NewBill)
        
        const bills = await mockStore.bills().create()
        expect(bills.key).toBe("1234")
        expect(bills.fileUrl).toBe("https://localhost:3456/images/test.jpg")
      }) 

      // RETURNS AN ERROR 404
      test("Then, fetches bills from an API and fails with 404 message error", async () => {
        document.body.innerHTML = NewBillUI()
        window.onNavigate(ROUTES_PATH.NewBill)
        // to do: mock changeFile()
        mockStore.bills.mockImplementationOnce(() => {
          return {
            create: () => {
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
        // to do: mock changeFile()
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
        window.onNavigate(ROUTES_PATH.Bills)
			  await new Promise(process.nextTick)
        const message = screen.getByText(/Error/)
        expect(message).toBeTruthy()
      })
    })
  })
})

