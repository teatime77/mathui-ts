//import Hello = require("./mod");

class Hello
{
    public Show()
    {
        console.log("Hello!!");
    }

    public getLex(){
        return new Lex();
    }
}

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

var IdList : Array<string> = new  Array<string> (
);

var KeywordMap : Array<string> = new  Array<string> (
);

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

enum TokenType{
    Unknown,

    // 識別子
    Identifier,

    // クラス
    Class,

    // 数値
    Number,

    // 記号
    Symbol,

    // 予約語
    ReservedWord,

    // End Of Text
    EOT,

    // 指定なし
    Any,

    // 行コメント
    LineComment,

    // ブロックコメント
    BlockComment,

    // 改行
    NewLine,

    // 文字列
    String,

    // 文字
    Character,

    // 不正
    Illegal
}

var hello:Hello = new Hello();
hello.Show();