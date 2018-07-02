namespace MathUI {
function One()  : Constant { 
    return new Constant(1, IntClass); 
}

function Zero()  : Constant { 
    return new Constant(0, IntClass); 
}

function range(n: number): number[]{
    var v = new Array<number>(n);
    for(var i = 0; i < n; i++){
        v[i] = i;
    }

    return v;
}

export class SymbolicComputation {

    /*
        LINQの微分
    Term DifferentialLINQ(LINQ lnq, Reference r1, Dictionary<Variable, Variable> var_tbl) {
        console.assert(lnq.Aggregate != null);

        Dictionary<Reference, Dictionary<Reference, Term>> rs = new Dictionary<Reference, Dictionary<Reference, Term>>();
        bool exact = false;

        // r1と同じ変数を参照する変数参照のリスト
        var refs  = All<Reference>(lnq.Select).Where(x => x.varRef == r1.varRef);

        foreach(Reference r2 in refs) {
            if (rs.Keys.Any(r => r.eq(r2))) {
                // 処理済みの場合

                continue;
            }

            if (r1.eq(r2)) {
                // 一致する場合

                exact = true;
            }
            else {
                // 一致しない添え字がある場合

                Dictionary<Reference, Term> pairs = new Dictionary<Reference, Term>();
                for (int i = 0; i < r1.Indexes.length; i++) {
                    if (!r1.Indexes[i].eq(r2.Indexes[i])) {
                        // 添え字が一致しない場合

                        if (!(r2.Indexes[i] instanceof Reference)) {
                            // 代入候補の変数参照の添え字が変数参照でない場合

                            throw new Exception();
                        }
                        else {
                            // 両方の添え字が変数参照の場合

                            Reference r3 = r2.Indexes[i] as Reference;
                            var linq_eq_vars = lnq.Variables.Where(va => va == r3.varRef);
                            if (linq_eq_vars.Any()) {
                                // LINQの変数の場合

                                Variable va = linq_eq_vars.First();
                                console.assert(! pairs.Keys.Any(r => r.varRef == va));
                                pairs.Add(new Reference(va), r1.Indexes[i]);
                            }
                            else {
                                // LINQの変数でない場合

                                throw new Exception();
                            }
                        }
                    }
                }

                rs.Add(r2, pairs);
            }
        }

        console.assert(!(exact && rs.Any()), "完全一致の変数参照と代入で一致の変数参照の両方がある場合は未対応");
        if (!(exact || rs.Any())) {
            // 完全一致や代入で一致の変数参照がない場合

            return Zero();
        }

        // LINQをコピーします。
        LINQ lnq1 = lnq.clone(var_tbl);

        Term lnq_select;

        if (exact) {
            // 完全一致の変数参照がある場合

            // select句を微分します。
            lnq_select = lnq1.Select;
        }
        else {
            // 代入で一致の変数参照がある場合

            console.assert(rs.Keys.Count == 1, "代入で一致の変数参照は1種類のみ実装");
            Dictionary<Reference, Term> subst_tbl = rs.First().Value;
            console.assert(subst_tbl.Count == lnq.Variables.length, "LINQの全変数に代入します。");

            // LINQのselect句の変数参照に代入します。
            lnq_select = Subst(lnq1.Select, subst_tbl, var_tbl);
        }

        // LINQのselect句を微分します。
        Term dif1 = Differential(lnq_select, r1, var_tbl);

        if (lnq.Aggregate.Name == "Sum") {
            // 集計関数が総和の場合

            return dif1;
        }
        else {
            // 集計関数が総和でない場合

            // 総和以外のLINQの微分は未実装
            throw new Exception();
        }
    }
    */

    AddFnc: Variable;
    SubFnc: Variable;
    MulFnc: Variable;
    DivFnc: Variable;

    VariableToReference(args: object[]) : Term[]{
        return args.map(x => (x instanceof Variable ? new Reference(x.name, x as Variable) : x as Term));
    }

    Add(args: object[]) : Apply{
        return new Apply(new Reference(this.AddFnc.name, this.AddFnc), this.VariableToReference(args));
    }

    Sub(args: object[]) : Apply{
        return new Apply(new Reference(this.SubFnc.name, this.SubFnc), this.VariableToReference(args));
    }

    Mul(args: object[]) : Apply{
        return new Apply(new Reference(this.MulFnc.name, this.MulFnc), this.VariableToReference(args));
    }

    Div(args: object[]) : Apply{
        return new Apply(new Reference(this.DivFnc.name, this.DivFnc), this.VariableToReference(args));
    }

    /*
        微分
    */
    Differential( t1: Term, r1: Reference, var_tbl_up) : Term{
        if (t1 instanceof Reference) {
            // 変数参照の場合

            if (t1.eq(r1)) {
                return One();
            }
            else {
                return Zero();
            }
        }
        else if (t1 instanceof Constant) {
            // 数値定数の場合

            return Zero();
        }

        var var_tbl = (var_tbl_up == null ? {} : {...var_tbl_up});
        if (t1 instanceof Apply) {
            // 関数適用の場合

            var app: Apply = t1 as Apply;

            var diffs: Term[] = app.args.map(t => this.Differential(t, r1, var_tbl));

            if (app.functionApp.isAddFnc()) {
                // 加算の場合

                return this.Add(diffs);
            }
            else if (app.functionApp.isMulFnc()) {
                // 乗算の場合

                var args: Term[] = new Term[app.args.length];
                for(let i of range(app.args.length)) {
                    var v = range(app.args.length).map(j => (i == j ? diffs[i] : app.args[j].clone(var_tbl)) );
                    args[i] = this.Mul( v );
                }

                return this.Add(args);
            }
            else {
                console.assert(false);
            }
        }
/*
        else if (t1 instanceof LINQ) {
            // LINQの場合

            return DifferentialLINQ(t1 as LINQ, r1, var_tbl);
        }
*/
        else {
            console.assert(false);
        }

        console.assert(false);
        return null;
    }

    Traverse(obj, fnc, ...args){
        if(obj == null){
            return;
        }
        if(obj instanceof Reference){
            if(obj.indexes != null){

                obj.indexes.forEach((idx, index) => {

                    this.Traverse(idx, fnc, ...args);
                });
            }
        }
        else if(obj instanceof Apply){
            this.Traverse(obj.functionApp, fnc, ...args);

            obj.args.forEach((arg, index) => {

                this.Traverse(arg, fnc, ...args);
            });
        }

        fnc(obj, ...args);
    }

    static TraverseRep(obj, fnc, ...args){
        if(obj == null){
            return null;
        }

        if(obj instanceof Reference){
            if(obj.indexes != null){

                obj.indexes.forEach((idx, index) => {

                    obj.indexes[index] = this.TraverseRep(idx, fnc, ...args);
                });
            }
        }    
        else if(obj instanceof Apply){
            obj.functionApp = this.TraverseRep(obj.functionApp, fnc, ...args);

            obj.args.forEach((arg, index) => {

                obj.args[index] = this.TraverseRep(arg, fnc, ...args);
            });
        }

        return fnc(obj, ...args);
    }

    /*
        変数に項を代入します。
    */
    static Subst(root: Term, subst_tbl : Map<Reference, Term>, var_tbl: Map<Variable, Variable> = null) {
        var fnc = function(t: Term, subst_tbl: Map<Reference, Term>, var_tbl: Map<Variable, Variable>){
            if(t instanceof Reference){
                // 変数参照の場合

                var r = Array.from(subst_tbl.keys()).find(x => r.eq(x));
                if(r != undefined){

                    return subst_tbl[r].clone(var_tbl);
                }
            }

            return undefined;
        }

        this.TraverseRep(root, fnc, subst_tbl, var_tbl);
    }

    /*
        指定した名前の変数参照に項を代入します。
    */
    static SubstByName(root: Term, name: string, new_term: Term ) {
        var fnc = function(current: Term, name: string, new_term: Term){
            if(current instanceof Reference && current.name == name){
                // 指定した名前の変数参照の場合

                return new_term.clone(null);
            }

            return current;
        }

        this.TraverseRep(root, fnc, name, new_term);
    }

    /*
        指定した名前の変数参照のリストを返す。
    */
    RefsByName(root: Term, name: string) : Reference[] {
        var fnc = function(current: Term, name: string, refs: Reference[]){
            if(current instanceof Reference && current.name == name){
                // 指定した名前の変数参照の場合

                refs.push(current);
            }
        }

        var refs: Reference[] = [];

        this.Traverse(root, fnc, name, refs);

        return refs;
    }

    /*
        検索対象の項を指定した項に置換します。
    */
    static ReplaceTerm(root: Term, old_term: Term, new_term: Term ) {
        var fnc = function(current: Term, old_term: Term, new_term: Term){
            if(current.eq(old_term)){
                // 検索対象の項と同じ場合

                return new_term.clone(null);
            }

            return current;
        }

        this.TraverseRep(root, fnc, old_term, new_term);
    }

    /*
        数式の簡約化
    
    SimplifyExpression(t1: Term) : Term{
        return TraverseRep(t1,
            delegate (object obj, out object ret) {
                ret = obj;

                if (obj instanceof Apply) {
                    // 関数適用の場合

                    Apply app = obj as Apply;

                    // 引数を簡約化します。
                    Term[] args1 = (from t in app.args select SimplifyExpression(t)).ToArray();


                    if (app.IsAdd() || app.IsMul()) {

                        List<Term> args2 = new List<Term>();

                        foreach (Term t2 in args1) {
                            if (t2 instanceof Apply && (t2 as Apply).functionApp.varRef == app.functionApp.varRef) {
                                // 引数が同じ演算の場合

                                args2.AddRange(t2.AsApply().args);
                            }
                            else {
                                // 引数が加算や減算でない場合

                                args2.Add(t2);
                            }
                        }

                        for (int i = 0; i < args2.Count; i++) {

                            for (int j = i + 1; j < args2.Count;) {
                                if (args2[i].EqBody(args2[j])) {
                                    // 本体が同じ項がある場合

                                    if (app.IsAdd()) {
                                        // 加算の場合

                                        // 係数を加算します。
                                        args2[i].Value += args2[j].Value;
                                    }
                                    else {
                                        // 乗算の場合

                                        // 係数を乗算します。
                                        args2[i].Value *= args2[j].Value;
                                    }

                                    // 同じ項を取り除きます。
                                    args2.RemoveAt(j);
                                }
                                else {
                                    // 同じ項がない場合

                                    j++;
                                }
                            }
                        }

                        if (app.IsAdd()) {
                            // 加算の場合

                            // 係数が0の項を除きます。
                            Term[] args3 = (from t in args2 where t.Value != 0 select t).ToArray();

                            switch (args3.length) {
                            case 0:
                                ret = Zero();
                                return true;

                            case 1:
                                ret = args3[0];

                                return true;

                            default:
                                ret = Add(args3);
                                return true;
                            }
                        }
                        else {
                            // 乗算の場合

                            // 引数の係数をすべてかけてまとめます。
                            double n = (from t in args2 select t.Value).Aggregate((x, y) => x * y);
                            foreach (Term t in args2) {
                                t.Value = 1;
                            }

                            if (n == 0) {
                                // 係数の積が0の場合

                                // 結果は0
                                ret = Zero();
                                return true;
                            }

                            // 定数を除きます。
                            Term[] args3 = (from t in args2 where !(t instanceof Number) select t).ToArray();

                            switch (args3.length) {
                            case 0:
                                console.assert(args2.Count == 1 && args2[0] instanceof Number && (args2[0] as Number).Value == 1);

                                ret = One();
                                break;

                            case 1:
                                ret = args3[0];
                                break;

                            default:
                                ret = Mul(args3);
                                break;
                            }

                            (ret as Term).Value = app.Value * n;
                            return true;
                        }
                    }

                    ret = new Apply(app.functionApp.varRef, args1);

                    return true;
                }

                return false;
            }) as Term;
    }
    */
}
}