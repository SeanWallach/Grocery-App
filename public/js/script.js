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
  const ul = document.getElementById('itemList')
  const div = document.createElement('div')
  div.id = 'item-' + id
  div.style.cssText =
    'display:flex;justify-content:space-evenly;align-items:center;padding: 10px;margin:10px;border-radius:14px;border:white;border:1px solid;background-color:#2d2e2e;'

  const p = document.createElement('p')
  p.textContent = item
  p.style.cssText = 'color:white;'

  const img = document.createElement('img')
  img.src = imagePath
  img.alt = item
  img.style.height = '50px' // Set image size as needed

  const deleteButton = document.createElement('button')
  deleteButton.className = 'btn btn-danger btn-sm' // Bootstrap classes for small, red button
  deleteButton.innerHTML = '<i class="bi bi-trash"></i>' // Using Bootstrap Icons
  deleteButton.onclick = function () {
    fetch('/delete-item', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: id }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          const itemElement = document.getElementById('item-' + id)
          itemElement.remove() // Remove the item from the list
        }
      })
  }

  div.appendChild(img)
  div.appendChild(p)
  div.appendChild(deleteButton)
  ul.appendChild(div)
}
