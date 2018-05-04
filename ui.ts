var C_5 = 0.5;
var CurrentUI : ElementUI = null;
type MathComponent = string | Term | Statement | Variable | Class | ElementUI;

function joinMath(joint: MathComponent, args: MathComponent[]) : MathComponent[]{
    var v = [];

    for(let arg of args){
        if(arg != args[0]){
            v.push(joint);
        }
        v.push(arg);
    }

    return v;
}

function initDocument(){
    
    document.addEventListener('mouseenter', function( e ) {
        console.log("doc mouse enter ");
        if(e.target["data-ui"]){
            e.preventDefault();
            if(e.target instanceof SVGRectElement){
    
                e.target.setAttribute("stroke", "blue");
            }
            console.log("mouse enter " + e.target["data-ui"].text);
        }
    }, false);

    document.addEventListener('mouseleave', function( e ) {
        console.log("doc mouse leave ");
        if(e.target["data-ui"]){
            
            e.preventDefault();
            if(e.target instanceof SVGRectElement){

                e.target.setAttribute("stroke", "red");
            }
            console.log("mouse leave " + e.target["data-ui"].text);
        }
    }, false);
    
    document.addEventListener('mousemove', function( e ) {
        if(CurrentUI != null){

            var rc = document.getElementById("svg-div").getBoundingClientRect();            
            CurrentUI.draw(e.clientX - rc.left, e.clientY - rc.top);            
        }
        if(e.target instanceof Element && e.target["data-ui"]){

            var div : HTMLElement = document.getElementById("svg-div");
            var bcr = div.getBoundingClientRect();

            var ui: ElementUI = e.target["data-ui"];
            var ctx = ui.context;

            var bbox = ui.border.getBBox();
            var x = ui.border.getAttribute("x");
            var y = ui.border.getAttribute("y");
            console.log(`doc mouse move client:(${e.clientX} ${e.clientY}) div:(${bcr.left} ${bcr.top}) client-div:(${e.clientX - bcr.left} ${e.clientY - bcr.top}) box:(${bbox.x} ${bbox.y}) attr:(${x} ${y})` + e.target);
        }
    }, false);


    document.addEventListener('mousedown', function( e ) {
        if(e.target instanceof Element && e.target["data-ui"]){
            
            e.preventDefault();

            var ui: ElementUI = e.target["data-ui"];
            var ctx = ui.context;

            if(ctx.group != ctx.rootGroup){

                ctx.rootGroup.removeChild(ctx.group);
            }
            ctx.group = document.createElementNS("http://www.w3.org/2000/svg", "g");
            ctx.rootGroup.appendChild(ctx.group);

            var bbox = ui.border.getBBox();

            var rc = document.getElementById("svg-div").getBoundingClientRect();            

            CurrentUI = null;
            if(ui.tag instanceof Term){
                var t = ui.tag.clone(null);
                CurrentUI = t.makeUI(ctx);
            }
            else if(ui.tag instanceof Variable){
                var v = ui.tag.clone(null);
                CurrentUI = v.makeUI(ctx);
            }
            if(CurrentUI != null){

                CurrentUI.draw(e.clientX - rc.left, e.clientY - rc.top);
            }

            console.log("mouse down " + e.target["data-ui"].text);
            return false;
        }
    }, false);

    document.addEventListener('mouseup', function( e ) {
        if(e.target instanceof Element && e.target["data-ui"]){
            
            e.preventDefault();
            CurrentUI = null;
            console.log("mouse up " + e.target["data-ui"].text);
            return false;
        }
    }, false);

    document.addEventListener('contextmenu', function( e ) {
        if(e.target["data-ui"]){
            
            e.preventDefault();
            return false;
        }
    }, false);

}

class Transform {
    x : number;
    y : number;
    xscale: number;
    yscale: number;

    constructor(x : number, y : number, xscale: number, yscale: number){
        this.x  = x;
        this.y  = y;
        this.xscale  = xscale;
        this.yscale  = yscale;
    }

    apply(t: Transform) : Transform {
        return ;
    }
}


class ContextUI {
    rootGroup : SVGGElement;
    group : SVGGElement;
    rootUI: ElementUI;
    transforms : Transform[] = [ new Transform(0, 0, 1, 1) ];

    constructor(group : SVGGElement){
        this.rootGroup = group;
        this.group    = group;
    }

    currentTransform() : Transform {
        return this.transforms[this.transforms.length-1];
    }

    pushTransform(x : number, y : number, xscale: number, yscale: number){
        var t1 = this.currentTransform();
        var t2 = new Transform(t1.x + x, t1.y + y, t1.xscale * xscale, t1.yscale * yscale);
        this.transforms.push( t2 );

        return t2;
    }

    popTransform(){
        this.transforms.pop();
    }

    makeText(obj, str: string, font_family:string = "STIX2-Regular", transform: Transform = null){
        return new TextUI(obj, str, this, 16, font_family, transform);
    }

    draw(x: number, y:number){
        this.rootUI.draw(x, y);
    }

    sub(a: ElementUI){
    }

    sup(a: ElementUI){
    }

    subSup(a: ElementUI, b: ElementUI){
    }

    below(a: ElementUI){
    }

    above(a: ElementUI){
    }

    belowAbove(){
    }
}

class ElementUI {
    context : ContextUI;
    border  : SVGRectElement;
    tag;
    x       : number = 0;
    y       : number = 0;
    width   : number;
    height  : number;
    ascent  : number;
    descent : number;
    transform: Transform = null;

    constructor(tag, ctx: ContextUI){
        this.context = ctx;
        this.tag = tag;
    }

    setXY(x: number, y: number){
        this.x = x;
        this.y = y;
    }
    
    draw(offset_x: number, offset_y: number){
    }
}

class BlockUI extends ElementUI {
    children : ElementUI[] = new Array<ElementUI>();

    constructor(tag, ctx: ContextUI = null, args: MathComponent[] = null){
        super(tag, ctx);

        if(ctx != null){

            for(let arg of args){
                if(arg instanceof Term){

                    this.add(arg.makeUI(ctx));
                }
                else if(arg instanceof Statement){

                    this.add(arg.makeUI(ctx));
                }
                else if(arg instanceof Variable){

                    this.add(arg.makeUI(ctx));
                }
                else if(arg instanceof Class){

                    this.add(arg.makeUI(ctx));
                }
                else if(arg instanceof ElementUI){

                    this.add(arg);
                }
                else if(typeof(arg) == "string"){

                    this.add(ctx.makeText(tag, arg, "STIX2-Math"));
                }
            }
        }
    }

    lastUI() : ElementUI {
        if(this.children.length == 0){
            return null;
        }
        else{
            return this.children[this.children.length - 1];
        }
    }

    add(ui: ElementUI){
        console.assert(ui != undefined && ui != null);
        this.children.push(ui);
    }
    
    draw(offset_x: number, offset_y: number){
        for(let ui of this.children){
            ui.draw(offset_x + this.x, offset_y + this.y);
        }
    }

    layoutIntegral() : BlockUI{
        var ui0 = this.children[0];
        var ui1 = this.children[1];
        var ui2 = this.children[2];
        
        var x = 0;
        var y;

        ui1.y = 0;

        ui0.x = ui1.width;
        ui0.y = - ui1.ascent;

        ui2.x = ui1.width / 2;
        ui2.y = ui1.descent;

        this.ascent  = ui1.ascent + ui0.ascent;
        this.descent = ui1.descent + ui2.descent;

        this.width   = Math.max(ui0.x + ui0.width, ui2.x + ui2.width);
        this.height  = this.ascent + this.descent;

        return this;
    }

    layoutSqrt() : BlockUI {
        var sym = this.children[0];
        var line = this.children[1];
        var arg = this.children[2];
        
        sym.x = 0;
        sym.y = 0;

        line.x = sym.width;
        line.y = - sym.ascent + C_5;
        line.width = arg.width;

        arg.x = sym.width;
        arg.y = 0;

        this.ascent  = Math.max(sym.ascent, line.y + line.ascent, arg.ascent);
        this.descent = Math.max(sym.descent, arg.descent);

        this.width   = arg.x + arg.width;
        this.height  = this.ascent + this.descent;

        return this;
    }
}

class HorizontalBlock extends BlockUI {
    wordSpacing : number = 1;

    constructor(tag, ctx: ContextUI = null, args: MathComponent[] = null){
        super(tag, ctx, args);
    }

    layoutHorizontal() : HorizontalBlock{
        var x = 0;
        var max_ascent  = 0;
        var max_descent = 0;

        for(let ui of this.children){
            if(ui != this.children[0]){
                // 最初でない場合

                x += this.wordSpacing;
            }

            ui.x = x;

            x += ui.width;

            max_ascent  = Math.max(max_ascent , ui.ascent - ui.y);
            max_descent = Math.max(max_descent, ui.y + ui.descent);

            if(ui instanceof TextUI){

                console.log("%s y:%.2f h:%.2f box-y:%.2f box-h:%.2f max_ascent:%.2f max_descent:%.2f", ui.text, ui.y, ui.height, ui.ascent, ui.height, max_ascent, max_descent);
            }
            else{

                console.log("y:%.2f h:%.2f max_ascent:%.2f max_descent:%.2f", ui.y, ui.height, max_ascent, max_descent);
            }
        }
        console.log("max_ascent:%.2f max_descent:%.2f height:%.2f", max_ascent, max_descent, max_ascent + max_descent);

        this.width   = x;
        this.height  = max_ascent + max_descent;
        this.ascent  = max_ascent;
        this.descent = max_descent;

        return this;
    }
}

class VerticalBlock extends BlockUI {
    lineSpacing : number = 1;

    constructor(tag, ctx: ContextUI = null, args: MathComponent[] = null){
        super(tag, ctx, args);
    }

    layoutVertical() : VerticalBlock {
        var x = 0;
        var y;
        var max_w = 0;

        for(let ui of this.children){
            if(ui == this.children[0]){
                // 最初の場合

                y = ui.ascent;
            }
            else{

                // 最初でない場合
                y += this.lineSpacing + ui.ascent;
            }

            ui.y = y;

            y += ui.descent;

            max_w = Math.max(max_w, ui.width);
        }

        this.width  = max_w;
        this.height = y;

        return this;
    }

    layoutBaseLine(base_idx: number) : VerticalBlock{
        var x = 0;
        var y;

        var base_ui = this.children[base_idx];
        base_ui.y = 0;
        var max_w = base_ui.width;

        var ascent = base_ui.ascent;
        for(var i = base_idx - 1; 0 <= i; i--){

            var ui = this.children[i];
            ui.y   = - (ascent + ui.descent);
            ascent += ui.height;
            max_w = Math.max(max_w, ui.width);
        }
        this.ascent = ascent;

        var descent = base_ui.descent;
        for(var i = base_idx + 1; i < this.children.length; i++){

            var ui = this.children[i];
            ui.y   = descent + ui.ascent;
            descent += ui.height;
            max_w = Math.max(max_w, ui.width);
        }
        this.descent = descent;

        for(let ui of this.children){
            if(ui instanceof LineUI){

                ui.x = 0;
                ui.width = max_w;
            }
            else{

                ui.x = (max_w - ui.width) / 2;
            }
        }

        this.width  = max_w;
        this.height = this.ascent + this.descent;

        return this;
    }
}

class TextUI extends ElementUI {
    fontSize  : number;
    text      : string;
    textSVG   : SVGTextElement;
    absX      : number = 0;
    absY      : number = 0;

    constructor(tag, text: string, ctx : ContextUI, font_size: number, font_family: string, transform: Transform = null){
        super(tag, ctx);

        var t = ctx.currentTransform();

        this.text = text;
        this.x = t.x;
        this.y = t.y;

        if(transform == null){
            transform = t;
        }

        this.transform = transform;


        this.textSVG = document.createElementNS("http://www.w3.org/2000/svg", "text");
        var textNode = document.createTextNode(text);

        this.textSVG.appendChild(textNode);



        this.textSVG.setAttribute("font-family", font_family);
        this.textSVG.setAttribute("font-size", "" + (font_size));//t.xscale * 
//        this.textSVG.setAttribute("alignment-baseline", "baseline");//, "text-before-edge");//, "before-edge");
        this.textSVG.setAttribute("dominant-baseline", "mathematical");//, "text-before-edge");//"hanging");
        this.textSVG["data-ui"] = this;

        ctx.group.appendChild(this.textSVG);

//        this.textSVG.setAttribute("x", "0");
//        this.textSVG.setAttribute("y", "0");
//        this.textSVG.setAttribute("transform", `scale(${t.xscale},${t.yscale})`);
        
        var bbox = this.textSVG.getBBox();

        this.width   = bbox.width;
        this.height  = bbox.height;

        this.ascent  = - bbox.y;
        this.descent = this.height - this.ascent;

        if(transform != null){

            this.width   *= transform.xscale;

            this.height  *= transform.yscale;
            this.ascent  *= transform.yscale;
            this.descent *= transform.yscale;
        }

        this.border = document.createElementNS("http://www.w3.org/2000/svg", "rect");

        this.border.setAttribute("fill", "transparent");
        this.border.setAttribute("stroke", "red");
        this.border.setAttribute("width", "" + this.width);
        this.border.setAttribute("height", "" + this.height);
        this.border.setAttribute("stroke-width", "0.2px");

        this.border["data-ui"] = this;

        var current_ui = this;

        this.border.addEventListener('mouseenter', function( e ) {
            e.preventDefault();
            current_ui.border.setAttribute("stroke", "blue");
            console.log("mouse enter " + current_ui.text);
        }, false);

        this.border.addEventListener('mouseleave', function( e ) {
            e.preventDefault();
            current_ui.border.setAttribute("stroke", "red");
            console.log("mouse leave " + current_ui.text);
        }, false);
/*

        this.border.addEventListener('mousedown', function( e ) {
            e.preventDefault();
            console.log("mouse down " + current_ui.text);
            return false;
        }, false);

        this.border.addEventListener('mouseup', function( e ) {
            e.preventDefault();
            console.log("mouse up " + current_ui.text);
            return false;
        }, false);

        this.border.addEventListener('contextmenu', function( e ) {
            e.preventDefault();
            return false;
        }, false);
*/
        ctx.group.appendChild(this.border);
    }
    
    draw(offset_x: number, offset_y: number){
        var abs_x = offset_x + this.x;
        var abs_y = offset_y + this.y;

        if(this.absX != abs_x){
            this.absX   = abs_x;
            this.textSVG.setAttribute("x", "" + abs_x);
            this.border.setAttribute("x", "" + abs_x);
        }

        if(this.absY != abs_y){
            this.absY   = abs_y;
            this.textSVG.setAttribute("y", "" + abs_y);
            this.border.setAttribute("y", "" + (abs_y - this.ascent));
        }


        if(this.transform != null){

            var s = `translate(${abs_x}, ${abs_y}) scale(${this.transform.xscale},${this.transform.yscale}) translate(${-abs_x}, ${-abs_y})`;
            this.textSVG.setAttribute("transform", s);
        }
        
    }
}


class LineUI extends ElementUI {
    absX      : number = 0;
    absY      : number = 0;
    line      : SVGLineElement;

    constructor(tag, x1: number, y1: number, width: number, ctx : ContextUI){
        super(tag, ctx);

        var t = ctx.currentTransform();

        this.x = t.x;
        this.y = t.y;

        this.width   = width;
        this.height  = 4;
        this.ascent  = 2;
        this.descent = 2;
    
        this.line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        this.line.setAttribute("stroke", "black");
        this.line.setAttribute("stroke-width", "1px");

        ctx.group.appendChild(this.line);
    }
    
    draw(offset_x: number, offset_y: number){
        var abs_x = offset_x + this.x;
        var abs_y = offset_y + this.y;

        if(this.absX != abs_x || this.absY != abs_y){
            this.absX   = abs_x;
            this.absY   = abs_y;

            this.line.setAttribute("x1", "" + abs_x + "px");
            this.line.setAttribute("y1", "" + abs_y + "px");
            this.line.setAttribute("x2", "" + (abs_x + this.width) + "px");
            this.line.setAttribute("y2", "" + abs_y + "px");
        }
    }
}
