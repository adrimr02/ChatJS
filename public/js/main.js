const socket = io();

const inboxPeople = document.querySelector(".inbox__people");
const inputField = document.querySelector(".message__form__input");
const messageForm = document.querySelector(".message__form");
const messageBox = document.querySelector(".messages__history");


let userName = prompt("Escribe tu nombre") || `User${Math.floor(Math.random() * 1000000)}`;

const newUserConnected = () => {
  socket.emit('new user', userName);
  addToUsersBox(userName);
}

const addToUsersBox = (username) => {
  if (!!document.querySelector(`.${username}-userlist`)) {
    return;
  }

  const userBox = `
    <div class="chat_ib ${username}-userlist">
      <h5 class="user_name">${username===userName ? "Tú" : username}</h5>
    </div>
  `

  inboxPeople.innerHTML += userBox;
}

const addNewMessage = ({ user, message }) => {
  const time = new Date();
  const formattedTime = time.toLocaleDateString("es-ES", { hour: 'numeric', minute: 'numeric' });

  const receivedMsg = `
  <div class="incoming__message">
    <div class="received__message">
      <p class="message__text">${message}</p>
      <div class="message__info">
        <span class="message__author">${user}</span>
        <span class="time_date">${formattedTime}</span>
      </div>
    </div>
  </div>`;

  const myMsg = `
  <div class="outgoing__message">
    <div class="sent__message">
      <p class="message__text">${message}</p>
      <div class="message__info">
        <span class="time_date">${formattedTime}</span>
      </div>
    </div>
  </div>`;

  messageBox.innerHTML += user === userName ? myMsg : receivedMsg;

}

messageForm.addEventListener('submit', e => {
  e.preventDefault();
  if (!inputField.value) {
    return
  }

  if (inputField.value.charAt(0) === '/') {
    socket.emit('chat command', {
      command: inputField.value.substring(1),
      nick: userName
    });
  } else {
    socket.emit('chat message', {
      message: inputField.value,
      nick: userName
    });
  }

  inputField.value = "";
});

newUserConnected()

socket.on('load old messages', messages => {
  messageBox.innerHTML = '';
  messages.map(data => addNewMessage({ user: data.nick, message: data.message }));
});

socket.on('new user', (data) => {
  data.map(user => addToUsersBox(user));
});

socket.on('user disconnected', user => {
  document.querySelector(`.${user}-userlist`).remove();
});

socket.on('chat message', data => {
  addNewMessage({ user: data.nick, message: data.message });
});