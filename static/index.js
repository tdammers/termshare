document.onreadystatechange = function() {
    if (document.readyState == 'interactive') {
        var url = "ws://" + document.location.host + "/ws";

        var container = document.createElement('div');
        container.className = 'terminal';
        document.body.appendChild(container);

        var stat = document.createElement('div');
        stat.className = 'status';
        document.body.appendChild(stat);

        hterm.defaultStorage = new lib.Storage.Memory();
        var t = new hterm.Terminal();


        t.onTerminalReady = function () {
            t.io.push();
            console.log("Connecting to " + url);
            var ws = new WebSocket(url, ["text"]);

            t.io.onTerminalResize = function(w, h) {
                console.log(w, h);
            }

            setWindowSize = function(w, h) {
                t.io.print('\033[8;' + String(h) + ';' + String(w) + 't');
            }

            setInterval(function(){
                    stat.textContent =
                        t.screen_.getWidth() + "x" + t.screen_.getHeight();
                }, 500);

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
