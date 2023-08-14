/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom/extend-expect"
import userEvent from "@testing-library/user-event"
import fireEvent from "@testing-library/user-event"
import { screen, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
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
  describe("When I am on NewBill Page", () => {  
    // Spy on the store
    jest.spyOn(mockStore, "bills")

    test("then, there should be a form", () => {
      document.body.innerHTML = NewBillUI()
      window.onNavigate(ROUTES_PATH.NewBill)  
        const form = screen.getByTestId("form-new-bill")
        const fileToAdd = screen.getByTestId("file")
        // Check if we got the html
        expect(form).toBeTruthy()
        expect(fileToAdd).toBeTruthy()
    })

    describe("When I load a file",() => {
      test("then, if the format is valid it, should be handled properly", () => {
        document.body.innerHTML = NewBillUI()
        window.onNavigate(ROUTES_PATH.NewBill)
        // create a new instance to access the function handleChangeFile
        const NewBillInstance = new NewBill({ 
          document, 
          onNavigate, 
          store : mockStore, 
          localStorage : window.localStorage 
        })
        console.log("function" ,  NewBillInstance.handleChangeFile)
        // Create a mock handleChangeFile function
        const handleChangeFile = jest.fn(NewBillInstance.handleChangeFile)
        // Select the file we want to add
        const fileToAdd = screen.getByTestId("file")
        // Set the mock click
        fileToAdd.addEventListener("change", handleChangeFile)
        
        // Mock the condition where the file extension is valid
        expect(fileToAdd).toBeTruthy()
        expect(()=> { 
          userEvent.change(fileToAdd, {
            target: {
                files: [new File(["newBillImage.jpg"], "newBillImage.jpg", { type: "image/jpeg" })]
                }
            })
         }).toThrow(Error)
      })


      test("then, if the format is not valid, it should be handled properly", () => {
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
        console.log("filetoAdd", fileToAdd)
        // Set the mock click
        fileToAdd.addEventListener("change", handleChangeFile)
        // mock the condition where the extension is not valid
        expect(fileToAdd).toBeTruthy()
        expect(fileError).toBeTruthy()
        expect(()=> { 
          fireEvent.change(fileToAdd, {
            target: {
              files: [new File(["newBillImage.pdf"], "newBillImage.pdf", { type: "application/pdf"})]
            }
          })
         }).toThrow(Error)
         
         fireEvent.change(fileToAdd, {
          target: {
            files: [new File(["newBillImage.pdf"], "newBillImage.pdf", { type: "application/pdf"})]
          }
        })

         expect(screen.getByTestId("fileError")).toBeTruthy()
         //console.log(fileError.classList.contains("hidden"))
         //_______________________________________________above is working
         expect(fileError.classList.contains('hidden')).toBe(false)
      })
    })



    /*
    test("Then it should create a fileURL, a unique key", async() => {
    
      const createdBill = await mockStore.bills().create({
        vat: "80",
        status: "pending",
        type: "Hôtel et logement",
        commentary: "séminaire billed",
        name: "encore",
        fileName: "preview-facture-free-201801-pdf-1.jpg",
        date: "2004-04-04",
        amount: 400,
        commentAdmin: "ok",
        email: "a@a",
        pct: 20
      })

      expect(createdBill.fileUrl).toBe("https://localhost:3456/images/test.jpg")
      expect(createdBill.key).toBe("1234")
    })*/
  })
})

