
class Transform {
    x : number;
    y : number;
    scale: number;

    constructor(x : number, y : number, scale: number){
        this.x  = x;
        this.y  = y;
        this.scale  = scale;
    }

    apply(t: Transform) : Transform {
        return ;
    }
}


class ContextUI {
    svg : SVGSVGElement;
    rootUI: ElementUI;
    transform : Transform[] = [ new Transform(0, 0, 1) ];

    constructor(svg : SVGSVGElement){
        this.svg    = svg;
    }

    currentTransform() : Transform {
        return this.transform[this.transform.length-1];
    }

    pushTransform(x : number, y : number, scale: number){
        var t1 = this.currentTransform();
        var t2 = new Transform(t1.x + x, t1.y + y, t1.scale * scale);
        this.transform.push( t2 );

        return t2;
    }

    popTransform(){
        this.transform.pop();
    }

    makeUI(stmt_list: Statement[]) : ElementUI {
        var blc = new VerticalBlock(null);

        var x = 5;
        var y = 30;
        for(let stmt of stmt_list){
            blc.add( stmt.makeUI(this) );
        }

        blc.layout();

        this.rootUI = blc;
        this.rootUI.setXY(0, 0);

        return blc;
    }

    makeText(obj, str: string, font_family:string = "STIX2-Regular"){
        return new TextUI(obj, str, this, 16, font_family);
    }

    makeHorizontalBlock(tag, args: (string | Term | ElementUI)[]) : HorizontalBlock {
        var blc = new HorizontalBlock(tag);

        for(let arg of args){
            if(arg instanceof Term){

                blc.add(arg.makeUI(this));
            }
            else if(arg instanceof ElementUI){

                blc.add(arg);
            }
            else if(typeof(arg) == "string"){

                blc.add(this.makeText(tag, arg, "STIX2-Math"));
            }
        }

        blc.layout();
        return blc;
    }

    makeVerticalBlock(tag, args: (string | Term | ElementUI)[]) : VerticalBlock {
        var blc = new VerticalBlock(tag);

        for(let arg of args){
            if(arg instanceof Term){

                blc.add(arg.makeUI(this));
            }
            else if(arg instanceof ElementUI){

                blc.add(arg);
            }
            else if(typeof(arg) == "string"){

                blc.add(this.makeText(tag, arg, "STIX2-Math"));
            }
        }

        return blc;
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
    border  : SVGRectElement;
    tag;
    x       : number = 0;
    y       : number = 0;
    width   : number;
    height  : number;
    ascent  : number;
    descent : number;

    constructor(tag){
        this.tag = tag;
    }

    layout(){        
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

    constructor(tag){
        super(tag);
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

    layout(){
    }
    
    draw(offset_x: number, offset_y: number){
        for(let ui of this.children){
            ui.draw(offset_x + this.x, offset_y + this.y);
        }
    }

    layoutIntegral(){
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
    }
}

class HorizontalBlock extends BlockUI {
    wordSpacing : number = 1;

    constructor(tag){
        super(tag);
    }

    layout(){
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

                console.log("%s y:%.2f h:%.2f box-y:%.2f box-h:%.2f max_ascent:%.2f max_descent:%.2f", ui.text, ui.y, ui.height, ui.bbox.y, ui.bbox.height, max_ascent, max_descent);
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
    }
}

class VerticalBlock extends BlockUI {
    lineSpacing : number = 1;

    constructor(tag){
        super(tag);
    }

    layout(){
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
    }

    layout2(base_idx: number){
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
    }
}

class TextUI extends ElementUI {
    fontSize  : number;
    text      : string;
    textSVG   : SVGTextElement;
    absX      : number = 0;
    absY      : number = 0;
    bbox      : SVGRect;

    constructor(tag, text: string, ctx : ContextUI, font_size: number, font_family: string){
        super(tag);

        var t = ctx.currentTransform();

        this.text = text;
        this.x = t.x;
        this.y = t.y;

        this.textSVG = document.createElementNS("http://www.w3.org/2000/svg", "text");
        var textNode = document.createTextNode(text);

        this.textSVG.appendChild(textNode);
        this.textSVG.setAttribute("font-family", font_family);
        this.textSVG.setAttribute("font-size", "" + (t.scale * font_size));
//        this.textSVG.setAttribute("alignment-baseline", "baseline");//, "text-before-edge");//, "before-edge");
        this.textSVG.setAttribute("dominant-baseline", "mathematical");//, "text-before-edge");//"hanging");

        ctx.svg.appendChild(this.textSVG);

        this.bbox = this.textSVG.getBBox();
        this.width = this.bbox.width;
        this.height = this.bbox.height;
        this.ascent = - this.bbox.y;
        this.descent = this.height - this.ascent;
//            w = this.textSVG.getComputedTextLength();

        this.border = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this.border.setAttribute("fill", "transparent");
        this.border.setAttribute("stroke", "red");
        this.border.setAttribute("width", "" + this.width);
        this.border.setAttribute("height", "" + this.height);
        this.border.setAttribute("stroke-width", "0.2px");

        ctx.svg.appendChild(this.border);
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
            this.border.setAttribute("y", "" + (abs_y + this.bbox.y));//- this.bbox.height 
        }
    }
}


class LineUI extends ElementUI {
    absX      : number = 0;
    absY      : number = 0;
    line      : SVGLineElement;

    constructor(tag, x1: number, y1: number, width: number, ctx : ContextUI){
        super(tag);

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

        ctx.svg.appendChild(this.line);
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
