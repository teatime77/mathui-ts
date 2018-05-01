class SyntaxException extends Error {

}

class Parser {
    tokenPos:number = 0;
    nextToken:Token = null;
    currentToken:Token = null;

    tokenList : Token[];
    eotToken : Token = new Token(TokenType.EOT, TokenSubType.Unknown, null, -1, -1);

    simpleTypes : Class[] = new Array<Class>();
    arrayTypes : ArrayType[] = new Array<ArrayType>();

    constructor(){
        this.simpleTypes.push(IntClass);
        this.simpleTypes.push(RealClass);
    }

    GetCurrentToken() : Token {
        return this.currentToken;
    }

     ReadNextToken(): Token{
        var  current_token:Token = this.currentToken;

        this.currentToken = this.nextToken;

        // トークンの位置を1つ進めます。
        this.tokenPos++;

        if (this.tokenPos + 1 < this.tokenList.length) {

            this.nextToken = this.tokenList[this.tokenPos + 1];
        }
        else{

            this.nextToken = this.eotToken;
        }

        return current_token;
    }

     GetToken( text:string):Token {
        if(this.currentToken.text != text) {

            throw new SyntaxException();
        }

        return this.ReadNextToken();
    }

     GetTokenT( type:TokenType):Token {
        if (type != TokenType.Any && type != this.currentToken.typeTkn) {

            throw new SyntaxException();
        }

        return this.ReadNextToken();
    }

    GetSimpleType(name : string) : Class{
        var v = this.simpleTypes.filter(x => x.name == name);
        console.assert(0 < v.length);
        return v[0];
    }

    GetArrayType(element_type : Class, dim_cnt : number) : ArrayType {
        var v = this.arrayTypes.filter(c => c.elementType == element_type && c.dimCnt == dim_cnt);
        if (0 < v.length){

            return v[0];
        }

        var type : ArrayType = new ArrayType(element_type, dim_cnt);
        this.arrayTypes.push(type);

        return type;
    }

    /*
        型を読みます。
    */
    ReadType() : Class{
        var type_id : Token = this.GetTokenT(TokenType.Identifier);

        if (this.currentToken.text != "[") {
            // 配列でない場合

            return this.GetSimpleType(type_id.text);
        }
        else { 
            // 配列の場合

            this.GetToken("[");

            var dim_cnt : number = 1;

            this.currentToken = this.GetCurrentToken(); // TS2365: Operator '==' cannot be applied to types '"["' and '"]"'.
            while (this.currentToken.text == ",") {
                dim_cnt++;
                this.GetToken(",");
            }

            this.GetToken("]");

            var element_type : Class = this.GetSimpleType(type_id.text);

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
        return new Variable(id.text, type, null);
    }

    /*
        変数参照を読みます。
    */
    ReadReference() : Reference {
        var id : Token = this.GetTokenT(TokenType.Identifier);

        if(this.currentToken.text != "[") {
            // 配列でない場合

            // 変数参照を返します。
            return new Reference(id.text, null, null);
        }
        else {
            // 配列の場合

            this.GetToken("[");

            var idxes : Term[] = new Array<Term>();
            while (true) {
                // 配列の添え字の式を読みます。
                var idx : Term = this.ReadExpression();

                idxes.push(idx);

                this.currentToken = this.GetCurrentToken(); // TS2365: Operator '==' cannot be applied to types '"["' and '"]"'.
                if (this.currentToken.text == "]") {
                    break;
                }
                this.GetToken(",");
            }
            this.GetToken("]");

            // 配列の変数参照を返します。
            return new Reference(id.text, null, idxes);
        }
    }

    /*
        実引数を読みます。
    */
    ReadArgs() : Term[] {
        var terms : Term[] = new Array<Term>();
        this.GetToken("(");

        if (this.currentToken.text != ")") {

            while (true) {
                // 式を読みます。
                terms.push(this.ReadExpression());

                if (this.currentToken.text == ")") {

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
        if(this.currentToken.typeTkn == TokenType.Identifier) {
            // 変数参照を読みます。
            var r : Reference = this.ReadReference();

            if(this.currentToken.text != "(") {

                // 変数参照を返します。
                return r;
            }

            // 実引数を読みます。
            var args : Term[] = this.ReadArgs();

            // 関数適用を返します。
            return new Apply(r, args);
        }
        else if (this.currentToken.typeTkn == TokenType.Number) {
            // 数値の場合

            var num : Token = this.GetTokenT(TokenType.Number);

            // 数値を返します。
            return new Constant(num.text, num.subType);
        }
        else if (this.currentToken.text == "(") {

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
        if (this.currentToken.text == "-") {
            // 負号の場合

            this.GetToken("-");

            // 基本の式を読みます。
            var t1 : Term = this.PrimaryExpression();

            // 符号を反転します。
            t1.value *= -1;

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

        while (this.currentToken.text == "*" || this.currentToken.text == "/") {

            // 現在の演算子を保存します。
            var opr : string = this.currentToken.text;

            var args : Term[] = new Array<Term>();
            args.push(t1);

            while (this.currentToken.text == opr) {
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

        while (this.currentToken.text == "+" || this.currentToken.text == "-") {
            // 現在の演算子を保存します。
            var opr : string = this.currentToken.text;

            var args : Term[] = new Array<Term>();
            args.push(t1);

            while(this.currentToken.text == opr) {
                // 現在のトークンが保存した演算子と同じ場合

                this.GetToken(opr);

                // 乗算/除算の式を読みます。
                args.push( this.MultiplicativeExpression() );
            }

            if(opr == "-") {
                // 減算の場合

                // 2番目以降の項の符号を反転します。
                for (var i : number = 1; i < args.length; i++) {

                    args[i].value *= -1;
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

        while(this.currentToken.text != ";"){
            var va = this.ReadVariable();
            dcl.variables.push(va);
        }

        this.GetToken(";");

        return dcl;
    }

    ReadStatement(){
        if(this.currentToken == this.eotToken){
            return null;
        }
        else if(this.currentToken.text == "var"){
            return this.ReadVariableDeclaration();
        }
        else{
            return this.ReadPredicate();
        }
    }

    parse(token_list:Token[]){
        this.tokenList = token_list;
        this.tokenPos = 0;
        this.currentToken = token_list[0];
        this.nextToken = token_list[1];

        var pred : Predicate = new Predicate();
        for(;;){
            var stmt = this.ReadStatement();
            if(stmt == null){
                break;
            }
        }
    }
}