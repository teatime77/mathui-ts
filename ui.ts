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

}

class BlockUI extends ElementUI {
}

class TextUI extends ElementUI {
    fontStyle : FontStyle;
    fontSize  : number;
    text      : string;
}

