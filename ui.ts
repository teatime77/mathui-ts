class Vec2 {
    constructor(x : number, y : number){

    }
}

class ContextUI {
}

class TermUI {
    term : Term;

    public draw(ctx : ContextUI){
    }

    public getSize(ctx : ContextUI) : Vec2 {
        return new Vec2(0, 0);
    }
}

class ConstantUI extends TermUI {
    constructor(){   
        super();
    }
}

class ReferenceUI extends TermUI {

}

class ApplyUI extends TermUI {

}

enum FontStyle {

}

class ElementUI {
    border  : SVGRectElement;
    term    : Term;

    constructor(term: Term){
        this.term = term;
    }
}

class BlockUI extends ElementUI {
}

class MathLayout {
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

class TextUI extends ElementUI {
    fontStyle : FontStyle;
    fontSize  : number;
    text      : string;
    textSVG   : SVGTextElement;
    width     : number;
    height    : number;

    constructor(term: Term, text: string, svg : SVGSVGElement, font_size: number, font_family: string){
        super(term);

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

    setXY(x: number, y: number){
        this.textSVG.setAttribute("x", "" + x);
        this.textSVG.setAttribute("y", "" + y);

        this.border.setAttribute("x", "" + x);
        this.border.setAttribute("y", "" + y);
    }
}

