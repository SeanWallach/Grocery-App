const express = require('express')
const fs = require('fs')
const { OpenAI } = require('openai')
const axios = require('axios')
const path = require('path')
const nodemailer = require('nodemailer')

// =========================================================================
// SETUP
// =========================================================================

require('dotenv').config()
const app = express()
app.use(express.static(path.join(__dirname, 'public')))

app.use(express.json()) // For parsing application/json

let currentTime

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  currentTime = Date()
  console.log(`${currentTime} Server is running on port ${PORT}`)
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// =========================================================================
// MIDDLEWARE
// =========================================================================

// Home Page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html')
  currentTime = Date()
  console.log(`${currentTime} Server is running on port ${PORT}`)
})

// On Page Reload
app.get('/get-items', async (req, res) => {
  console.log('User connected.')

  getItems(async (err, data) => {
    if (err) {
      console.log(err)
    } else {
      res.json({ success: true, items })
    }
  })
})

// User adds item
app.post('/add-item', async (req, res) => {
  const { item } = req.body
  console.log('Item received: ', item)

  const relativeFilePath = path.join('images', `${item}.png`)
  const imagesDirectoryPath = path.join(__dirname + '/public/images')

  // Collect all image files
  const imageFiles = fs
    .readdirSync(imagesDirectoryPath)
    .filter((file) =>
      fs.statSync(path.join(imagesDirectoryPath, file)).isFile(),
    )

  // If the image does not already exist, query Dalle-2 via openai to create a new one
  if (!imageFiles.includes(item + '.png')) {
    console.log('Image not found. Generating...')
    try {
      // Request Image generation from Dalle-2
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: 'a goofy, simplistic drawing of ' + item.toString(),
        n: 1,
        size: '1024x1024',
      })
      console.log('Image Generated.')

      // Download image from URL
      const responseImage = await axios({
        url: response.data[0].url,
        responseType: 'arraybuffer',
      })

      console.log('Image downloaded.')

      // Write image to disk
      fs.writeFile(
        __dirname + '/public/' + relativeFilePath,
        responseImage.data,
        'binary',
        function (err) {
          if (err) {
            console.log(err)
            return res.json({ success: false })
          }
          console.log('File saved.')
          //   res.json({ success: true })
        },
      )
    } catch (error) {
      console.error('Error generating image:', error)
      return res
        .status(500)
        .json({ success: false, message: 'Failed to generate image' })
    }
  }

  // construct json object for item
  const id = Math.floor(Math.random() * 100).toString() + item // serializer
  const newItem = { id, item, imagePath: relativeFilePath }
  let items

  getItems((err, data) => {
    if (err) {
      console.error(err)
    } else {
      items = data
      items.push(newItem)

      // write new item to json file
      fs.writeFile('items.json', JSON.stringify(items, null, 2), (err) => {
        if (err) {
          console.error('Error writing file:', err)
          return res.json({ success: false })
        }
        res.json({
          success: true,
          id: newItem.id,
          imagePath: newItem.imagePath,
        })
      })
    }
  })
})

// User Deletes item
app.post('/delete-item', (req, res) => {
  const { id } = req.body
  fs.readFile('items.json', (err, data) => {
    if (err) {
      console.error(err)
      return res.json({ success: false })
    }
    items = JSON.parse(data.toString() || '[]')
    items = items.filter((item) => item.id !== id)
    fs.writeFile('items.json', JSON.stringify(items, null, 2), (err) => {
      if (err) {
        console.error('Error deleting file:', err)
        return res.json({ success: false })
      }
      currentTime = Date()
      console.log(`${currentTime} : Item deleted. `)
      res.json({ success: true })
    })
  })
})

// User Requests Meal Plan generation
app.get('/get-meal-plan', async (req, res) => {
  console.log('Meal plan requested.')
  getItems(async (err, items) => {
    if (err) {
      // Handle error
      console.error('Failed to load items:', err.message)
      // Send an appropriate response if using this in Express.js
    } else {
      // Process items
      try {
        const ingredients = items.map((obj) => obj.item).join(', ')
        const response = await createMealPlan(ingredients)
        const responseContents = response.choices[0].message.content
        console.log('Meal Plan Received')

        fs.writeFile(
          'mealplan.txt',
          responseContents,
          'binary',
          function (err) {
            if (err) {
              console.log(err)
              return res.json({ success: false })
            }
            console.log('Meal plan file saved.')
          },
        )

        res.json({ responseContents })
      } catch (error) {
        console.error('Failed to create meal plan:', error.message)
      }
    }
  })
})

// Gets items from items.json addds to them to an array
function getItems(callback) {
  fs.readFile('items.json', (err, data) => {
    if (err) {
      console.error(err)
      return callback(err, null)
    }
    items = JSON.parse(data.toString() || '[]')
    return callback(null, items)
  })
}

// Gets items from items.json addds to them to an array
function getMealPlan(callback) {
  fs.readFile('mealplan.txt', (err, data) => {
    if (err) {
      console.error(err)
      return callback(err, null)
    }
    items = data.toString()
    return callback(null, items)
  })
}

async function createMealPlan(ingredients) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-2024-04-09',
      messages: [
        {
          role: 'system',
          content:
            'Rearrange and categorize these ingredients together by category. Assuming access to spice, staple ingredients (pasta noodles, rice, sugar, salt, etc.), create a 5 day high-protein meal plan with the given ingredients. Include snack/desert options at the end. Suggest ingredients that may be missing from the grocery list. Format: Only output in HTML format, assuming the response content will be directly inserted into a div. Do not include ```html before/after the response. Ingredients:' +
            ingredients,
        },
      ],
    })
    return response
  } catch (error) {
    console.log('Failed to creat emeal plan: ' + error.message)
  }
  return
}

app.get('/email-grocery-list', async (req, res) => {
  console.log('Grocery list requested')
  getItems(async (err, items) => {
    if (err) {
      // Handle error
      console.error('Failed to load items:', err.message)
      res.status(500).json({ success: false, message: 'Failed to load items' })
    } else {
      try {
        const ingredients = items.map((obj) => obj.item).join(', ')

        // Set up transporter
        let transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL,
            pass: process.env.PASS,
          },
        })

        getMealPlan((err, data) => {
          if (err) {
            console.log('Err getting meal plan: ', err)
          } else {
            // Email options
            let mailOptions = {
              from: 'process.env.EMAIL', // Sender address
              to: process.env.EMAIL_RECIPENTS, // List of recipients
              subject: 'Grocery List', // Subject line
              text: `Here is your grocery list: ${ingredients}   ${data}`, // Plain text body
              html: `<p>Here is your grocery list: <br><br><b>${ingredients}</b> <br><br>${data}</p>`, // HTML body content
            }

            // Send email
            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                console.log('Error sending email:', error)
                res
                  .status(500)
                  .json({ success: false, message: 'Failed to send email' })
              } else {
                console.log('Email sent: ' + info.response)
                res.json({ success: true, message: 'Email sent successfully' })
              }
            })
          }
        })
      } catch (error) {
        console.error('Failed to create email:', error.message)
        res
          .status(500)
          .json({ success: false, message: 'Failed to process items' })
      }
    }
  })
})

app.get('/clear-all', async (req, res) => {
  console.log('Clearing all items.')
  fs.writeFileSync('items.json', '[]')
  res.json({ success: true })
})
