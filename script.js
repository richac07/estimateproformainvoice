let excelData = {
  categories: [],
  subcategories: {},
  subsubcategories: {} // Object to store subcategories and their subsubcategories
};

let selectedItem = {
  name: "",
  costPrice: 0,
  sellingPrice: 0
};

let totalCostPrice = 0;
let totalCost = 0;
let totalSellingPrice = 0;
let socketCostPrice = 200; // Cost Price per socket
let socketSellingPrice = 400; // Selling Price per socket
let rj45CostPrice = 150; // Cost Price per socket
let rj45SellingPrice = 300; // Selling Price per socket


// Fetch Excel Data
async function fetchExcelData() {
  try {
    const response = await fetch('./data.xlsx');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();

    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    console.log("Workbook loaded successfully:", workbook);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);
    console.log("Excel Data:", rows);

    // Parse data from Excel and store it
    parseExcelData(rows);

    const sheet2 = workbook.SheetNames[1];
    const rows2 = XLSX.utils.sheet_to_json(workbook.Sheets[sheet2]);
    console.log("Sheet2 Data:", rows2);

    populateRadioButtons(rows2); // Function 
  } catch (error) {
    console.error('Error fetching Excel data:', error.message, error);
  }
}

// Parse Excel data into categories, subcategories, and subsubcategories
function parseExcelData(rows) {
  excelData.categories = [];
  excelData.subcategories = {};
  excelData.subsubcategories = {};

  rows.forEach(row => {
    const category = row.Category?.trim(); // Remove extra spaces
    const subcategory = row.Subcategory?.trim();
    const subsubcategory = row.SubSubcategory?.trim();
    const costPrice = row['Cost Price'];
    const sellingPrice = row['Selling Price'];

    // 1. Add Category
    if (category) {
      if (!excelData.categories.includes(category)) {
        excelData.categories.push(category);
        excelData.subcategories[category] = [];
        excelData.subsubcategories[category] = {};
      }
    }

    // 2. Add Subcategory
    if (category && subcategory) {
      if (!excelData.subcategories[category].includes(subcategory)) {
        excelData.subcategories[category].push(subcategory);
        excelData.subsubcategories[category][subcategory] = []; // Initialize as empty
      }
    }

    // 3. Add Subsubcategory (Only if it exists)
    if (category && subcategory && subsubcategory) {
      // Ensure subsubcategories is correctly initialized
      if (!excelData.subsubcategories[category][subcategory]) {
        excelData.subsubcategories[category][subcategory] = [];
      }

      // Push subsubcategory data
      excelData.subsubcategories[category][subcategory].push({
        name: subsubcategory,
        costPrice: costPrice || 0,
        sellingPrice: sellingPrice || 0
      });
    }
  });

  console.log("Parsed Categories:", excelData.categories);
  console.log("Parsed Subcategories:", excelData.subcategories);
  console.log("Parsed Subsubcategories:", excelData.subsubcategories);

  populateCategoryDropdown();
}


// Populate category dropdown
function populateCategoryDropdown() {
  const categoryDropdown = document.getElementById("category-dropdown");
  categoryDropdown.innerHTML = '<option value="" disabled selected>Select Category</option>';

  excelData.categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryDropdown.appendChild(option);
  });

  categoryDropdown.addEventListener("change", loadSubcategories);
}

// Load subcategories
function loadSubcategories() {
  const category = document.getElementById("category-dropdown").value;
  const subcategoryDropdown = document.getElementById("subcategory-dropdown");

  subcategoryDropdown.innerHTML = '<option value="" disabled selected>Select Subcategory</option>';

  if (category && excelData.subcategories[category]) {
    excelData.subcategories[category].forEach(subcategory => {
      const option = document.createElement("option");
      option.value = subcategory;
      option.textContent = subcategory;
      subcategoryDropdown.appendChild(option);
    });

    subcategoryDropdown.removeEventListener("change", loadSubsubcategories);
    subcategoryDropdown.addEventListener("change", loadSubsubcategories);
  }
}

// Load subsubcategories
function loadSubsubcategories() {
  const category = document.getElementById("category-dropdown").value;
  const subcategory = document.getElementById("subcategory-dropdown").value;
  const subsubcategoryDropdown = document.getElementById("subsubcategory-dropdown");

  subsubcategoryDropdown.innerHTML = '<option value="" disabled selected>Select Subsubcategory</option>';

  if (
    category &&
    subcategory &&
    excelData.subsubcategories[category] &&
    excelData.subsubcategories[category][subcategory]
  ) {
    excelData.subsubcategories[category][subcategory].forEach(item => {
      const option = document.createElement("option");
      option.value = item.name;
      option.textContent = `${item.name}`;
      option.setAttribute("data-cost", item.costPrice);
      option.setAttribute("data-price", item.sellingPrice);
      subsubcategoryDropdown.appendChild(option);
    });
  }
  subsubcategoryDropdown.addEventListener("change", displayPrices);
}

// Display prices for the selected subsubcategory
function displayPrices() {
  const subsubcategoryDropdown = document.getElementById("subsubcategory-dropdown");
  const selectedOption = subsubcategoryDropdown.options[subsubcategoryDropdown.selectedIndex];

  if (selectedOption.value) {
    const costPrice = selectedOption.getAttribute("data-cost");
    const sellingPrice = selectedOption.getAttribute("data-price");
    const subcategory = document.getElementById("subcategory-dropdown").value;
    const category = document.getElementById("category-dropdown").value;


    document.getElementById("cost-price").textContent = costPrice;
    document.getElementById("selling-price").textContent = sellingPrice;

    selectedItem.name = selectedOption.value;
    selectedItem.category = category;
    selectedItem.subCategory= subcategory;
    selectedItem.costPrice = parseFloat(costPrice);
    selectedItem.sellingPrice = parseFloat(sellingPrice);
  }
}
// Add to Cart functionality
document.getElementById("add-to-cart-btn").onclick = function() {
  if (selectedItem.name) {
      // Add item to cart
      
      
      addToCart(selectedItem.name, selectedItem.category, selectedItem.subCategory, selectedItem.sellingPrice, selectedItem.costPrice);

      // Reset the dropdowns, cost price, and selling price
      resetFields();
  } else {
      alert("Please select an item first!");
  }
};
function populateRadioButtons() {
  const radioContainer = document.getElementById("radio-container");

  // Clear any existing content
  radioContainer.innerHTML = "";

  // Add heading for Protocol
  const heading = document.createElement("h3");
  heading.textContent = "Protocol";
  radioContainer.appendChild(heading);

  // List of radio options
  const options = ["WiFi", "ZigBee", "NonIoT"];

  options.forEach((option, index) => {
    // Create radio button
    const radioButton = document.createElement("input");
    radioButton.type = "radio";
    radioButton.name = "protocol"; // Group name for radio buttons
    radioButton.value = option;
    radioButton.id = `radio-${index}`;

    // Create label
    const label = document.createElement("label");
    label.htmlFor = `radio-${index}`;
    label.textContent = option;

    // Append radio button and label
    radioContainer.appendChild(radioButton);
    radioContainer.appendChild(label);
    radioContainer.appendChild(document.createElement("br")); // Line break
  });
}
populateRadioButtons();

// Protocol prices
const protocolPrices = {
  WiFi: { costPrice: 100, sellingPrice: 200 },
  ZigBee: { costPrice: 200, sellingPrice: 400 },
  NonIoT: { costPrice: 0, sellingPrice: 0 } // NonIoT has no extra cost
};

// Add product to cart and update TCP
function addToCart(name, category, subCategory, price, tcp) {
  const cartDiv = document.getElementById("cart");
  const cartItem = document.createElement("div");
  let itemSP =0;
  let itemCP =0;
  const selectedProtocol = document.querySelector('input[name="protocol"]:checked');
  if (!selectedProtocol) {
    alert("Please select a protocol!");
    return;
  }

  //Item Quantity
  const quantity = parseInt(document.getElementById("quantity").value, 10) || 1;
  // baseSP= price * quantity;
  // baseCP = tcp *quantity;
  //protocol value
  const protocol = selectedProtocol.value;
  const protocolCost = protocolPrices[protocol].costPrice;
  const protocolSelling = protocolPrices[protocol].sellingPrice;

  //socket value with Quantity
  const socketQuantity = parseInt(document.getElementById("socket-quantity").value, 10);
  const socketTotalCost = socketCostPrice * socketQuantity;
  const socketTotalSelling = socketSellingPrice * socketQuantity;

  //RJ45 value with Quantity
  const rj45Quantity = parseInt(document.getElementById("rj45-quantity").value, 10);
  const rj45TotalCost = rj45CostPrice * rj45Quantity;
  const rj45TotalSelling = rj45SellingPrice * rj45Quantity;
  const notes = document.getElementById('notes');

  console.log("Base SP:", price);
  console.log("Base CP:", tcp);
  console.log("Protol SP:", protocolSelling);
  console.log("Protol CP:", protocolCost);
  console.log("Socket SP:", socketTotalSelling);
  console.log("Socket CP:", socketTotalCost);
  console.log("RJ45 SP:", rj45TotalSelling);
  console.log("RJ45 CP:", rj45TotalCost);
  console.log("Please Note: ",notes )
  itemSP = (price + protocolSelling + socketTotalSelling +rj45TotalSelling) * quantity ;
  itemCP = (tcp + protocolCost +socketTotalCost +rj45TotalCost) * quantity;

  totalSellingPrice += itemSP ;
  totalCostPrice += itemCP;
  document.getElementById("total").textContent = totalSellingPrice.toFixed(2);
  document.getElementById("totalCP").textContent = totalCostPrice.toFixed(2);
  console.log("Total Selling Price:", totalSellingPrice);
  console.log("Total Cost Price:", totalCostPrice);
  console.log("Total Selling Price with tofixed:", totalSellingPrice.toFixed(2));
  console.log("Total Cost Price with toFixed:", totalCostPrice.toFixed(2));


const row = document.createElement("tr");
const notesRow = document.createElement("tr");
// Unique ID for Notes field
const rowId = `row-${Date.now()}`;
row.setAttribute("id", rowId);
const prefixedName = `${category} - ${subCategory} - ${name}`;

  row.innerHTML = `
    <td>${prefixedName}</td>
    <td>${quantity}</td>
    <td>Rs ${tcp}</td>
    <td>Rs ${price}</td>
    <td>${protocol}</td> <!-- Protocol -->
    <td>${socketQuantity}</td> <!-- Socket Quantity -->
    <td>${rj45Quantity}</td> <!-- RJ45 Quantity -->
    <td>Rs ${itemCP.toFixed(2)}</td>
    <td>Rs ${itemSP.toFixed(2)}</td>
    <td><button class="delete-btn">Delete</button></td> 
  `;

  // rowNote.innerHTML = `<td>${notes}</td>`;
  // Add Notes input field
  notesRow.setAttribute("id", `${rowId}-notes`);
  notesRow.innerHTML = `
    <td colspan="9">
      <label for="notes">Notes:</label>
      <input type="text" class="notes-input" placeholder="Add your notes here" />
    </td>
  `;



  // Append the row to the cart table body
  document.getElementById("cart-body").appendChild(row);
 // document.getElementById("cart-body").appendChild(rowNote);
 document.getElementById("cart-body").appendChild(notesRow);




  row.querySelector(".delete-btn").addEventListener("click", function () {
    // Remove the row from the table
    deleteCartRow(rowId);
 
  });

  // Update the total amount in the cart
  updateCartTotal();

  
}
function deleteCartRow(rowId) {
  // Remove the main row
  const row = document.getElementById(rowId);
  if (row) {
    row.remove();
  }

  // Remove the corresponding Notes row
  const notesRow = document.getElementById(`${rowId}-notes`);
  if (notesRow) {
    notesRow.remove();
  }

  // Update totals
  updateCartTotal();
}





function updateCartTotal() {
  const cartRows = document.querySelectorAll("#cart-body tr");
  let totalAmount = 0;
  let totalCost = 0;
  let totalSellingPrice = 0;
  let profitInHand =0;

  let discount = parseInt(document.getElementById("discount").value, 10);

  cartRows.forEach(row => {

    if (row.classList.contains("notes-row")) {
      return; // Skip this iteration
    }
    const totalCostCell = row.cells[7].textContent.replace("Rs", "").trim();
    const totalSellCell = row.cells[8].textContent.replace("Rs", "").trim();

    totalCost += parseFloat(totalCostCell);
    totalSellingPrice += parseFloat(totalSellCell);
    
  });

  profitInHand = (((100 - discount)/100)*totalSellingPrice) - totalCost;

  // Update the total amount and total cost price/selling price
  document.getElementById("total").textContent = totalSellingPrice.toFixed(2);
  document.getElementById("totalCP").textContent = totalCost.toFixed(2);
  document.getElementById("profit").textContent = profitInHand;
}

let profitValue= 0;
let newFinalAmount =0;
const discountInput = document.getElementById("discount");
// Function to update the profit
function updateProfit() {
  
  discountValue= +discountInput.value; 
  profitValue = (((100 - discountValue)/100)*totalSellingPrice) - totalCostPrice;
  newFinalAmount = (((100 - discountValue)/100)*totalSellingPrice);
  console.log("Total PRofit Price:", profitValue);
  console.log("discountValue:", discountValue);
  console.log("totalSellingPrice:", totalSellingPrice);
  console.log("totalCost:", totalCostPrice);
  // Update the profit display
  document.getElementById("profit").textContent = profitValue.toFixed(2);  // Update the span with profit value
  document.getElementById("finalAmount").textContent = newFinalAmount.toFixed(2);
}

discountInput.addEventListener("input",updateProfit);


// Reset all fields after adding to cart
function resetFields() {
  // Reset dropdowns to default
  document.getElementById("category-dropdown").value = "";
  document.getElementById("subcategory-dropdown").innerHTML = "<option value=''>Select Subcategory</option>";
  document.getElementById("subsubcategory-dropdown").innerHTML = "<option value=''>Select Sub-Subcategory</option>";

  // Reset the displayed prices
  document.getElementById("cost-price").textContent = "0.00";
  document.getElementById("selling-price").textContent = "0.00";
  document.getElementById("socket-quantity").value = 0; 
  document.getElementById("rj45-quantity").value = 0; 
  document.getElementById("quantity").value = 1; 


  // Clear selected item data
  selectedItem = { name: "", costPrice: 0, sellingPrice: 0 };
}


// Reset the entire page
document.getElementById("reset-btn").onclick = function() {

  const modal = document.getElementById("custom-modal");
  const confirmButton = document.getElementById("confirm-btn");
  const cancelButton = document.getElementById("cancel-btn");

  // Show the modal
  modal.style.display = "block";

  // When "Yes" is clicked
  confirmButton.onclick = function () {
    console.log("Confirm clicked");
    resetPage();
    modal.style.display = "none";
  };

  // When "No" is clicked
  cancelButton.onclick = function () {
    console.log("Cancel clicked");
    modal.style.display = "none"; // Just hide the modal
  };
  
};

function resetPage() {
  // Reset dropdowns to default
  document.getElementById("category-dropdown").value = "";
  document.getElementById("subcategory-dropdown").innerHTML = "<option value=''>Select Subcategory</option>";
  document.getElementById("subsubcategory-dropdown").innerHTML = "<option value=''>Select Sub-Subcategory</option>";

  // Reset the displayed prices
  document.getElementById("cost-price").textContent = "0.00";
  document.getElementById("selling-price").textContent = "0.00";

  // Reset customer details
  document.getElementById("customer-name").value = ""; 
  document.getElementById("phone-number").value = ""; 
  document.getElementById("email").value = ""; 
  document.getElementById("cutomer-address").value = ""; 


  // Clear selected item data
  selectedItem = { name: "", costPrice: 0, sellingPrice: 0 };

  const cartBody = document.getElementById("cart-body"); // Assuming tbody has the ID "cart-body"
   cartBody.innerHTML = ""; // Removes all rows from the cart


  // Reset total Selling Price (TSP) and Total Cost Price (TCP)
  totalSellingPrice = 0;
  totalCostPrice = 0;
  document.getElementById("total").textContent = "0.00";  // Reset total selling price
  document.getElementById("totalCP").textContent = "0.00"; // Reset total cost price
   
}

// Add this inside your script.js file

document.getElementById("generateInvoice").addEventListener("click", function() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const discountValue = +document.getElementById("discount").value;  // Convert discount input to number
  const finalAmountValue = +document.getElementById("finalAmount").textContent; // Get final amount from the page


  // Set the header with the company name
  doc.setFontSize(20);
  doc.text('SMART OHM', 105, 20, null, null, 'center');

  // Add the title of the invoice
  doc.setFontSize(16);
  doc.text('Proforma Invoice', 105, 30, null, null, 'center');

  // Add customer name
  const customerName = document.getElementById('customer-name').value;
  if (customerName) {
    doc.setFontSize(16);
    doc.text('Name: ' + customerName, 20, 40);
  } else {
    doc.setFontSize(16);
    doc.text('Name: Not Provided', 20, 40);
  }

  // Add customer phone number
  const phonenumber = document.getElementById('phone-number').value;
  if (phonenumber) {
    doc.setFontSize(16);
    doc.text('Phone: ' + phonenumber, 20, 50);
  } else {
    doc.setFontSize(16);
    doc.text('Phone: Not Provided', 20, 50);
  }

  // Add customer email ID 
  const email = document.getElementById('email').value;
  if (email) {
    doc.setFontSize(16);
    doc.text('Email: ' + email, 120, 50);
  } else {
    doc.setFontSize(16);
    doc.text('Email: Not Provided', 120, 50);
  }

  // Add customer email ID 
  const cutomeraddress = document.getElementById('cutomer-address').value;
  if (cutomeraddress) {
    doc.setFontSize(16);
    doc.text('Address: ' + cutomeraddress, 20, 60);
  } else {
    doc.setFontSize(16);
    doc.text('Address: Not Provided', 20, 60);
  }




  // Get the table data
  const cartTable = document.getElementById("cart-table");
  
  // Header fields for the PDF (matching the correct order)
  const headers = ["Item", "Quantity", "Price","Protocol","Socket","RJ45", "Total","Notes"];
  
  // Get the table rows data excluding Cost Price, Total Cost, and Actions columns
  const rows = [];
  const tableRows = cartTable.querySelectorAll("tbody tr");
  
  tableRows.forEach(row => {
    const rowData = [];
    const cells = row.querySelectorAll("td");

    if (cells.length > 1) {
      rowData.push(cells[0].textContent.trim()); // Column 1 - Item Name (index 0)
      rowData.push(cells[1].textContent.trim()); // Column 2 - Quantity (index 2)
      rowData.push(cells[3].textContent.trim());  // Column 4 - Price (index 3)
      rowData.push(cells[4].textContent.trim()); // Column 6 -Protocol (index 5)
      rowData.push(cells[5].textContent.trim()); // Column 6 - Socket(index 5)
      rowData.push(cells[6].textContent.trim()); // Column 6 - RJ45(index 5)
      rowData.push(cells[8].textContent.trim()); // Column 6 - Total(index 5)
       // Add the row data to the rows array
       rowData.push("");
    } else if (cells.length === 1) {
      // If it's a notes row, add the note to the last row in the `rows` array
      const noteInput = cells[0].querySelector("input");
      if (noteInput && rows.length > 0) {
        rows[rows.length - 1][7] = noteInput.value.trim(); // Add the note to the "Notes" column
      }
      rowData.push(noteInput); 
    }
    rows.push(rowData);
    });

  // Add the table to the PDF
 
  doc.autoTable({
    head: [headers],  // Only show required headers
    body: rows,       // Only the required data in the rows
    startY: 80,       // Position of the table in the PDF (adjusted below customer name)
  });

  // Add the Total Amount section after the table
  const totalYPosition = doc.lastAutoTable.finalY + 10;  // Calculate the Y position for the Total Amount section
  //const totalAmount = document.getElementById('total').value;
  doc.setFontSize(14);
  doc.text("Total Amount: ", 20, totalYPosition);
  doc.setFontSize(12);
  doc.text('Rs: ' +totalSellingPrice.toFixed(2), 105, totalYPosition, null, null, 'center'); // Display total in the center
//
//

  // doc.setFontSize(14);
  // doc.text(`Discount:  ${discountValue.toFixed(2)} %`, 14, doc.lastAutoTable.finalY + 20, null, null, 'center');
  // doc.setFontSize(14);
  // doc.text(`Final Amount After Discount: Rs ${finalAmountValue.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 30, null, null, 'center');

  doc.setFontSize(14);
  doc.text("Discount: ", 20, doc.lastAutoTable.finalY + 20);
  doc.setFontSize(12);
  doc.text(` ${discountValue.toFixed(2)} %`, 105, doc.lastAutoTable.finalY + 20, null, null, 'center');


  doc.setFont("helvetica", "bold"); // Set font to bold
  doc.setFontSize(14); // Set the font size
  doc.text("Total Discounted Cost: ", 20, doc.lastAutoTable.finalY + 30);
  doc.setFont("helvetica", "bold"); // Set font to bold
  doc.setFontSize(14); // Set the font size

  // Add the "Final Amount After Discount" text
  doc.text(` Rs ${finalAmountValue.toFixed(2)}`, 105, doc.lastAutoTable.finalY + 30, null, null, 'center');

 

  // Save the generated PDF as invoice.pdf  
  doc.save('invoice.pdf');
});

function adjustTableDimensions() {
  const cartTable = document.getElementById("cart-table");
  cartTable.style.width = "100%"; // Full width of its parent container
}
window.addEventListener("resize", adjustTableDimensions);



// Initialize
fetchExcelData();
