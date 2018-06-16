declare var MathJax:any;

var timerId = null;
var timerIntervals = [];

var iterator;

var typeset_done = false;


var currentParser : Parser;

function parse(text: string)  {
    currentParser.initParse(currentLex.lexicalAnalysis(text));
    return currentParser.readStatement();
}

function parseTerm(text: string) : Term {
    currentParser.initParse(currentLex.lexicalAnalysis(text));
    return currentParser.readPredicate();
}

function makeDiv(inner_text){
    var div = document.createElement("div");
    div.innerText = inner_text;
    document.body.appendChild(div);

    return div;
}

function mmlDiv(s) : HTMLDivElement {
    var m = makeMath("math");
    m.innerHTML = s;

    var div = document.createElement("div");
    div.appendChild(m);
    document.body.appendChild(div);

    return div;
}

function hr(){
    document.body.appendChild(document.createElement("hr"));
}


function waitTypeset(){
    typeset_done = false;
    MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
    MathJax.Hub.Queue(function(){
        typeset_done = true;
    });
}

function setColor(color, ...ids){
    for(let id of ids){
        element(id).style.color = color;
    }
}

var mathUIStack = [];

function remove(idx){
    if(idx < 0){
        idx += mathUIStack.length;
    }
    var div = mathUIStack[idx];
    div.parentNode.removeChild(div);
}

function msg(txt){
    var span = document.createElement("span");
    span.innerText = txt;
    document.body.appendChild(span);
    document.body.appendChild(document.createElement("br"));
}

function* scaleUp(div){
    var r = 0.01;
    pushInterval(1);
    for(var i = 0; i < 100; i++){

        r += 0.01;

        div.style.transform = "scale(" + r + "," + r + ")";

        yield;
    }
    popInterval();
}

function* moveDivTo(src, dst){
    var src_rc = src.getBoundingClientRect();

    var rc1 = dst.getBoundingClientRect();

    var div = src.cloneNode(true);
//        var style = window.getComputedStyle(src);
    div.style.position = "absolute";
    div.style.left = src_rc.x + "px";
    div.style.top  = src_rc.y + "px";
//        div.style.width  = style.width;
//        div.style.height  = style.height;
    
    document.body.appendChild(div);
    yield;
    var rc2 = div.getBoundingClientRect();

    var sc = Math.max(rc1.width / rc2.width, rc1.height / rc2.height);

    // 移動先の中心
    var cx1 = rc1.x + rc1.width / 2;
    var cy1 = rc1.y + rc1.height / 2;

    // 移動元の中心
    var cx2 = rc2.x + rc2.width / 2;
    var cy2 = rc2.y + rc2.height / 2;

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

function* generator(){

    var lex = new Lex();
    var parser = new Parser();

    // 積の微分
    pushInterval(1000);
    for(var line of (element("mul-dif") as HTMLTextAreaElement).value.split('\n')){
        line = line.trim();
        if(line == ""){

            yield;
            continue;
        }
        if(line[0] == '$'){
            eval(line.substring(1).trim());
        }
        else if(line[0] == '#'){
            pushInterval(3000);
            for(waitTypeset(); ! typeset_done; yield);
            popInterval();
            
            var ids = line.split("-");
            for(var it = moveTo2(ids[0].trim(), element(ids[1].trim())); ! it.next().done; yield);
        }           
        else{

            var stmt = parseTerm(line);
            stmt.setDisplayText();
            if(stmt.toString() + ";" != line){
                console.log("A:", stmt.toString());
                console.log("B:", line);
            }

            var div = mmlDiv2( stmt );
            div.style.transform = "scale(0.01, 0.01)";

            mathUIStack.push(div);
            pushInterval(1);
            for(waitTypeset(); ! typeset_done; yield);
            popInterval();

            for(var it = scaleUp(div); ! it.next().done; yield);
            
        }
    }
    popInterval();

    var token_list = lex.lexicalAnalysis( (element("math-txt") as HTMLTextAreaElement).value );
    var stmt_list = parser.parse(token_list);

    var sc = new SymbolicComputation();
    var t0 = stmt_list[0] as Term;
    var t1 = t0.clone();
    var uv = parseTerm("u+v;");

    // x -> u + v
    t1.setDisplayText();
    sc.SubstByName(t1, "x", uv);
    var t1_div = mmlDiv2(t1);
    hr();
    for(waitTypeset(); ! typeset_done; yield);
    console.log("x -> u + v");

    // f -> g
    var t2 = t0.clone();
    t2.setDisplayText();
    sc.SubstByName(t2, "f", new Reference("g"));
    mmlDiv2(t2);
    hr();
    for(waitTypeset(); ! typeset_done; yield);
    console.log("f -> g");

    // f -> u + v
    var t3 = t0.clone();
    t3.setDisplayText();
    sc.SubstByName(t3, "f", uv);
    mmlDiv2(t3);
    hr();
    for(waitTypeset(); ! typeset_done; yield);
    console.log("f -> u + v");


    // u + v -> F * G
    var FG = parseTerm("F * G;");
    var t4 = t3.clone();
    t4.setDisplayText();
    sc.ReplaceTerm(t4, uv, FG);
    mmlDiv2(t4);
    hr();

    for(waitTypeset(); ! typeset_done; yield);
    console.log("");

    var refs = sc.RefsByName(t4, "x");
    console.log(refs.map(x => element(x.id)));
    for(let e of refs.map(x => element(x.id))){
        e.style.color = "red";
    }
    for(var it = moveDivTo(t1_div, element(refs[0].id)); ! it.next().done; yield);
    yield;

    var src = mmlDiv((element("src-txt") as HTMLTextAreaElement).value);
    src.style.transform = "scale(1,1)";
    hr();
    for(waitTypeset(); ! typeset_done; yield);
    console.log("src-txt");

    var dst = mmlDiv((element("dst-txt") as HTMLTextAreaElement).value);
    hr();
    for(waitTypeset(); ! typeset_done; yield);
    console.log("dst-txt");

    for(var it = moveDivTo(src, element("x1")); ! it.next().done; yield);

    var text = stmt_list.map(x => x.mathML()).join("<mspace linebreak='newline' />");
    mmlDiv(text);
    hr();
    for(waitTypeset(); ! typeset_done; yield);
}

function startGenerator(){
    iterator = generator();

    pushInterval(1000);
}

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

function mmlDiv2(term: Term) : HTMLDivElement {
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
