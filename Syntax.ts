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


    /*
        コピーを返します。
    */
    clone(var_tbl: Map<Variable, Variable> = null) : Variable{
        if(var_tbl == null) {
            var_tbl = new Map<Variable, Variable>();
        }

        var domain = (this.domain == null ? null : this.domain.clone(var_tbl));
        var v1 = new Variable(this.name, this.typeVar, domain);
        var_tbl.set(this, v1);

        return v1;
    }


    makeUI(ctx : ContextUI) : ElementUI{
        return new HorizontalBlock(this, ctx, [ this.name, "∈", this.typeVar ]).layoutHorizontal();
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

    eq(t: Term) : boolean{
        return false;
    }

    clone(var_tbl): Term {
        return null;
    }
}

/*
    数値定数
*/
class Constant extends Term {
    constructor(value : number, type_term : Class) {
        super();

        this.value = value;
        this.typeTerm = type_term;
    }

    /*
        コピーを返します。
    */
    clone(var_tbl: Map<Variable, Variable>) : Constant {
            
        return new Constant(this.value, this.typeTerm);
    }

    makeUI(ctx : ContextUI) : ElementUI {
        return ctx.makeText(this, "" + this.value);
    }
}

class Reference extends Term {
    // 変数名
    name : string;

    // 参照している変数
    varRef : Variable;

    // 配列の添え字
    indexes : Term[];

    constructor(name : string, ref_var : Variable, idx : Term[] = null, value: number = 1) {
        super();
        this.name = name;
        this.varRef = ref_var;
        this.indexes = idx;
        this.value   = value;

        if (this.indexes != null) {
            for(let t of this.indexes) {
                t.parent = this;
            }
        }
    }

    /*
        コピーを返します。
    */
    clone(var_tbl: Map<Variable, Variable> = null) : Reference{
        var var_ref: Variable;
        var clone_ref: Reference;

        if (var_tbl != null && var_tbl.has(this.varRef)) {

            var_ref = var_tbl.get(this.varRef);
        }
        else{

            var_ref = this.varRef;
        }

        if (this.indexes == null) {
            clone_ref = new Reference(this.name, var_ref, null, this.value);
        }
        else {

            var idx: Term[] = this.indexes.map(t => t.clone(var_tbl));

            clone_ref = new Reference(this.name, var_ref, idx, this.value);
        }

        clone_ref.typeTerm = this.typeTerm;

        return clone_ref;
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

        ctx.pushTransform(0, 5, 0.75, 0.75);
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

        blc.layoutHorizontal();
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
        コピーを返します。
    */
    clone(var_tbl: Map<Variable, Variable> = null) : Apply {
        var args: Term[] = this.args.map(t => t.clone(var_tbl));
        var app = new Apply(this.functionApp.clone(var_tbl), args);

        app.value = this.value;
        app.typeTerm = this.typeTerm;

        return app;
    }

    isIntegral(){
        return this.functionApp.name == "int";
    }

    isSqrt(){
        return this.functionApp.name == "sqrt";
    }

    /*
        
    */
    makeDiv(ctx : ContextUI) : ElementUI{
        return new VerticalBlock(this, ctx, [this.args[0], new LineUI(this, 0, 0, 1, ctx), this.args[1]]).layoutBaseLine(1);
    }

    /*
        sum(i, 0, N, p[i])
    */
    makeSum(ctx : ContextUI) : ElementUI{
        ctx.pushTransform(0, 0, 0.5, 0.5);
        var sum_to   = this.args[2].makeUI(ctx);
        var sum_from = new HorizontalBlock(this, ctx, [this.args[0], "=", this.args[1]]).layoutHorizontal();
        ctx.popTransform();

        var sum_head = new VerticalBlock(this, ctx, [ sum_to, "∑", sum_from ]);

        sum_head.layoutBaseLine(1);

        return new HorizontalBlock(this, ctx, [ sum_head, this.args[3] ]).layoutHorizontal();
    }

    /*
        int(i, 0, N, p[i])
    */
    makeIntegral(ctx : ContextUI) : ElementUI{
        ctx.pushTransform(0, 0, 0.3, 0.3);
        var int_to   = this.args[2].makeUI(ctx);
        var int_from = this.args[1].makeUI(ctx);
        ctx.popTransform();

        var int_head = new VerticalBlock(this, ctx, [ int_to, "∫", int_from ]);
        int_head.layoutIntegral();

        return new HorizontalBlock(this, ctx, [ int_head, this.args[3], "d", this.args[0] ]).layoutHorizontal();
    }

    /*
        sqrt(x)
    */
    makeSqrt(ctx : ContextUI) : ElementUI{
        var arg = this.args[0].makeUI(ctx);

        ctx.pushTransform(0, 0, 1, arg.height/16);
        var sym = ctx.makeText(this, "√", "STIX2-Math");
        ctx.popTransform();
        
        return new BlockUI(this, ctx, [ sym, new LineUI(this, 0, 0, 1, ctx), arg ]).layoutSqrt();
    }

    makeUI(ctx : ContextUI) : ElementUI{
        if(this.functionApp.name == "sum"){
            return this.makeSum(ctx);
        }
        else if(this.functionApp.name == "/"){
            return this.makeDiv(ctx);
        }
        else if(this.isIntegral()){
            return this.makeIntegral(ctx);
        }
        else if(this.isSqrt()){
            return this.makeSqrt(ctx);
        }

        var op: string;
        if(this.functionApp.name == "*"){
            op = "⋅";
        }
        else{
            op = this.functionApp.name;
        }

        return new HorizontalBlock(this, ctx, joinMath(op, this.args)).layoutHorizontal();
    }
}

/*
    変数宣言文
*/
class VariableDeclaration extends Statement {
    variables : Variable[];

    constructor(variables : Variable[]){
        super();
        this.variables = variables;
    }

    /*
        コピーを返します。
    */
    clone(var_tbl: Map<Variable, Variable> = null) : VariableDeclaration {
        var vars = this.variables.map(x => x.clone(var_tbl));

        return new VariableDeclaration(vars);
    }

    makeUI(ctx : ContextUI){
        return new HorizontalBlock(this, ctx, joinMath(",", this.variables)).layoutHorizontal();
    }
}

class Predicate {
    variables : Variable[] = new Array<Variable>();
    expression : Term;
}

class StatementFlow {
    statements: Statement[];

    constructor(statements: Statement[]){
        this.statements = statements;
    }

    makeUI(ctx : ContextUI) : VerticalBlock{
        return new VerticalBlock(this, ctx, this.statements).layoutVertical();
    }
}