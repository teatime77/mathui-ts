class SyntaxException extends Error {

}

class Parser {
    TokenPos:number = 0;
    NextToken:Token = null;
    CurrentToken:Token = null;

    TokenList : Token[];
    EOTToken : Token = new Token(TokenType.EOT, TokenSubType.Unknown, null, -1, -1);

    SimpleTypes : Class[] = new Array<Class>();
    ArrayTypes : ArrayType[] = new Array<ArrayType>();

    constructor(){
        this.SimpleTypes.push(IntClass);
        this.SimpleTypes.push(RealClass);
    }

    GetCurrentToken() : Token {
        return this.CurrentToken;
    }

     ReadNextToken(): Token{
        var  current_token:Token = this.CurrentToken;

        this.CurrentToken = this.NextToken;

        // トークンの位置を1つ進めます。
        this.TokenPos++;

        if (this.TokenPos + 1 < this.TokenList.length) {

            this.NextToken = this.TokenList[this.TokenPos + 1];
        }
        else{

            this.NextToken = this.EOTToken;
        }

        return current_token;
    }

     GetToken( text:string):Token {
        if(this.CurrentToken.Text != text) {

            throw new SyntaxException();
        }

        return this.ReadNextToken();
    }

     GetTokenT( type:TokenType):Token {
        if (type != TokenType.Any && type != this.CurrentToken.TypeTkn) {

            throw new SyntaxException();
        }

        return this.ReadNextToken();
    }

    GetSimpleType(name : string) : Class{
        var v = this.SimpleTypes.filter(x => x.Name == name);
        console.assert(0 < v.length);
        return v[0];
    }

    GetArrayType(element_type : Class, dim_cnt : number) : ArrayType {
        var v = this.ArrayTypes.filter(c => c.ElementType == element_type && c.DimCnt == dim_cnt);
        if (0 < v.length){

            return v[0];
        }

        var type : ArrayType = new ArrayType(element_type, dim_cnt);
        this.ArrayTypes.push(type);

        return type;
    }

    /*
        型を読みます。
    */
    ReadType() : Class{
        var type_id : Token = this.GetTokenT(TokenType.Identifier);

        if (this.CurrentToken.Text != "[") {
            // 配列でない場合

            return this.GetSimpleType(type_id.Text);
        }
        else { 
            // 配列の場合

            this.GetToken("[");

            var dim_cnt : number = 1;

            this.CurrentToken = this.GetCurrentToken(); // TS2365: Operator '==' cannot be applied to types '"["' and '"]"'.
            while (this.CurrentToken.Text == ",") {
                dim_cnt++;
                this.GetToken(",");
            }

            this.GetToken("]");

            var element_type : Class = this.GetSimpleType(type_id.Text);

            return this.GetArrayType(element_type, dim_cnt);
        }
    }

    /*
        変数宣言を読みます。
    */
    ReadVariable() : Variable {
        // 変数名を読みます。
        var id : Token = this.GetTokenT(TokenType.Identifier);

        this.GetToken(":");

        // 型を読みます。
        var type : Class = this.ReadType();

        // 変数を返します。
        return new Variable(id.Text, type, null);
    }

    /*
        変数参照を読みます。
    */
    ReadReference() : Reference {
        var id : Token = this.GetTokenT(TokenType.Identifier);

        if(this.CurrentToken.Text != "[") {
            // 配列でない場合

            // 変数参照を返します。
            return new Reference(id.Text, null, null);
        }
        else {
            // 配列の場合

            this.GetToken("[");

            var idxes : Term[] = new Array<Term>();
            while (true) {
                // 配列の添え字の式を読みます。
                var idx : Term = this.ReadExpression();

                idxes.push(idx);

                this.CurrentToken = this.GetCurrentToken(); // TS2365: Operator '==' cannot be applied to types '"["' and '"]"'.
                if (this.CurrentToken.Text == "]") {
                    break;
                }
                this.GetToken(",");
            }
            this.GetToken("]");

            // 配列の変数参照を返します。
            return new Reference(id.Text, null, idxes);
        }
    }

    /*
        実引数を読みます。
    */
    ReadArgs() : Term[] {
        var terms : Term[] = new Array<Term>();
        this.GetToken("(");

        if (this.CurrentToken.Text != ")") {

            while (true) {
                // 式を読みます。
                terms.push(this.ReadExpression());

                if (this.CurrentToken.Text == ")") {

                    break;
                }
                this.GetToken(",");
            }
        }
        this.GetToken(")");

        return terms;

    }


        /*
            基本の式を読みます。
        */
    PrimaryExpression(): Term{
        if(this.CurrentToken.TypeTkn == TokenType.Identifier) {
            // 変数参照を読みます。
            var r : Reference = this.ReadReference();

            if(this.CurrentToken.Text != "(") {

                // 変数参照を返します。
                return r;
            }

            // 実引数を読みます。
            var args : Term[] = this.ReadArgs();

            // 関数適用を返します。
            return new Apply(r, args);
        }
        else if (this.CurrentToken.TypeTkn == TokenType.Number) {
            // 数値の場合

            var num : Token = this.GetTokenT(TokenType.Number);

            // 数値を返します。
            return new Constant(num.Text, num.SubType);
        }
        else if (this.CurrentToken.Text == "(") {

            this.GetToken("(");

            // 式を読みます。
            var term : Term = this.ReadExpression();
            this.GetToken(")");

            return term;
        }
        else {
            throw new SyntaxException();
        }
    }



        /*
            単項式を読みます。
        */
       UnaryExpression() : Term {
        if (this.CurrentToken.Text == "-") {
            // 負号の場合

            this.GetToken("-");

            // 基本の式を読みます。
            var t1 : Term = this.PrimaryExpression();

            // 符号を反転します。
            t1.Value *= -1;

            return t1;
        }
        else {

            // 基本の式を読みます。
            return this.PrimaryExpression();
        }
    }

    /*
        乗算/除算の式を読みます。
    */
    public MultiplicativeExpression() : Term {
        // 単項式を読みます。
        var t1 : Term = this.UnaryExpression();

        while (this.CurrentToken.Text == "*" || this.CurrentToken.Text == "/") {

            // 現在の演算子を保存します。
            var opr : string = this.CurrentToken.Text;

            var args : Term[] = new Array<Term>();
            args.push(t1);

            while (this.CurrentToken.Text == opr) {
                // 現在のトークンが保存した演算子と同じ場合

                this.GetToken(opr);

                // 単項式を読みます。
                args.push(this.UnaryExpression());
            }

            if (opr == "*") {
                // 乗算の場合

                t1 = new Apply(Reference.FromVariable(MulFnc), args);
            }
            else {
                // 除算の場合

                t1 = new Apply(Reference.FromVariable(DivFnc), args);
            }
        }

        return t1;
    }

    /*
        加算/減算の式を読みます。
    */
    public AdditiveExpression() : Term {
        // 乗算/除算の式を読みます。
        var t1 : Term = this.MultiplicativeExpression();

        while (this.CurrentToken.Text == "+" || this.CurrentToken.Text == "-") {
            // 現在の演算子を保存します。
            var opr : string = this.CurrentToken.Text;

            var args : Term[] = new Array<Term>();
            args.push(t1);

            while(this.CurrentToken.Text == opr) {
                // 現在のトークンが保存した演算子と同じ場合

                this.GetToken(opr);

                // 乗算/除算の式を読みます。
                args.push( this.MultiplicativeExpression() );
            }

            if(opr == "-") {
                // 減算の場合

                // 2番目以降の項の符号を反転します。
                for (var i : number = 1; i < args.length; i++) {

                    args[i].Value *= -1;
                }
            }

            // 加算の関数適用を作ります。
            t1 = new Apply(Reference.FromVariable(AddFnc), args);
        }

        return t1;
    }

    ReadExpression() : Term {
        return this.AdditiveExpression();
    }

    ReadPredicate() : Term {
        var trm : Term = this.ReadExpression();
        this.GetToken(";");

        return trm;
    }

    ReadVariableDeclaration() : VariableDeclaration {
        var dcl : VariableDeclaration = new VariableDeclaration();

        this.GetToken("var");

        while(this.CurrentToken.Text != ";"){
            var va = this.ReadVariable();
            dcl.Variables.push(va);
        }

        this.GetToken(";");

        return dcl;
    }

    ReadStatement(){
        if(this.CurrentToken == this.EOTToken){
            return null;
        }
        else if(this.CurrentToken.Text == "var"){
            return this.ReadVariableDeclaration();
        }
        else{
            return this.ReadPredicate();
        }
    }

    parse(token_list:Token[]){
        this.TokenList = token_list;
        this.TokenPos = 0;
        this.CurrentToken = token_list[0];
        this.NextToken = token_list[1];

        var pred : Predicate = new Predicate();
        for(;;){
            var stmt = this.ReadStatement();
            if(stmt == null){
                break;
            }
        }
    }
}