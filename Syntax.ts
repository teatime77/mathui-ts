

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

class Term {
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
    constructor(text : string, sub_type : TokenSubType) {
        super();

        switch (sub_type) {
        case TokenSubType.Integer:
            this.value = parseInt(text);
            this.typeTerm = IntClass;
            break;

        case TokenSubType.Float:
        case TokenSubType.Double:
            this.value = parseFloat(text);
            this.typeTerm = RealClass;
            break;
        }
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
}

class Relation {
}

/*
    変数宣言文
*/
class VariableDeclaration extends Relation {
    variables : Variable[] = new Array<Variable>();
}

class Predicate {
    variables : Variable[] = new Array<Variable>();
    expression : Term;
}

