import { ROUTES_PATH } from '../constants/routes.js'
import Logout from "./Logout.js"

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`)
    formNewBill.addEventListener("submit", this.handleSubmit)
    const file = this.document.querySelector(`input[data-testid="file"]`)
    file.addEventListener("change", this.handleChangeFile)
    this.fileUrl = null
    this.fileName = null
    this.billId = null
    this.isFileValid = null // set the state false by default
    new Logout({ document, localStorage, onNavigate })
  }
  handleChangeFile = e => {
    e.preventDefault()
    const file = this.document.querySelector(`input[data-testid="file"]`).files[0]
    const fileError = this.document.getElementById("fileError")
    const filePath = e.target.value.split(/\\/g) // split the file path in parts
    const fileName = filePath[filePath.length-1].toLowerCase() //keep the last part of file path to get the filename
    this.isFileValid = false // set the state false by default
    const formData = new FormData()
    const email = JSON.parse(localStorage.getItem("user")).email
    formData.append('file', file)
    formData.append('email', email)
    //________________________________________________________________________________________//
    // CHECK if the extension is jpeg, jpg or png.
    if (fileName.includes(".jpeg") || fileName.includes(".jpg") || fileName.includes(".png")) {
      this.isFileValid = true // set the state to true
      fileError.classList.add("hidden") // hide the error message
      this.store
      .bills()
      .create({
        data: formData,
        headers: {
          noContentType: true
        }
      })
      .then(({filePath, key}) => {
        this.billId = key
        this.fileUrl = filePath
        this.fileName = fileName
      }).catch(error => console.error(error))
    } else {
      fileError.classList.remove("hidden")
      //throw new Error("file should be a jpg or png format.")
    }
  }
  handleSubmit = e => {
      e.preventDefault()
      console.log("filename ", this.fileName)
      /*const fileExtension = this.fileName.split('.').pop().toLowerCase()
      if (fileExtension.includes("jpeg") || fileExtension.includes("jpg") || fileExtension.includes("png")) {*/
      if (this.isFileValid) {
        console.log('e.target.querySelector(`input[data-testid="datepicker"]`).value', e.target.querySelector(`input[data-testid="datepicker"]`).value)
        const email = JSON.parse(localStorage.getItem("user")).email
        const bill = {
          email,
          type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
          name:  e.target.querySelector(`input[data-testid="expense-name"]`).value,
          amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
          date:  e.target.querySelector(`input[data-testid="datepicker"]`).value,
          vat: e.target.querySelector(`input[data-testid="vat"]`).value,
          pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
          commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
          fileUrl: this.fileUrl,
          fileName: this.fileName,
          status: 'pending'
        }
        this.updateBill(bill)
        this.onNavigate(ROUTES_PATH['Bills'])
        this.isFileValid = false
      }
  } 

  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
      .bills()
      .update({data: JSON.stringify(bill), selector: this.billId})
      .then(() => {
        this.onNavigate(ROUTES_PATH['Bills'])
      })
      .catch(error => console.error(error))
    }
  }
}