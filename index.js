const express = require('express');
const socket = require('socket.io');
const {join} = require('path');

const app = express();
const messages = [];

app.set('port', 3000);

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'main.html'));
});

const server = app.listen(app.get('port'), ()=>console.log(`Server listening pn port ${app.get('port')}`));

const io = require('socket.io')(server);
const activeUsers = new Set();

io.on('connection', (socket) => {
  socket.on('new user', (data) => {
    socket.userId = data;
    activeUsers.add(data);
    socket.emit('load old messages', messages);
    io.emit('new user', [...activeUsers]);
  });

  socket.on('chat message', data => {
    messages.push(data);
    io.emit('chat message', data);
  });

  socket.on('chat command', data => {
    var command = data.command.split(/\s+/);
    var args = command.slice(1,command.length);
    args = args.filter(arg => arg);
    command = command[0];
    switch (command) {
      case 'help':
        socket.emit('chat message', {
          message: 'Ayuda de comandos:<br>'+
          '/help: Muestra la lista de comandos<br>'+
          '/clear: Borra todos los mensajes anteriores<br>'+
          '/link <url> [mensaje]: Envia un link<br>',
          nick: 'Server'
        });
        break;
      case 'clear':
        messages.length=0;
        io.emit('load old messages', messages);
        break;
      case 'link':
        if (!args[0]) {
          socket.emit('chat message', {
            message: 'Faltan argumentos<br>Sintaxis correcta: /link &lt;url&gt; [mensaje]',
            nick: 'Server'
          });
          break;
        }
        var url = args[0];
        if (!url.includes("https://") && !url.includes("http://")) {
          url = 'http://' + url;
        }
        let message = "";
        for (let i = 1; i<args.length; i++) {
          message += args[i] + " ";
        }
        io.emit('chat message', {
          message: `<a class="message__link" href="${url}" target="_blank">${args[0]}</a><br>` + message,
          nick: data.nick
        });

      default:
        break;
    }
  });

  socket.on('disconnect', () => {
    activeUsers.delete(socket.userId);
    io.emit('user disconnected', socket.userId);
  });
});

app.use(express.static(join(__dirname, 'public')));