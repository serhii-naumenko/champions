import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js'
import {
  getDatabase,
  ref,
  push,
  onValue,
  update
} from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-database.js'

const registeredUsers = [
  'ShadowWolf',
  'DreamCatcher',
  'SilverSword',
  'StarDust',
  'CrimsonRose',
  'Thunderstrike'
]

const appFirebaseSettings = {
  databaseURL: 'https://champions-dc44c-default-rtdb.europe-west1.firebasedatabase.app/'
}

const app = initializeApp(appFirebaseSettings)
const database = getDatabase(app)
const messagesInDB = ref(database, 'messages')

const selectEl = document.getElementById('select')
const textareaEl = document.getElementById('textarea')
const authorEl = document.getElementById('author')
const recipientEl = document.getElementById('recipient')
const publishEl = document.getElementById('publish')
const messageListEl = document.getElementById('message-list')

let currentAuthor = ''
let messagesList = []

onValue(messagesInDB, function(snapshot) {
  if (snapshot.exists()) {
    messageListEl.innerHTML = ''
    const messages = Object
      .entries(snapshot.val())
      .sort((mes1, mes2) => mes2[1].created - mes1[1].created)
    messagesList = messages
    messages.forEach(message => renderMessage(message))
  } else {
    messageListEl.innerHTML = "No messages here... yet"
  }
})

registeredUsers.forEach(user => {
  const newEl = `<option value=${user}>${user}</option>`
  selectEl.innerHTML += newEl
})

selectEl.addEventListener('change', function() {
  authorEl.value = selectEl.value
  currentAuthor = selectEl.value
  checkMessageParameters()
  messageListEl.innerHTML = ''
  messagesList.forEach(messageFromList => renderMessage(messageFromList))
})

recipientEl.addEventListener('input', function() {
  checkMessageParameters()
})

textareaEl.addEventListener('input', function() {
  checkMessageParameters()
})

publishEl.addEventListener('click', function() {
  const newMessage = {
    author: authorEl.value,
    recipient: recipientEl.value,
    text: textareaEl.value,
    created: new Date().getTime(),
    likeAmount: 0,
    whoLiked: [authorEl.value],
  }

  push(messagesInDB, newMessage)
  recipientEl.value = ''
  textareaEl.value = ''
  publishEl.disabled = true
})

function checkMessageParameters() {
  if (authorEl.value && recipientEl.value && textareaEl.value) {
    publishEl.disabled = false
  } else {
    publishEl.disabled = true
  }
}

function renderMessage(message) {
  const {author, recipient, text, created, likeAmount, whoLiked} = message[1]
  const newMessageEl = document.createElement('li')
  newMessageEl.setAttribute('class', 'message-item')
  newMessageEl.innerHTML = `
    <h4 class="message-side message-recipient">
      To ${recipient}
    </h4>
    <p class="message-text">
      ${text}
    </p>
    <div class="like-container">
      <h4 class="message-side">
        From ${author}
      </h4>
      <p class="like" id="like-${created}">
        <span
          class="${currentAuthor !== author && whoLiked.includes(currentAuthor)
            ? 'like-purple'
            : 'like-black'}"
        >
          ❤️
        </span> ${likeAmount}
      </p>
    </div>
  `
  newMessageEl.addEventListener('click', function(event) {
    const target = event.target
    if (target.classList.contains('like') || target.tagName === 'SPAN') {
      if (currentAuthor && currentAuthor !== author) {
        const ind = whoLiked.indexOf(currentAuthor)
        let newLikeAmount = likeAmount
        let newWhoLiked = [...whoLiked]
        if (ind >= 0) {
          newLikeAmount -= 1
          newWhoLiked.splice(ind, 1)
        } else {
          newLikeAmount += 1,
          newWhoLiked.push(currentAuthor)
        }
        const updates = {
          likeAmount: newLikeAmount,
          whoLiked: newWhoLiked,
        }
        const exactMessageInDB = ref(database, `messages/${message[0]}`)
        update(exactMessageInDB, updates)
      }
    }
  })

  messageListEl.append(newMessageEl)
}
