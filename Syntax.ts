

class Variable {
    // 親
    parentVar : object;

    // 変数名
    name : string;

    // 変数の型
    typeVar : Class;

    // 定義域
    domain : Term;

    constructor(name : string, type : Class, domain : Term) {
        this.name = name;
        this.typeVar = type;
        this.domain = domain;

        if (this.domain != null) {
            this.domain.parent = this;
        }
    }

    makeUI(ctx : ContextUI) : ElementUI{
        var blc = new HorizontalBlock(this);

        blc.add( ctx.makeText(this, this.name) );
        blc.add( ctx.makeText(this, "∈") );
        
        blc.add( this.typeVar.makeUI(ctx) );

        blc.layout();

        return blc;
    }
}

/*
    関数
*/
class Func extends Variable {
    // 仮引数
    public params : Variable[] = new Array<Variable>();

    // 関数の本体
//    public BlockStatement BodyStatement;

    constructor(name : string, type : Class) {
        super(name, type, null)
    }
}

class Class {    
    name : string;

    // 次元 (スカラーは0,  1次元配列は1,  2次元配列は2, ... )
    dimCnt:number;

    constructor(name : string){
        this.name = name;
    }

    makeUI(ctx : ContextUI) : ElementUI {
        return ctx.makeText(this, this.name);
    }
}

var IntClass : Class = new Class("int");
var RealClass : Class = new Class("real");
var AddFnc : Func = new Func("+", null)
var MulFnc : Func = new Func("*", null)
var DivFnc : Func = new Func("/", null)

/*
    配列の型
*/
class ArrayType extends Class {
    // 要素の型
    elementType:Class;

    constructor(element_type:Class, dim_cnt:number){
        super(element_type.name)
        this.elementType = element_type;
        this.dimCnt = dim_cnt;
    }
}

class Statement {
    makeUI(ctx : ContextUI) : ElementUI{
        return null;
    }
}

class Term extends Statement {
    // 親
    parent : object;

    // 係数
    value : number = 1;

    // 項の型
    typeTerm : Class;
}

/*
    数値定数
*/
class Constant extends Term {
    text : string;
    constructor(text : string, sub_type : TokenSubType) {
        super();

        this.text = text;

        switch (sub_type) {
        case TokenSubType.integer:
            this.value = parseInt(text);
            this.typeTerm = IntClass;
            break;

        case TokenSubType.float:
        case TokenSubType.double:
            this.value = parseFloat(text);
            this.typeTerm = RealClass;
            break;
        }
    }

    makeUI(ctx : ContextUI) : ElementUI {
        return ctx.makeText(this, this.text);
    }
}

class Reference extends Term {
    // 変数名
    name : string;

    // 参照している変数
    varRef : Variable;

    // 配列の添え字
    indexes : Term[];

    constructor(name : string, ref_var : Variable, idx : Term[]) {
        super();
        this.name = name;
        this.varRef = ref_var;
        this.indexes = idx;

        if (this.indexes != null) {
            for(let t of this.indexes) {
                t.parent = this;
            }
        }
    }

    static FromVariable(v : Variable) {
        return new Reference(v.name, v, null);
    }

    makeUI(ctx : ContextUI) : ElementUI {
        if (this.indexes == null){
            return ctx.makeText(this, this.name);
        }

        var blc = new HorizontalBlock(this);

        blc.add(ctx.makeText(this, this.name));

        ctx.pushTransform(0, 5, 0.75);
        for(let idx of this.indexes){
            if(idx != this.indexes[0]){
                // 最初でない場合

                var cm = ctx.makeText(this, ",");
                blc.add(cm);
            }

            var idx_ui = idx.makeUI(ctx);
            blc.add(idx_ui);
        }
        ctx.popTransform();

        blc.layout();
        return blc;
    }
}

/*
    関数適用
*/
class Apply extends Term {
    // 関数
    functionApp : Reference;

    // 引数
    args : Term[];

    constructor(fnc : Reference, args : Term[]) {
        super();
        this.functionApp = fnc;
        this.args = args;

        this.functionApp.parent = this;
        for(let t of this.args) {
            t.parent = this;
        }
    }


    /*
        
    */
    makeDiv(ctx : ContextUI) : ElementUI{
        var div = ctx.makeVerticalBlock(this, [this.args[0], new LineUI(this, 0, 0, 1, ctx), this.args[1]]);
        div.layout2(1);

        return div;
    }

    /*
        sum(i, 0, N, p[i])
    */
    makeSum(ctx : ContextUI) : ElementUI{
        ctx.pushTransform(0, 0, 0.5);
        var sum_to   = this.args[2].makeUI(ctx);
        var sum_from = ctx.makeHorizontalBlock(this, [this.args[0], "=", this.args[1]]);
        ctx.popTransform();

        var sum_head = ctx.makeVerticalBlock(this, [ sum_to, "∑", sum_from ]);
        sum_head.layout2(1);

        return ctx.makeHorizontalBlock(this, [ sum_head, this.args[3] ]);
    }

    makeUI(ctx : ContextUI) : ElementUI{
        if(this.functionApp.name == "sum"){
            return this.makeSum(ctx);
        }
        else if(this.functionApp.name == "/"){
            return this.makeDiv(ctx);
        }

        var blc = new HorizontalBlock(this)

        var op: string;
        if(this.functionApp.name == "*"){
            op = "⋅";
        }
        else{
            op = this.functionApp.name;
        }
        for(let arg of this.args){
            if(arg != this.args[0]){
                // 最初でない場合

                blc.add( ctx.makeText(this, op) );
            }

            blc.add( arg.makeUI(ctx) );
        }

        blc.layout();

        return blc;
    }
}

/*
    変数宣言文
*/
class VariableDeclaration extends Statement {
    variables : Variable[] = new Array<Variable>();

    makeUI(ctx : ContextUI){
        var blc = new HorizontalBlock(this)

        for(let va of this.variables){
            if(va != this.variables[0]){
                // 最初でない場合

                blc.add( ctx.makeText(this, ",") );
            }

            blc.add( va.makeUI(ctx) );
        }

        blc.layout();

        return blc;
    }
}

class Predicate {
    variables : Variable[] = new Array<Variable>();
    expression : Term;
}

