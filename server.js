//モジュール読み込み
const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const config = require('config')
let users = {};

//静的ファイル有効
app.use(express.static(__dirname + '/public'))

app.get('/', (req, res) => {
    res.render('index.ejs')
})

logout = (socket) => {
    console.log("logout");

    let user = fetchUser(socket);
    if (!user) return;

    // ユーザ削除
    delete users[socket.id];

    // 送信元以外全てのクライアントに送信
    socket.broadcast.emit("user_left", {
        username: user.name,
        users: users,
    })
}

fetchUser = (socket) => {
    if (!users) return;
    return users[socket.id];
}

generateToken = () => {
    let token = Math.random().toString(32).substring(2);
    return token;
}

//connection イベント
io.on('connection', (socket) => {
    //socket.id の確認
    console.log('connection');
    console.log(socket.id);

    // client から server のメッセージ
    socket.on('client_to_server', (data) => {
        // server からclient へのメッセージ
        data.datetime = new Date();
        console.log(data);

        // 全てのクライアントにデータ送信
        io.emit("server_to_client", data);
    })

    //ログイン処理
    socket.on('login', (user) => {
        //user.isConnect = true なら終了
        if (user.isConnect) return;
        user.isConnect = true;

        //トークン発行
        user.token = generateToken();

        //Socket ID をキーに user を users 配列に登録
        users[socket.id] = user;

        //クライアントに返すdata の作成
        let data = { user: user, users: users};
        console.log(user);

        //送信元の「logined」に、データ送信 emit()
        socket.emit("logined", data);

        //送信元以外全てのクライアントの「user_joined」にデータ送信（ブロードキャスト）
        socket.broadcast.emit("user_joined", data);
    });

    //スタンプ送受信
    socket.on('sendStamp', (data) => {
        data.datetime = new Date();
        console.log("sendStamp");
        io.emit("loadStamp", data);
    });

    //ユーザ一覧
    socket.on('userList', () => {
        //送信元の show_users に users をデータ送信
    });

    //ログアウト
    socket.on('logout', () => {
        logout(socket);
    });
    
    //切断
    socket.on('disconnect', () => {
        console.log('disconnect');
        logout(socket);
    });

});

const port = config.server.port;
const host = config.server.host;
http.listen(port, host, () => {
    console.log(`listening on http://${host}:${port}`)
})