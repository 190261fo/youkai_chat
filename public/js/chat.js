//const url = 'http://localhost:3000';
const url = '';
const chatArea = $('#chatArea');
const loginArea = $('#loginArea');
const message = $('#message');
const myChatList = $('#myChatList');
const userList = $('#userList');
const inputName = $('#inputName');
const iconList = $('#iconList');
const stampList = $('#stampList');
const userName = $('.userName');
const userNumber = $('.userNumber');
const FADE_TIME = 500;
const USER_ICON_SIZE = 32;
const STAMP_WIDTH = 125;
let user = {};
let users = {};

//初期設定
$(() => {
    imagePath = (fileName) => {
        let path = 'images/' + fileName;
        return path;
    }
    addMessage = (value) => {
        if (!value) return;
        let messageElement = $('<small>').addClass('text-muted').text(value);
        myChatList.prepend(messageElement);
    }
    updateUserList = () => {
        console.log(users);
        if (!users) return;
        userList.html('');
        $.each(users, function (key, user) {
            let img = $('<img>').attr({ 'src': imagePath(user.icon), 'width': USER_ICON_SIZE });
            let li = $('<li>').addClass('list-group-item').append(img).append(user.name);
            userList.append(li);
        });

        updateUserNumber = () => {
            let number = Object.keys(users).length;
            if (!number) return;
            userNumber.text(number);
        }
        updateUserNumber();
    }
    createIcons = () => {
        const icons = [...Array(6).keys()].map(i => `${++i}.png`);
        icons.forEach((icon, index) => {
            index++;

            let id = 'icon_' + index;
            let label = $('<label>').attr({ 'for': id });
            let input = $('<input>').attr({
                'id': id,
                'name': 'icon',
                'type': 'radio',
                'value': icon,
            });
            if (index == 1) input.attr({ checked: 'checked' });
            let img = $('<img>').attr({ 'src': imagePath(icon), 'width': USER_ICON_SIZE });

            label.append([input, img]);
            iconList.append(label);
        })
    }
    createStamps = () => {
        const stamps = [...Array(6).keys()].map(i => `stamp${++i}.png`);
        stamps.forEach((stamp, index) => {
            index++;
            let imageId = 'stamp_' + index;
            let a = $('<a>').attr({ 'stamp': imageId, 'class': 'sendStamp' });
            let img = $('<img>').attr({'id': imageId, 'src': imagePath(stamp), 'width': 100 });
            a.append(img);
            stampList.append(a);
        })
    }
    createHeaderElement = (data, isToken) => {
        let dateStyle = (isToken) ? 'p-3 text-primary' : 'p-1 text-dark';
        let userStyle = (isToken) ? 'text-right' : 'text-left';
        let img = $('<img>').attr({ 'src': imagePath(data.user.icon), 'width': USER_ICON_SIZE });
        let userElement = $('<small>').addClass(dateStyle).append(img).append(data.user.name);
        let headerElement = $('<p>').addClass(userStyle).append([userElement]);
        return headerElement;
    }
    createFooterElement = (data) => {
        const date_string = new Date(data.datetime).toLocaleString('ja-JP');
        let dateElement = $('<small>').addClass('text-dark').html(date_string);
        let footerElement = $('<div>').addClass('text-right').append(dateElement);
        return footerElement;
    }
    createMessageElemet = (data, isToken) => {
        let chatStyle = (isToken) ? 'p-3 balloon-right' : 'p-3 balloon-left';
        let message = data.message.replace(/\r?\n/g, '<br>');
        let messageElement = $('<div>').addClass(chatStyle).html(message);
        return messageElement;
    }
    createChatMessage = (data) => {
        if (!user.token) return;
        console.log(data);

        let isToken = hasToken(data);
        let headerElement = createHeaderElement(data, isToken);
        let messageElement = createMessageElemet(data, isToken);
        let footerElement = createFooterElement(data);
        let chatElement = $('<div>').hide().append([headerElement, messageElement, footerElement]);

        myChatList.prepend(chatElement);
        chatElement.fadeIn(FADE_TIME);
    }
    createChatStamp = (data) => {
        if (!user.token) return;
        console.log(data);

        let isToken = hasToken(data);
        let headerElement = createHeaderElement(data, isToken);
        let img = $('<img>').attr('src', data.image).attr('width', STAMP_WIDTH);
        let messageElement = $('<div>').append(img);
        let footerElement = createFooterElement(data);
        let chatElement = $('<div>').hide().append([headerElement, messageElement, footerElement]);

        myChatList.prepend(chatElement);
        chatElement.fadeIn(FADE_TIME);
    }
    hasToken = (data) => {
        return (data.user.token == user.token);
    }
    init = () => {
        createIcons();
        createStamps();
        loginArea.hide();
        chatArea.hide();
        stampList.hide();
        loginArea.fadeIn(FADE_TIME);
    }

    //初期化
    init();

    //サーバー接続
    let socket = io.connect(url);

    //接続
    socket.on('connect', () => {
        // socket.id 等をログで確認
        console.log('connect');
        console.log(socket.id);
        console.log(socket.connected);
    });

    //切断
    socket.on('disconnect', (reason) => {
        console.log('disconnect');
    });

    // server から client へメッセージ
    socket.on('server_to_client', (data) => {
        console.log('server_to_client');
        createChatMessage(data);
    });

    // server から login 情報取得
    socket.on('logined', (data) => {
        console.log("logined");

        if (data.user) {
            user = data.user;
            users = data.users;

            // ユーザ名を表示
            userName.text(user.name);
            // ユーザ一覧を更新
            updateUserList();
        }
    });

    // login 情報（ブロードキャスト）
    socket.on('user_joined', (data) => {
        console.log("user_joined");

        if (data.user && data.users) {
            // let message = data.user.name + " joined.";
            let message = data.user.name + " さんが入室しました。";
            addMessage(message);

            users = data.users;
            updateUserList();
        }
    });

    // ログアウト受信（ブロードキャスト）
    socket.on('user_left', (data) => {
        console.log("user_left");

        // let message = data.username + " logout.";
        let message = data.username + " さんが退室しました。";
        addMessage(message);

        users = data.users;
        updateUserList();
    });

    // スタンプ読み込み
    socket.on('loadStamp', (data) => {
        console.log("loadstamp");
        createChatStamp(data);
    });

    // ユーザ一覧
    socket.on('show_users', (data) => {
        console.log('show_users');

        users = data.users;
        updateUserList();
    });

    // client からの server へメッセージ
    // send クリック
    $('#send').on('click', () => {
        // userトークンチェック
        if (!user.token) return;
        if (!message.val()) return;

        // データ作成
        let data = {
            message: message.val(),
            user: user,
        }

        // client_to_server にデータ送信
        socket.emit("client_to_server", data);
        message.val("");
    });

    // サーバーへ login
    // id=login のElementをクリックしたら
    $('#login').on('click', () => {
        let user = {}

        // username 入力チェック
        if (inputName.val()) {
            // ログイン表示画面を隠す
            loginArea.hide();
            // チャット画面を表示
            chatArea.fadeIn(FADE_TIME);
        }

        // username 取得＆設定(ユーザ情報作成)
        user.name = inputName.val();
        user.icon = $("input[name=icon]:checked").val();

        // ユーザ情報送信
        socket.emit("login", user);
        console.log(user);
    });

    // スタンプメニュー切り替え
    $('.stamp').on('click', () => {
        stampList.toggle();
    });

    //画像を base64 に変換してサーバにユーザ情報とともに送信
    $('.sendStamp').on('click', (event) => {
        const mime_type = "image/png";
        const image = new Image();
        image.src = $(event.target).attr("src");
        image.onload = function(event) {
            console.log(event);
            const canvas = document.createElement("canvas");
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(image, 0, 0);
            let base64 = canvas.toDataURL(mime_type);
            let data = { user: user, image: base64 };
            socket.emit("sendStamp", data)
            stampList.toggle();
        }
    });

    //ログアウト処理
    $('#logout').on('click', () => {
        console.log("logout");

        // サーバのlogout に送信
        socket.emit("logout");
        user = {};
        chatArea.fadeOut(FADE_TIME);
        loginArea.fadeIn(FADE_TIME);
    });

})