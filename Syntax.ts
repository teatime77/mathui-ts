

class Variable {
    // 親
    ParentVar : object;

    // 変数名
    Name : string;

    // 変数の型
    TypeVar : Class;

    // 定義域
    Domain : Term;

    constructor(name : string, type : Class, domain : Term) {
        this.Name = name;
        this.TypeVar = type;
        this.Domain = domain;

        if (this.Domain != null) {
            this.Domain.Parent = this;
        }
    }
}

/*
    関数
*/
class Func extends Variable {
    // 仮引数
    public Params : Variable[] = new Array<Variable>();

    // 関数の本体
//    public BlockStatement BodyStatement;

    constructor(name : string, type : Class) {
        super(name, type, null)
    }
}

class Class {    
    Name : string;

    // 次元 (スカラーは0,  1次元配列は1,  2次元配列は2, ... )
    DimCnt:number;

    constructor(name : string){
        this.Name = name;
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
    ElementType:Class;

    constructor(element_type:Class, dim_cnt:number){
        super(element_type.Name)
        this.ElementType = element_type;
        this.DimCnt = dim_cnt;
    }
}

class Term {
    // 親
    Parent : object;

    // 係数
    Value : number = 1;

    // 項の型
    TypeTerm : Class;
}

/*
    数値定数
*/
class Constant extends Term {
    constructor(text : string, sub_type : TokenSubType) {
        super();

        switch (sub_type) {
        case TokenSubType.Integer:
            this.Value = parseInt(text);
            this.TypeTerm = IntClass;
            break;

        case TokenSubType.Float:
        case TokenSubType.Double:
            this.Value = parseFloat(text);
            this.TypeTerm = RealClass;
            break;
        }
    }
}

class Reference extends Term {
    // 変数名
    Name : string;

    // 参照している変数
    VarRef : Variable;

    // 配列の添え字
    Indexes : Term[];

    constructor(name : string, ref_var : Variable, idx : Term[]) {
        super();
        this.Name = name;
        this.VarRef = ref_var;
        this.Indexes = idx;

        if (this.Indexes != null) {
            for(let t of this.Indexes) {
                t.Parent = this;
            }
        }
    }


    static FromVariable(v : Variable) {
        return new Reference(v.Name, v, null);
    }
}

/*
    関数適用
*/
class Apply extends Term {
    // 関数
    FunctionApp : Reference;

    // 引数
    Args : Term[];


    constructor(fnc : Reference, args : Term[]) {
        super();
        this.FunctionApp = fnc;
        this.Args = args;

        this.FunctionApp.Parent = this;
        for(let t of this.Args) {
            t.Parent = this;
        }
    }
}

class Relation {
}

/*
    変数宣言文
*/
class VariableDeclaration extends Relation {
    Variables : Variable[] = new Array<Variable>();
}

class Predicate {
    Variables : Variable[] = new Array<Variable>();
    Expression : Term;
}

