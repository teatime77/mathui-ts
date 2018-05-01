class SyntaxException extends Error {

}

class Parser {
    tokenPos:number = 0;
    nextToken:Token = null;
    currentToken:Token = null;

    tokenList : Token[];
    eotToken : Token = new Token(TokenType.eot, TokenSubType.unknown, null, -1, -1);

    simpleTypes : Class[] = new Array<Class>();
    arrayTypes : ArrayType[] = new Array<ArrayType>();

    constructor(){
        this.simpleTypes.push(IntClass);
        this.simpleTypes.push(RealClass);
    }

    getCurrentToken() : Token {
        return this.currentToken;
    }

    readNextToken(): Token{
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

    getToken( text:string):Token {
        if(this.currentToken.text != text) {

            throw new SyntaxException();
        }

        return this.readNextToken();
    }

    getTokenT( type:TokenType):Token {
        if (type != TokenType.any && type != this.currentToken.typeTkn) {

            throw new SyntaxException();
        }

        return this.readNextToken();
    }

    getSimpleType(name : string) : Class{
        var v = this.simpleTypes.filter(x => x.name == name);
        console.assert(0 < v.length);
        return v[0];
    }

    getArrayType(element_type : Class, dim_cnt : number) : ArrayType {
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
    readType() : Class{
        var type_id : Token = this.getTokenT(TokenType.identifier);

        if (this.currentToken.text != "[") {
            // 配列でない場合

            return this.getSimpleType(type_id.text);
        }
        else { 
            // 配列の場合

            this.getToken("[");

            var dim_cnt : number = 1;

            this.currentToken = this.getCurrentToken(); // TS2365: Operator '==' cannot be applied to types '"["' and '"]"'.
            while (this.currentToken.text == ",") {
                dim_cnt++;
                this.getToken(",");
            }

            this.getToken("]");

            var element_type : Class = this.getSimpleType(type_id.text);

            return this.getArrayType(element_type, dim_cnt);
        }
    }

    /*
        変数宣言を読みます。
    */
    readVariable() : Variable {
        // 変数名を読みます。
        var id : Token = this.getTokenT(TokenType.identifier);

        this.getToken(":");

        // 型を読みます。
        var type : Class = this.readType();

        // 変数を返します。
        return new Variable(id.text, type, null);
    }

    /*
        変数参照を読みます。
    */
    readReference() : Reference {
        var id : Token = this.getTokenT(TokenType.identifier);

        if(this.currentToken.text != "[") {
            // 配列でない場合

            // 変数参照を返します。
            return new Reference(id.text, null, null);
        }
        else {
            // 配列の場合

            this.getToken("[");

            var idxes : Term[] = new Array<Term>();
            while (true) {
                // 配列の添え字の式を読みます。
                var idx : Term = this.readExpression();

                idxes.push(idx);

                this.currentToken = this.getCurrentToken(); // TS2365: Operator '==' cannot be applied to types '"["' and '"]"'.
                if (this.currentToken.text == "]") {
                    break;
                }
                this.getToken(",");
            }
            this.getToken("]");

            // 配列の変数参照を返します。
            return new Reference(id.text, null, idxes);
        }
    }

    /*
        実引数を読みます。
    */
    readArgs() : Term[] {
        var terms : Term[] = new Array<Term>();
        this.getToken("(");

        if (this.currentToken.text != ")") {

            while (true) {
                // 式を読みます。
                terms.push(this.readExpression());

                if (this.currentToken.text == ")") {

                    break;
                }
                this.getToken(",");
            }
        }
        this.getToken(")");

        return terms;

    }


        /*
            基本の式を読みます。
        */
    primaryExpression(): Term{
        if(this.currentToken.typeTkn == TokenType.identifier) {
            // 変数参照を読みます。
            var r : Reference = this.readReference();

            if(this.currentToken.text != "(") {

                // 変数参照を返します。
                return r;
            }

            // 実引数を読みます。
            var args : Term[] = this.readArgs();

            // 関数適用を返します。
            return new Apply(r, args);
        }
        else if (this.currentToken.typeTkn == TokenType.Number) {
            // 数値の場合

            var num : Token = this.getTokenT(TokenType.Number);

            // 数値を返します。
            return new Constant(num.text, num.subType);
        }
        else if (this.currentToken.text == "(") {

            this.getToken("(");

            // 式を読みます。
            var term : Term = this.readExpression();
            this.getToken(")");

            return term;
        }
        else {
            throw new SyntaxException();
        }
    }



        /*
            単項式を読みます。
        */
    unaryExpression() : Term {
        if (this.currentToken.text == "-") {
            // 負号の場合

            this.getToken("-");

            // 基本の式を読みます。
            var t1 : Term = this.primaryExpression();

            // 符号を反転します。
            t1.value *= -1;

            return t1;
        }
        else {

            // 基本の式を読みます。
            return this.primaryExpression();
        }
    }

    /*
        乗算/除算の式を読みます。
    */
    public multiplicativeExpression() : Term {
        // 単項式を読みます。
        var t1 : Term = this.unaryExpression();

        while (this.currentToken.text == "*" || this.currentToken.text == "/") {

            // 現在の演算子を保存します。
            var opr : string = this.currentToken.text;

            var args : Term[] = new Array<Term>();
            args.push(t1);

            while (this.currentToken.text == opr) {
                // 現在のトークンが保存した演算子と同じ場合

                this.getToken(opr);

                // 単項式を読みます。
                args.push(this.unaryExpression());
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
    public additiveExpression() : Term {
        // 乗算/除算の式を読みます。
        var t1 : Term = this.multiplicativeExpression();

        while (this.currentToken.text == "+" || this.currentToken.text == "-") {
            // 現在の演算子を保存します。
            var opr : string = this.currentToken.text;

            var args : Term[] = new Array<Term>();
            args.push(t1);

            while(this.currentToken.text == opr) {
                // 現在のトークンが保存した演算子と同じ場合

                this.getToken(opr);

                // 乗算/除算の式を読みます。
                args.push( this.multiplicativeExpression() );
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

    readExpression() : Term {
        return this.additiveExpression();
    }

    readPredicate() : Term {
        var trm : Term = this.readExpression();
        this.getToken(";");

        return trm;
    }

    readVariableDeclaration() : VariableDeclaration {
        var dcl : VariableDeclaration = new VariableDeclaration();

        this.getToken("var");

        while(this.currentToken.text != ";"){
            var va = this.readVariable();
            dcl.variables.push(va);
        }

        this.getToken(";");

        return dcl;
    }

    readStatement(){
        if(this.currentToken == this.eotToken){
            return null;
        }
        else if(this.currentToken.text == "var"){
            return this.readVariableDeclaration();
        }
        else{
            return this.readPredicate();
        }
    }

    parse(token_list:Token[]) : Statement[]{
        this.tokenList = token_list;
        this.tokenPos = 0;
        this.currentToken = token_list[0];
        this.nextToken = token_list[1];

        var pred : Predicate = new Predicate();
        var stmt_list = new Array<Statement>();
        for(;;){
            var stmt = this.readStatement();
            if(stmt == null){
                return stmt_list;
            }
            stmt_list.push(stmt);
        }
    }
}