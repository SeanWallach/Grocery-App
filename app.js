const express = require('express')
const fs = require('fs')
const axios = require('axios')

const app = express()
app.use(express.static('public'))
app.use(express.json()) // For parsing application/json

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  const currentTime = Date()
  console.log(`${currentTime} Server is running on port ${PORT}`)
})

const currentTime = Date()

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html')
})

app.get('/get-items', (req, res) => {
  fs.readFile('items.json', (err, data) => {
    if (err) {
      console.error(err)
      return res
        .status(500)
        .json({ success: false, message: 'Failed to load items.' })
    }
    const items = JSON.parse(data.toString() || '[]')
    res.json({ success: true, items })
  })
})

app.post('/add-item', (req, res) => {
  const { item } = req.body
  fs.readFile('items.json', (err, data) => {
    if (err) {
      console.error(err)
      return res.json({ success: false })
    }
    const items = JSON.parse(data.toString() || '[]')
    const newItem = { id: items.length, item } // Simplistic ID: index in the array
    items.push(newItem)
    fs.writeFile('items.json', JSON.stringify(items, null, 2), (err) => {
      if (err) {
        console.error(err)
        return res.json({ success: false })
      }
      console.log(`${currentTime} Item Added: ${item}`)
      res.json({ success: true, id: newItem.id })
    })
  })
})

app.post('/delete-item', (req, res) => {
  const { id } = req.body
  fs.readFile('items.json', (err, data) => {
    if (err) {
      console.error(err)
      return res.json({ success: false })
    }
    let items = JSON.parse(data.toString() || '[]')
    items = items.filter((item) => item.id !== id)
    fs.writeFile('items.json', JSON.stringify(items, null, 2), (err) => {
      if (err) {
        console.error(err)
        return res.json({ success: false })
      }
      res.json({ success: true })
    })
  })
})
