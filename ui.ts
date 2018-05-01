
class Vec2 {
    constructor(x : number, y : number){

    }
}


class ContextUI {
    svg : SVGSVGElement;
    rootUI: ElementUI;

    constructor(svg : SVGSVGElement){
        this.svg    = svg;
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

    makeText(obj, str: string){
        return new TextUI(obj, str, this.svg, 16, "STIX2-Regular");
    }

    draw(){
        this.rootUI.draw(0, 0);
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
    x       : number;
    y       : number;
    width   : number;
    height  : number;

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
    
    addUI(ui: ElementUI){
        this.children.push(ui);
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
        this.children.push(ui);
    }

    layout(){
    }
    
    draw(offset_x: number, offset_y: number){
        for(let ui of this.children){
            ui.draw(offset_x + this.x, offset_y + this.y);
        }
    }
}

class HorizontalBlock extends BlockUI {
    wordSpacing : number = 1;

    constructor(tag){
        super(tag);
    }

    layout(){
        var x = 0;
        var y = 0;
        var max_h = 0;

        for(let ui of this.children){
            if(ui != this.children[0]){
                // 最初でない場合

                x += this.wordSpacing;
            }

            ui.setXY(x, y);

            x += ui.width;
            max_h = Math.max(max_h, ui.height);
        }

        this.width  = x;
        this.height = max_h;
    }
}

class VerticalBlock extends BlockUI {
    lineSpacing : number = 1;

    constructor(tag){
        super(tag);
    }

    layout(){
        var x = 0;
        var y = 0;
        var max_w = 0;

        for(let ui of this.children){
            if(ui != this.children[0]){
                // 最初でない場合

                y += this.lineSpacing;
            }

            ui.setXY(x, y);

            y += ui.height;
            max_w = Math.max(max_w, ui.width);
        }

        this.width  = max_w;
        this.height = y;
    }
}

class TextUI extends ElementUI {
    fontSize  : number;
    text      : string;
    textSVG   : SVGTextElement;
    absX      : number = 0;
    absY      : number = 0;

    constructor(tag, text: string, svg : SVGSVGElement, font_size: number, font_family: string){
        super(tag);

        this.textSVG = document.createElementNS("http://www.w3.org/2000/svg", "text");
        var textNode = document.createTextNode(text);

        this.textSVG.appendChild(textNode);
        this.textSVG.setAttribute("font-family", font_family);
        this.textSVG.setAttribute("font-size", "" + font_size);
//            this.textSVG.setAttribute("alignment-baseline", "text-before-edge");//, "before-edge");
        this.textSVG.setAttribute("dominant-baseline", "text-before-edge");//"hanging");

        svg.appendChild(this.textSVG);

        var bbox = this.textSVG.getBBox();
        this.width = bbox.width;
        this.height = bbox.height;
//            w = this.textSVG.getComputedTextLength();

        this.border = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this.border.setAttribute("fill", "transparent");
        this.border.setAttribute("stroke", "red");
        this.border.setAttribute("width", "" + this.width);
        this.border.setAttribute("height", "" + this.height);
        this.border.setAttribute("stroke-width", "0.2px");

        svg.appendChild(this.border);
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
            this.border.setAttribute("y", "" + abs_y);
        }
    }
}

