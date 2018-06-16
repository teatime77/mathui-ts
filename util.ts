var timerId = null;
var timerIntervals = [];

var iterator;

function isAlpha(c) : boolean {
    return 'a' <= c && c <= 'z' || 'A' <= c && c <= 'Z';
}

function timerFnc(){
    if(iterator.next().done){
        // ジェネレータが終了した場合

        clearInterval(timerId);
        console.log("ジェネレータ 終了");
    }
}

function makeMath(tag) : HTMLElement{
    return document.createElementNS("http://www.w3.org/1998/Math/MathML", tag) as HTMLElement;
}

function mmlDiv2(term: Term){
    var m = makeMath("math");
    m.innerHTML = term.mathML();

    var div = document.createElement("div");
    div.appendChild(m);
    div["mathui"] = term;
    document.body.appendChild(div);

    return div;
}

function element(id) : HTMLElement{
    return document.getElementById(id);
}

function pushInterval(interval){
    if(timerId != null){

        clearInterval(timerId);
    }

    timerIntervals.push(interval);
    timerId = setInterval(timerFnc, interval);
}

function popInterval(){
    timerIntervals.pop();
    clearInterval(timerId);
    
    var interval = timerIntervals[timerIntervals.length - 1];
    timerId = setInterval(timerFnc, interval);
}

function* moveTo2(src_id, dst){
    var src = element(src_id);
    var src_root;
    for(var nd : HTMLElement = src; ; nd = nd.parentNode as HTMLElement){
        if(nd["mathui"] != undefined){

            src_root = nd["mathui"];
            break;
        }
    }
    var src_term = src_root.findById(src_id);
    var src_term_copy = src_term.clone(null);
    var div = mmlDiv2(src_term_copy);

    var src_rc = src.getBoundingClientRect() as ClientRect;

    var rc1 = dst.getBoundingClientRect() as ClientRect;

//        var div = src.cloneNode(true);
    div.style.position = "absolute";
    div.style.left = src_rc.left + "px";
    div.style.top  = src_rc.top + "px";
    div.style.width  = src_rc.width + "px";
    div.style.height  = src_rc.height + "px";
    
    document.body.appendChild(div);
//        yield;
    var rc2 = div.getBoundingClientRect() as ClientRect;

    var sc = Math.max(rc1.width / rc2.width, rc1.height / rc2.height);

    // 移動先の中心
    var cx1 = rc1.left + rc1.width / 2;
    var cy1 = rc1.top + rc1.height / 2;

    // 移動元の中心
    var cx2 = rc2.left + rc2.width / 2;
    var cy2 = rc2.top + rc2.height / 2;

    // 移動元のサイズ
    var w2 = rc2.width;
    var h2 = rc2.height;

    // 平行移動の差分
    var dx = (cx1 - cx2) / 100;
    var dy = (cy1 - cy2) / 100;

    // サイズ変更の差分
    var ds = (sc - 1) / 100;

    pushInterval(10);
    for(var i = 0; i < 100; i++){

        var r = 1 + i * ds;

        div.style.transform = "scale(" + r + "," + r + ")";

        div.style.left = (cx2 + i * dx - w2/2) + "px";
        div.style.top  = (cy2 + i * dy - h2/2) + "px";

        yield;
    }
    div.parentNode.removeChild(div);
    popInterval();
}
