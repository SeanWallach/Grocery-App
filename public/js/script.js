window.onload = function () {
  document.getElementById('mealPlanSpinner').style.visibility = 'hidden'
  document.getElementById('newItemSpinner').style.visibility = 'hidden'
  fetch('/get-items')
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        const items = data.items
        items.forEach((item) => {
          addItemToList(item.item, item.id, item.imagePath)
        })
      }
    })
}

document.getElementById('groceryForm').onsubmit = function (event) {
  event.preventDefault()
  const newItem = document.getElementById('newItem').value
  if (newItem !== '') {
    document.getElementById('newItemSpinner').style.visibility = 'visible'
    if (newItem) {
      fetch('/add-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ item: newItem }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            addItemToList(
              newItem,
              data.id,
              '/public/images/' + newItem + '.png',
            )
            document.getElementById('newItem').value = '' // Clear input after adding
          }
        })
    }
  }
}

function addItemToList(item, id, imagePath) {
  const div = document.createElement('div')
  const p = document.createElement('p')
  const deleteButton = document.createElement('button')
  const container = document.getElementById('itemList')
  const img = new Image()
  img.style.height = '50px' // Set image size as needed
  img.alt = 'Image of ' + item
  img.id = id + '-image'
  img.src = '/images/PLACEHOLDER.png'
  //   imagePath = imagePath.trim()
  div.appendChild(img)

  // Set image source after defining onload and onerror
  img.onload = function () {
    img.src = '/images/' + item + '.png'
  }

  div.id = 'item-' + id
  div.style.cssText =
    'transition: opacity 2s ease-in-out;display:flex;justify-content:space-between;align-items:center;padding:10px;margin:10px;border-radius:14px;border:#b9b7a7;border:1px solid;background-color:#4e5166;max-width:250px;min-width:210px;box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);'

  p.textContent = item
  p.style.cssText = 'color:white;margin-top:12px'

  deleteButton.className = 'btn btn-danger btn-sm' // Bootstrap classes for small, red button
  deleteButton.innerHTML = '<i class="bi bi-trash"></i>' // Using Bootstrap Icons
  deleteButton.onclick = function () {
    console.log('Item deleted.')
    fetch('/delete-item', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          const itemElement = document.getElementById('item-' + id)
          itemElement.remove() // Remove the item from the list
        }
      })
  }

  div.appendChild(p)
  div.appendChild(deleteButton)
  container.appendChild(div)
  document.getElementById('newItemSpinner').style.visibility = 'hidden'
}

// Requests meal plan from server and waits for response. Adds meal plan to span upon response
function fetchMealPlan() {
  console.log('Meal plan requested')
  document.getElementById('mealPlanSpinner').style.visibility = 'visible'
  fetch('/get-meal-plan')
    .then((response) => {
      return response.json()
    })
    .then((data) => {
      console.log('Browser received meal plan.')
      document
        .getElementById('mealPlanResponseDiv')
        .style.setProperty('padding', '40px')

      document.getElementById('mealPlanResponse').innerHTML =
        data.responseContents

      document.getElementById('mealPlanSpinner').style.visibility = 'hidden'
    })
}

// User requrests email
function sendEmail() {
  console.log('Email Copy Requested')
  fetch('/email-grocery-list')
    .then((response) => {
      return response.json()
    })
    .then((data) => {
      console.log('Server sent email.')
    })
}
