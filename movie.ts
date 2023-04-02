var katex : any;

namespace MathUI {
    var iterator;
    var timerId : number;

    class Test {
        n:number

        public constructor(n:number){
            this.n = n
        }

        public getN(){
            return this.n;
        }
    }

    class Timer {
        timerIntervals:number[]
        timerFncs:(()=>void)[]
        timerId : number = null

        pushInterval(timer_fnc:()=>void, interval: number){
            if(this.timerId != null){
        
                clearInterval(this.timerId);
            }
        
            this.timerIntervals.push(interval);
            this.timerFncs.push(timer_fnc)
            this.timerId = setInterval(timer_fnc, interval);
        }
        
        popInterval(){
            this.timerIntervals.pop();
            this.timerFncs.pop()
            clearInterval(this.timerId);
            
            var interval = last(this.timerIntervals);
            var timer_fnc = last(this.timerFncs)
            this.timerId = setInterval(timer_fnc, interval);
        }        
    }

    export function hello(){
        console.log("hello\n");
    }
    function* generator(){
        var lex = new Lex();
        var parser = new Parser();
        metaTerms = [];
        var terms : Term[] = [];
        var prev_term : Term = undefined;

        for(var line of (element("mul-dif") as HTMLTextAreaElement).value.split('\n')){

            line = line.trim();
            if(line == ""){
    
                yield;
                continue;
            }
            if(line[0] == '$'){
            }
            else if(line[0] == '#'){
            }           
            else{
                var stmt = parseTerm(line);
                stmt.setDisplayText();

                terms.push(stmt);

                var clone_terms: Term[] = [];
                if(stmt.isFncRefApp("rep")){

                    var app = stmt as Apply;

                    var eq_terms : Term[] = [];
                    SymbolicComputation.FindTerm(prev_term, app.args[0], eq_terms);
    
    
                    var prev_term_copy = prev_term.clone();
                    SymbolicComputation.ReplaceTerm(prev_term_copy, app.args[0], app.args[1], clone_terms);
                    stmt = prev_term_copy;
                }

                prev_term = stmt;

                console.log(`[${line}] [${stmt.tex()}]`)

                let div1 = document.createElement("div");
                document.body.appendChild(div1);

                var t = stmt.Tex();
                var str = t.listTex().join(" ");
                msg(str);
                render(div1, str);
                yield;


                let div2 = document.createElement("div");
                document.body.appendChild(div2);

                for(const seq of t.genTex()){
                    var str = seq.join(" ");
                    msg(str);
                    render(div2, str);    
                    yield;
                }                

                targetNode = t.findByMetaId("#1.1");
                if(targetNode != null){

                    let div3 = document.createElement("div");
                    document.body.appendChild(div3);

                    genNode = targetNode.genTex();
                    while(true){
                        var str = t.listTex().join(" ");
                        msg(str);
                        render(div3, str);

                        if(genNext.done){
                            break;
                        }
                        yield;
                    }                
                }

                document.body.appendChild(document.createElement("hr"));
            }    
        }
    }

    function render(ele: HTMLElement, tex_text: string){
        katex.render(tex_text, ele, {
            throwOnError: false
            });    
    }

    // var sss = `<?xml version="1.0"?><speak version="1.1">Go from <mark name="here"/> here, to <mark name="there"/> there!</speak>`;
    var sss = 'Hello. This is a pen.';

    function timerFnc(){
        // speech.speak(sss);
        if(iterator.next().done){
            // ジェネレータが終了した場合
    
            clearInterval(timerId);
            console.log("ジェネレータ 終了");
        }
    }
    
    export function bodyOnLoad(){
        initSpeech();
        let ele = document.getElementById("d1");
    
        katex.render("c = \\pm\\sqrt{a^2 + b^2}", ele, {
        throwOnError: false
        });

        let a = new Test(1);
        let b = new Test(10);

        var A = a.getN.bind(a);
        var B = b.getN.bind(b);

        console.log(`A:${A()} B:${B()}\n`);

        iterator = generator();

        const interval = parseInt((element("interval") as HTMLInputElement).value);
        timerId = setInterval(timerFnc, interval);
    }


    let voiceList: string[]|null = null;
    const voiceName = "Microsoft Zira - English (United States)";   // "Google US English";    // "Google 日本語";
    const voiceLang = "en-US";
    let jpVoice : SpeechSynthesisVoice|null = null;
        
    function setVoice(){
        const voices = speechSynthesis.getVoices()
        voiceList = [];
        voices.forEach(voice => { //　アロー関数 (ES6)
            msg(`${voice.lang} [${voice.name}] ${voice.default} ${voice.localService} ${voice.voiceURI}`);
    
    
            if(voice.name == voiceName){
                msg(`set ${voiceLang} voice[${voice.name}]`);
                jpVoice = voice;
            }
            if(jpVoice == null && voice.lang == voiceLang){
                msg(`set ${voiceLang} voice[${voice.name}]`);
                jpVoice = voice;
            }
            voiceList!.push(voice.name);
        });
    }
    
    class Speech {
        text : string;
        charIndex : number;

        speak(speech : string){
            this.text = speech;
            this.charIndex = 0;

            msg(`speak:[${speech}]`)
            const uttr = new SpeechSynthesisUtterance(speech);
        
            if(jpVoice != null){
                uttr.voice = jpVoice;
            }

            // uttr.addEventListener("mark", (event) => {
            //     console.log(`A mark was reached: ${event.name}`);
            // });

            uttr.onmark = (event) => {
                console.log(`A mark was reached: ${event.name}`);
            };            

            uttr.onboundary = (event : SpeechSynthesisEvent) => {
                console.log(
                  `${event.name} ${event.charIndex} boundary ${this.text.substring(this.charIndex, event.charIndex)} reached after ${event.elapsedTime} seconds.`
                );

                this.charIndex = event.charIndex;
            };

            speechSynthesis.speak(uttr);
        }
    }

    var speech = new Speech();
        
    function initSpeech(){
        if ('speechSynthesis' in window) {
            msg("このブラウザは音声合成に対応しています。🎉");
        }
        else {
            msg("このブラウザは音声合成に対応していません。😭");
        }    
    
        speechSynthesis.onvoiceschanged = function(){
            msg("voices changed");
            setVoice();
        };
    }
        


}