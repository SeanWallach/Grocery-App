window.onload = function () {
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
          addItemToList(newItem, data.id, '/public/images/' + newItem + '.png')
          document.getElementById('newItem').value = '' // Clear input after adding
        }
      })
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
  imagePath = imagePath.trim()
  div.appendChild(img)

  // Set image source after defining onload and onerror
  //   img.onload = function () {
  // div.appendChild(img) // Append the loaded image to the list item if it loads successfully
  // img.src = imagePath
  // div.obje
  //   }

  img.onerror = function () {
    console.error('Failed to load image at ' + imagePath)
    img.src = '/images/PLACEHOLDER.png' // Use a placeholder image in case of an error
  }

  div.id = 'item-' + id
  div.style.cssText =
    'display:flex;justify-content:space-between;align-items:center;padding:10px;margin:10px;border-radius:14px;border:white;border:1px solid;background-color:#2d2e2e;max-width:250px;min-width:210px;'

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

  // Assign the src last to ensure onload and onerror are set up
  img.src = imagePath
}

// Requests meal plan from server and waits for response. Adds meal plan to span upon response
function fetchMealPlan() {
  console.log('Meal plan requested')
  fetch('/get-meal-plan')
    .then((response) => {
      return response.json()
    })
    .then((data) => {
      console.log('Browser received meal plan.')
      document.getElementById('mealPlanResponse').innerText =
        data.responseContents
    })
}
