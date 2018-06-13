document.onreadystatechange = function() {
    if (document.readyState == 'interactive') {
        var url = "ws://" + document.location.host + "/ws";
        var container = document.createElement('div');
        container.className = 'terminal';
        document.body.appendChild(container);

        hterm.defaultStorage = new lib.Storage.Memory();
        var t = new hterm.Terminal();

        t.onTerminalReady = function () {
            t.io.push();
            console.log("Connecting to " + url);
            var ws = new WebSocket(url, ["text"]);

            ws.onmessage = function (e) {
                console.log(e);
                t.io.println(e.data);
            }
        }
        t.decorate(container);
    }
}
