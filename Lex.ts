namespace MathUI {

var SymbolTable : Array<string> = new  Array<string> (
    ",",
    ".",
    ";",
    "(",
    ")",
    "[",
    "]",
    "{",
    "}",
    "+",
    "-",
    "*",
    "/",
    "^",
    "%",
    "=",
    ":",
    "<",
    ">",

    "&&",
    "||",

    "+=",
    "-=",
    "*=",
    "/=",
    "%=",
    "!=",

    "++",
    "--",

    "!",
    "&",
    "|",
    "?",
);
    
var KeywordMap : Array<string> = new  Array<string> (
);

var IdList : Array<string> = new  Array<string> (
);
    
function isWhiteSpace(c:string) : boolean {
    return c == ' ' || c == '\t' || c == '\r' || c == '\n';
}

function isLetter(s : string) : boolean {
    return s.length === 1 && ("a" <= s && s <= "z" || "A" <= s && s <= "Z");
}

function isDigit(s : string) : boolean {
    return s.length == 1 && "0123456789".indexOf(s) != -1;
}

function isLetterOrDigit(s : string) : boolean {
    return isLetter(s) || isDigit(s);
}
    
export enum TokenSubType {
    unknown,
    integer,
    float,
    double,
}

export class Token{
    typeTkn:TokenType;
    subType:TokenSubType;
    text:string;
    lineIndex:number;
    charPos:number;

    public constructor(type : TokenType, sub_type : TokenSubType, text : string, line_index : number, char_pos : number){
        //console.log("" + TokenType[type] + " " + TokenSubType[sub_type] + " " + text + " " + char_pos);
        this.typeTkn = type;
        this.subType = sub_type;
        this.text = text;
        this.lineIndex = line_index;
        this.charPos = char_pos;
    }
}

export class Lex{
    public constructor(){
        currentLex = this;
    }

    /*
        字句解析をして各文字の字句型の配列を得ます。
    */
    public lexicalAnalysis(text : string) : Array<Token> {
        var line_idx: number = 0;
        var token_list : Token[] = new Array<Token>();

        // 現在の文字位置
        var pos = 0;

        // 行の先頭位置
        var line_top = 0;

        // 文字列の最後までループします。
        while (pos < text.length) {

            // 字句の開始位置
            var start_pos = pos;

            var token_type = TokenType.unknown;
            var sub_type : TokenSubType = TokenSubType.unknown;
            
            // 改行以外の空白をスキップします。
            for ( ; pos < text.length && text[pos] != '\r' && text[pos] != '\n' && isWhiteSpace(text[pos]); pos++);

            if (text.length <= pos) {
                // テキストの終わりの場合

                break;
            }
            start_pos = pos;

            // 現在位置の文字
            var ch1 : string = text[pos];

            // 次の文字の位置。行末の場合は'\0'
            var ch2 : string;

            if (pos + 1 < text.length) {
                // 行末でない場合

                ch2 = text[pos + 1];
            }
            else {
                // 行末の場合

                ch2 = '\0';
            }

            if (ch1 == '\n') {
                // 改行の場合

                pos++;
                line_top = pos;

                line_idx++;
//                token_type = TokenType.newLine;
                continue;
            }
            else if (isLetter(ch1) || ch1 == '_') {
                // 識別子の最初の文字の場合

                // 識別子の文字の最後を探します。識別子の文字はユニコードカテゴリーの文字か数字か'_'。
                for (pos++; pos < text.length && (isLetterOrDigit(text[pos]) || text[pos] == '_'); pos++);

                // 識別子の文字列
                var name : string = text.substring(start_pos, pos);

                if (KeywordMap.indexOf(name) != -1) {
                    // 名前がキーワード辞書にある場合

                    token_type = TokenType.reservedWord;
                }
                else {
                    // 名前がキーワード辞書にない場合

                    if (IdList.indexOf(name) == -1) {

                        IdList.push(name);
                    }
                    token_type = TokenType.identifier;
                }
            }
            else if (isDigit(ch1)) {
                // 数字の場合

                token_type = TokenType.Number;

                // 10進数の終わりを探します。
                for (; pos < text.length && isDigit(text[pos]); pos++);

                if (pos < text.length && text[pos] == '.') {
                    // 小数点の場合

                    pos++;

                    // 10進数の終わりを探します。
                    for (; pos < text.length && isDigit(text[pos]); pos++);

                    if (text[pos] == 'f') {

                        pos++;
                        sub_type = TokenSubType.float;
                    }
                    else {

                        sub_type = TokenSubType.double;
                    }
                }
                else {

                    sub_type = TokenSubType.integer;
                }
            }
            else if (ch1 == '#' && isDigit(ch2)) {
                // $の後ろに数字がある場合

                token_type = TokenType.metaId;
                
                // 10進数の終わりを探します。
                for (pos++; pos < text.length && (isDigit(text[pos]) || text[pos] == '.'); pos++);
            }
            else if (SymbolTable.indexOf("" + ch1 + ch2) != -1) {
                // 2文字の記号の表にある場合

                token_type = TokenType.symbol;
                pos += 2;
            }
            else if (SymbolTable.indexOf("" + ch1) != -1) {
                // 1文字の記号の表にある場合

                token_type = TokenType.symbol;
                pos++;
            }
            else {
                // 不明の文字の場合

                token_type = TokenType.unknown;
                pos++;
                console.log("不明 {0}", text.substring(start_pos, pos), "");
//                    throw new Exception();
            }

            // 字句の文字列を得ます。
            var s : string = text.substring(start_pos, pos);

            // トークンを作り、トークンのリストに追加します。
            token_list.push(new Token(token_type, sub_type, s, line_idx, start_pos - line_top));

            if(token_type as TokenType == TokenType.illegal) {

                console.log("不正 {0} ^ {1}", text.substring(line_top, start_pos), s, "");
            }
        }

        // 各文字の字句型の配列を返します。
        return token_list;
    }
}

export var currentLex : Lex;
}