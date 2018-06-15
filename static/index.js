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
            var lines = 25;
            var columns = 80;

            t.io.onTerminalResize = function(w, h) {
                console.log(w, h);
                resetWindowSize();
            }

            resetWindowSize = function () {
                t.io.print('\033[8;' + String(lines) + ';' + String(columns) + 't');
            }

            setWindowSize = function(w, h) {
                lines = h;
                columns = w;
                resetWindowSize();
            }

            ws.onmessage = function (e) {
                var cmd = e.data[0];
                var arg = e.data.substr(1);
                switch (cmd) {
                    case "=":
                        t.io.print(arg);
                        break;
                    case "G":
                        var re = /^([0-9]+)x([0-9]+)$/;
                        var match = arg.match(re);
                        setWindowSize(Number(match[1]), Number(match[2]));
                        break;
                    default:
                        console.warn("Invalid command: ", cmd, "with argument", arg);
                        break;
                }
            }
        }
        t.decorate(container);
    }
}
