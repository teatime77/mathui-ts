function format(str: string, ...args){
    var ret = str;

    if(Array.isArray(args) && args.length == 1 && Array.isArray(args[0])){
        args = args[0];
    }
    for(let [idx, val] of args.entries()){
        ret = ret.replace("$"+(idx+1), val);
    }

    return ret;
}

function toTexName(name : string){
    var v = [ 
        "alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "theta", 
        "iota", "kappa", "lambda", "mu", "nu", "xi", "pi", "rho", 
        "sigma", "tau", "phi", "chi", "psi", "omega"
    ]

    var k = name.indexOf("__");
    var name1;
    if(k != -1){
        name1 = name.substring(0, k);
    }
    else{
        name1 = name;
    }

    var name1_low = name1[0].toLowerCase() + name1.substring(1);
    if(v.indexOf(name1_low) != -1){

        name1 = "\\" + name1;
    }

    if(k != -1){

        var mark = name.substring(k + 2);
        if(mark == "ast"){

            return format("{$1^\\ast}", name1);
        }
        else{

            return format("\\$2{$1}", name1, mark);
        }
    }
    else{
        return name1;
    }
}

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

    tex(){
        return toTexName(this.name) + " \\in " + this.typeVar.tex();
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

    tex(){
        return this.name;
    }
}

var IntClass : Class = new Class("int");
var RealClass : Class = new Class("real");
var AddFnc : Func = new Func("+", null)
var MulFnc : Func = new Func("*", null)
var DivFnc : Func = new Func("/", null)
var PowFnc : Func = new Func("^", null)
var EqRel : Func = new Func("=", null)
var NeRel : Func = new Func("!=", null)
var GtRel : Func = new Func(">", null)
var GeRel : Func = new Func(">=", null)
var LtRel : Func = new Func("<", null)
var LeRel : Func = new Func("<=", null)



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

    uiTerm  : ElementUI;

    eq(t: Term) : boolean{
        return false;
    }

    clone(var_tbl): Term {
        return null;
    }

    replace(old_term: Term, new_term: Term){
    }

    setParenthesis(){
    }

    texSub(){
        console.assert(false);
    }

    tex(){
        var s = this.texSub();

        if(this.value == 1){
            return s;
        }
        else if(this.value == -1){
            return "- " + s;
        }
        else{
            return format("$1 \\cdot $2", "" + this.value, s);
        }
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
        var ui = ctx.makeText(this, "" + this.value);
        this.uiTerm = ui;

        return ui;
    }

    tex(){
        return "" + this.value;
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

    replace(old_term: Term, new_term: Term){
        if(this.indexes != null){
            var i = this.indexes.indexOf(old_term);
            if(i != -1){

                this.indexes[i] = new_term;
                new_term.parent = this;
                return;
            }
        }

        console.assert(false);
    }
    

    makeUI(ctx : ContextUI) : ElementUI {
        var ui_ref;

        if (this.indexes == null){
            ui_ref = ctx.makeText(this, this.name);
        }
        else{


            ctx.scale(0.75, 0.75);
            var idx_ui = (new HorizontalBlock(this, ctx, joinMath(",", this.indexes)).translate(0, 5) as HorizontalBlock).layoutHorizontal();
            ctx.popScale();

            ui_ref = new HorizontalBlock(this, ctx, [this.name, idx_ui]).layoutHorizontal();
        }

        this.uiTerm = ui_ref;

        return ui_ref;
    }

    texSub(){
        var tex_name = toTexName(this.name);

        if (this.indexes != null){
            var texs = this.indexes.map(x => x.tex());

            return format("$1_{$2}", tex_name, texs.join(","));
        }
        return tex_name;
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

    withParenthesis : boolean = false;
    
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

    replace(old_term: Term, new_term: Term){
        if(old_term == this.functionApp){
            this.functionApp = new_term as Reference;
        }
        else{

            var i = this.args.indexOf(old_term);
            if(i != -1){

                this.args[i] = new_term;
                new_term.parent = this;
                return;
            }

            console.assert(false);
        }
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
        ctx.scale(0.5, 0.5);
        var sum_to   = this.args[2].makeUI(ctx);
        var sum_from = new HorizontalBlock(this, ctx, [this.args[0], "=", this.args[1]]).layoutHorizontal();
        ctx.popScale();

        var sum_head = new VerticalBlock(this, ctx, [ sum_to, "∑", sum_from ]).layoutBaseLine(1);

        return new HorizontalBlock(this, ctx, [ sum_head, this.args[3] ]).layoutHorizontal();
    }

    /*
        int(i, 0, N, p[i])
    */
    makeIntegral(ctx : ContextUI) : ElementUI{
        ctx.scale(0.3, 0.3);
        var int_to   = this.args[2].makeUI(ctx);
        var int_from = this.args[1].makeUI(ctx);
        ctx.popScale();

        var int_head = new VerticalBlock(this, ctx, [ int_to, "∫", int_from ]).layoutIntegral();

        return new HorizontalBlock(this, ctx, [ int_head, this.args[3], "d", this.args[0] ]).layoutHorizontal();
    }

    /*
        sqrt(x)
    */
    makeSqrt(ctx : ContextUI) : ElementUI{
        var arg = this.args[0].makeUI(ctx);

        ctx.scale(1, arg.height/16);
        var sym = ctx.makeText(this, "√", "STIX2-Math");
        ctx.popScale();
        
        return new BlockUI(this, ctx, [ sym, new LineUI(this, 0, 0, 1, ctx), arg ]).layoutSqrt();
    }

    makeUI(ctx : ContextUI) : ElementUI{
        var ui_app;

        if(this.functionApp.name == "sum"){
            ui_app = this.makeSum(ctx);
        }
        else if(this.functionApp.name == "/"){
            ui_app = this.makeDiv(ctx);
        }
        else if(this.isIntegral()){
            ui_app = this.makeIntegral(ctx);
        }
        else if(this.isSqrt()){
            ui_app = this.makeSqrt(ctx);
        }
        else{

            var op: string;
            if(this.functionApp.name == "*"){
                op = "⋅";
            }
            else{
                op = this.functionApp.name;
            }

            ui_app = new HorizontalBlock(this, ctx, joinMath(op, this.args)).layoutHorizontal();
        }

        this.uiTerm = ui_app;
        return ui_app;
    }

    getPrecedence(){
        switch(this.functionApp.name){
        case "*":
        case "/":
            return 1;
        case "+":
        case "-":
            return 2;
        case "=":
        case "!=":
        case "<":
        case "<=":
        case ">":
        case ">=":
            return 3;
        default:
            return 0;
        }
    }

    setParenthesis(){
        if(this.parent instanceof Apply && this.parent.getPrecedence() <= this.getPrecedence()){
            this.withParenthesis = true;
        }
        else{
            this.withParenthesis = false;
        }
    }

    texSub2(){
        var texs = this.args.map(x => x.tex());

        switch(this.functionApp.name){
        case "sum":
            return format("\\sum_{$1=$2}^{$3} $4", texs);
        case "^":
            var arg1 = this.args[0];
            if(arg1 instanceof Apply){
                switch(arg1.functionApp.name){
                case "*":
                case "/":
                case "+":
                case "-":
                    return format("($1)^{$2}", texs);                                
                }
            }
            return format("$1^{$2}", texs);
        case "sqrt":
            return format("\\sqrt{$1}", texs);
        case "norm":
            return format("\\| $1 \\|", texs);
        case "*":
        case "=":
        case "!=":
        case "<":
        case "<=":
        case ">":
        case ">=":
            var opr = { "*":"\\cdot", "=":"=" , "!=":"\\neq" , "<":"\\lt", "<=":"\\leqq", ">":"\\gt" , ">=":"\\geqq" }[this.functionApp.name];
            return texs.join(" " + opr + " ");
        case "+":
            var s = "";
            for(let [idx, arg] of this.args.entries()){
                if(0 < idx && 0 <= arg.value){
                    s += " + ";
                }
                s += texs[idx];
            }
            return s;
        case "/":
            return format("\\frac{$1}{$2}", texs);
        default:
            return format("$1($2)", this.functionApp.tex(), texs.join(","));
        }
    
/*
        else if(this.functionApp.name == "/"){
            return this.texDiv();
        }
        else if(this.isIntegral()){
            return this.texIntegral();
        }
        else if(this.isSqrt()){
            return this.texSqrt();
        }
        else{

            var op: string;
            else{
                op = this.functionApp.name;
            }

            ui_app = new HorizontalBlock(this, ctx, joinMath(op, this.args)).layoutHorizontal();
        }
*/
    }

    texSub(){
        var s = this.texSub2();

        if(this.withParenthesis){
            return "(" + s + ")";
        }
        else{
            return s;
        }
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

    tex(){
        return this.variables.map(x => x.tex()).join(",");
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