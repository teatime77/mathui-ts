
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

enum TokenType{
    unknown,

    // 識別子
    identifier,

    // クラス
    Class,

    // 数値
    Number,

    // 記号
    symbol,

    // 予約語
    reservedWord,

    // End Of Text
    eot,

    // 指定なし
    any,

    // 行コメント
    lineComment,

    // ブロックコメント
    blockComment,

    // 改行
    newLine,

    // 文字列
    String,

    // 文字
    character,

    // 不正
    illegal
}
