// Type is team, boolean or gameResult (0 = loss, 1 = draw, 2 = win)
const passwordMap = [
    /**
    International Elimination Phase game 2
    B~NCD GC5K* K1
    08 04
    08 02
    04 01
    07 01
    03 02
    06 1e
    06 20
    06 1f
    02 02
        */
    {
        passwordFor: "International Elimination Phase game 2",
        values: [
            { bits: 8, default: 0x04, type: "", description: "Header 1" },
            { bits: 8, default: 0x02, type: "", description: "Header 2" },
            { bits: 4, default: 0x01, type: "", description: "Param 1" },
            { bits: 7, default: 0x01, type: "", description: "Param 2" },
            { bits: 3, default: 0x02, type: "", description: "Param 3" },
            { bits: 6, default: 0x1e, type: "team", description: "Player team" },
            { bits: 6, default: 0x20, type: "team", description: "Second team on group" },
            { bits: 6, default: 0x1f, type: "team", description: "Third team on group" },
            { bits: 2, default: 0x02, type: "gameResult", description: "Last game result" }
        ]
    },
    /**
    International Elimination Phase game 3
    B~jCB LBG(diamonds)j =DLBB
    08 05
    08 00
    04 02
    07 00
    03 02
    03 04
    06 1e
    06 0d
    06 16
    06 01
    06 44
    02 00
    02 00
    02 00
    02 00
    */
    {
        passwordFor: "International Elimination Phase game 3",
        values: [
            { bits: 8, default: 0x05, type: "", description: "Header 1" },
            { bits: 8, default: 0x00, type: "", description: "Header 2" },
            { bits: 4, default: 0x02, type: "", description: "Param 1" },
            { bits: 7, default: 0x00, type: "", description: "Param 2" },
            { bits: 3, default: 0x02, type: "", description: "Param 3" },
            { bits: 3, default: 0x04, type: "", description: "Param 4" },
            { bits: 6, default: 0x1e, type: "team", description: "Player team" },
            { bits: 6, default: 0x0d, type: "team", description: "Second team on group" },
            { bits: 6, default: 0x16, type: "team", description: "Third team on group" },
            { bits: 6, default: 0x01, type: "", description: "Param 8" },
            { bits: 6, default: 0x44, type: "", description: "Param 9" },
            { bits: 2, default: 0x00, type: "gameResult", description: "Player last Game result" },
            { bits: 2, default: 0x00, type: "gameResult", description: "Team 1 last Game result" },
            { bits: 2, default: 0x00, type: "gameResult", description: "Team 2 last Game result" },
            { bits: 2, default: 0x00, type: "gameResult", description: "Team 3 last Game result" }
        ]
    },
    /**
    International Preliminary Phase game 1
    B*PCB QCG(diamonds)j =DB-B
    08 04
    08 00
    04 03
    07 01
    03 02
    03 04
    06 1e
    06 0d
    06 16
    06 01
    06 40
    02 02
    02 02
    02 00
    02 00
    */
    {
        passwordFor: "International Preliminary Phase game 1",
        values: [
            { bits: 8, default: 0x04, type: "", description: "Header 1" },
            { bits: 8, default: 0x00, type: "", description: "Header 2" },
            { bits: 4, default: 0x03, type: "", description: "Param 1" },
            { bits: 7, default: 0x01, type: "", description: "Param 2" },
            { bits: 3, default: 0x02, type: "", description: "Param 3" },
            { bits: 3, default: 0x04, type: "", description: "Param 4" },
            { bits: 6, default: 0x1e, type: "team", description: "Player team" },
            { bits: 6, default: 0x0d, type: "", description: "Param 6" },
            { bits: 6, default: 0x16, type: "", description: "Param 7"},
            { bits :6, default: 0x01 ,type: "", description: "Param 8"},
            { bits :6, default: 0x40 ,type: "", description: "Param 9"},
            { bits :2, default: 0x02 ,type: "", description :"Param 10"},
            { bits :2, default: 0x02 ,type: "", description :"Param 11"},
            { bits :2, default: 0x00 ,type: "", description :"Param 12"},
            { bits :2, default: 0x00 ,type: "", description :"Param 13"}
        ]
    },
    /**
    International Preliminary Phase game 2
    B(spades)JCB VDG(diamonds)j =DB-N
    08 04
    08 00
    04 04
    07 02
    03 02
    03 04
    06 1e
    06 0d
    06 16
    06 01
    06 40
    02 02
    02 02
    02 02
    02 02
    */
    {
        passwordFor: "International Preliminary Phase game 2",
        values: [
            { bits: 8, default: 0x04, type: "", description: "Header 1" },
            { bits: 8, default: 0x00, type: "", description: "Header 2" },
            { bits: 4, default: 0x04, type: "", description: "Param 1" },
            { bits: 7, default: 0x02, type: "", description: "Param 2" },
            { bits: 3, default: 0x02, type: "", description: "Param 3" },
            { bits: 3, default: 0x04, type: "", description: "Param 4" },
            { bits: 6, default: 0x1e, type: "team", description: "Player team" },
            { bits: 6, default: 0x0d, type: "", description: "Param 6" },
            { bits: 6, default: 0x16, type: "", description: "Param 7"},
            { bits: 6, default :0x01, type: "", description: "Param 8"},
            { bits: 6, default :0x40, type: "", description: "Param 9"},
            { bits: 2, default :0x02, type: "", description: "Param 10"},
            { bits: 2, default :0x02, type: "", description: "Param 11"},
            { bits: 2, default :0x02, type: "", description: "Param 12"},
            { bits: 2, default :0x02, type: "", description: "Param 13"}
        ]
    },
    /**
    International cup Phase game 1
    BLWFB bF5(arrowup)~ ?*DVL $7F!4
    5B3f" (heart)(heart)(heart)(heart)(heart) (heart)(heart)(heart)(heart)(heart) (heart)(heart)(heart)T
    08 0d
    08 40
    04 05
    07 03
    03 02
    06 1e
    06 03
    06 13
    06 23
    06 0b
    06 00
    06 21
    06 04
    06 1b
    06 0e
    06 14
    06 0f
    06 12
    06 02
    06 08
    06 1e
    06 0d
    06 7f
    06 7f
    06 7f
    06 7f
    06 7f
    06 7f
    06 7f
    06 7f
    06 7f
    06 7f
    06 7f
    06 7f
    06 7f
    06 7f
    */
    {
        passwordFor: "International cup Phase game 1",
        values: [
            { bits: 8, default: 0x0d, type: "", description: "Header 1" },
            { bits: 8, default: 0x40, type: "", description: "Header 2" },
            { bits: 4, default: 0x05, type: "", description: "Param 1" },
            { bits: 7, default: 0x03, type: "", description: "Param 2" },
            { bits: 3, default: 0x02, type: "", description: "Param 3" },
            { bits: 6, default: 0x1e, type: "team", description: "Player team" },
            { bits: 6, default: 0x03, type: "", description: "Param 5" },
            { bits: 6, default: 0x13, type: "", description: "Param 6" },
            { bits: 6, default: 0x23, type: "", description: "Param 7"},
            { bits: 6, default: 0x0b, type: "", description: "Param 8"},
            { bits: 6, default: 0x00, type: "", description: "Param 9"},
            { bits: 6, default: 0x21, type: "", description: "Param 10"},
            { bits: 6, default: 0x04, type: "", description: "Param 11"},
            { bits: 6, default: 0x1b, type: "", description: "Param 12"},
            { bits: 6, default: 0x0e, type: "", description: "Param 13"},
            { bits: 6, default: 0x14, type: "", description: "Param 14"},
            { bits: 6, default: 0x0f, type: "", description: "Param 15"},
            { bits: 6, default: 0x12, type: "", description: "Param 16"},
            { bits: 6, default: 0x02, type: "", description: "Param 17"},
            { bits: 6, default: 0x08, type: "", description: "Param 18"},
            { bits: 6, default: 0x1e, type: "", description: "Param 19"},
            { bits: 6, default: 0x0d, type: "", description: "Param 20"},
            { bits: 6, default: 0x7f, type: "", description: "Param 21"},
            { bits: 6, default: 0x7f, type: "", description: "Param 22"},
            { bits: 6, default: 0x7f, type: "", description: "Param 23"},
            { bits: 6, default: 0x7f, type: "", description: "Param 24"},
            { bits: 6, default: 0x7f, type: "", description: "Param 25"},
            { bits: 6, default: 0x7f, type: "", description: "Param 26"},
            { bits: 6, default: 0x7f, type: "", description: "Param 27"},
            { bits: 6, default: 0x7f, type: "", description: "Param 28"},
            { bits: 6, default: 0x7f, type: "", description: "Param 29"},
            { bits: 6, default: 0x7f, type: "", description: "Param 30"},
            { bits: 6, default: 0x7f, type: "", description: "Param 31"},
            { bits: 6, default: 0x7f, type: "", description: "Param 32"},
            { bits: 6, default: 0x7f, type: "", description: "Param 33"},
            { bits: 6, default: 0x7f, type: "", description: "Param 34"}
        ]
    },
    /**
    International cup Quarterfinals
    BQJFB hD5(arrowup)~ (heart)*(heart)0* (heart)(arrow down)T!"
    >~(heart)0" ?DB24 G3(arrow up)(heart)(heart) (heart)(heart)(heart)T
    08 0c
    08 40
    04 06
    07 02
    03 02
    06 1e
    06 03
    06 7f
    06 23
    06 7f
    06 7f
    06 21
    06 7f
    06 1b
    06 7f
    06 14
    06 0f
    06 7f
    06 02
    06 7f
    06 7f
    06 0d
    06 13
    06 0b
    06 00
    06 04
    06 0e
    06 12
    06 08
    06 1e
    06 7f
    06 7f
    06 7f
    06 7f
    06 7f
    06 7f   
    */
    {
        passwordFor: "International cup Quarterfinals",
        values: [
            { bits: 8, default: 0x0c, type: "", description: "Header 1" },
            { bits: 8, default: 0x40, type: "", description: "Header 2" },
            { bits: 4, default: 0x06, type: "", description: "Param 1" },
            { bits: 7, default: 0x02, type: "", description: "Param 2" },
            { bits: 3, default: 0x02, type: "", description: "Param 3" },
            { bits: 6, default: 0x1e, type: "team", description: "Player team" },
            { bits: 6, default: 0x03, type: "", description: "Param 5" },
            { bits: 6, default: 0x7f, type: "", description: "Param 6" },
            { bits: 6, default: 0x23, type: "", description: "Param 7"},
            { bits: 6, default: 0x7f, type: "", description: "Param 8"},
            { bits: 6, default: 0x7f, type: "", description: "Param 9"},
            { bits: 6, default: 0x21, type: "", description: "Param 10"},
            { bits: 6, default: 0x7f, type: "", description: "Param 11"},
            { bits: 6, default: 0x1b, type: "", description: "Param 12"},
            { bits: 6, default: 0x7f, type: "", description: "Param 13"},
            { bits: 6, default: 0x14, type: "", description: "Param 14"},
            { bits: 6, default: 0x0f, type: "", description: "Param 15"},
            { bits: 6, default: 0x7f, type: "", description: "Param 16"},
            { bits: 6, default: 0x02, type: "", description: "Param 17"},
            { bits: 6, default: 0x7f, type: "", description: "Param 18"},
            { bits: 6, default :0x0d, type: "", description: "Param 19"},
            { bits: 6, default :0x13, type: "", description: "Param 20"},
            { bits: 6, default :0x0b, type: "", description: "Param 21"},
            { bits: 6, default :0x00, type: "", description: "Param 22"},
            { bits: 6, default :0x04, type: "", description: "Param 23"},
            { bits: 6, default :0x0e, type: "", description: "Param 24"},
            { bits: 6, default :0x12, type: "", description: "Param 25"},
            { bits: 6, default :0x08, type: "", description: "Param 26"},
            { bits: 6, default :0x1e, type: "", description: "Param 27"},
            { bits: 6, default :0x7f, type: "", description: "Param 28"},
            { bits: 6, default :0x7f, type: "", description: "Param 29"},
            { bits: 6, default :0x7f, type: "", description: "Param 30"},
            { bits: 6, default :0x7f, type: "", description: "Param 31"},
            { bits: 6, default :0x7f, type: "", description: "Param 32"},
            { bits: 6, default :0x7f, type: "", description: "Param 33"},
            { bits: 6, default :0x7f, type: "", description: "Param 34"}
        ]
    },
    /**
    International cup Semifinals
    BLHFL rC5(arrowup)~ (heart)*(heart)0* (heart)(arrowdown)T!"
    >~(heart)0" ?T~>" T:(heart)D2 5(arrowup)(heart)T
    08 0c
    08 48
    04 07
    07 01
    03 02
    06 1e
    06 03
    06 7f
    06 23
    06 7f
    06 7f
    06 21
    06 7f
    06 1b
    06 7f
    06 14
    06 0f
    06 7f
    06 02
    06 7f
    06 7f
    06 0d
    06 13
    06 7f
    06 00
    06 7f
    06 0e
    06 7f
    06 08
    06 7f
    06 0b
    06 04
    06 12
    06 1e
    06 7f
    06 7f
    */ 
    {
        passwordFor: "International cup Semifinals",
        values: [
            { bits: 8, default: 0x0c, type: "", description: "Header 1" },
            { bits: 8, default: 0x48, type: "", description: "Header 2" },
            { bits: 4, default: 0x07, type: "", description: "Param 1" },
            { bits: 7, default: 0x01, type: "", description: "Param 2" },
            { bits: 3, default: 0x02, type: "", description: "Param 3" },
            { bits: 6, default: 0x1e, type: "team", description: "Player team" },
            { bits: 6, default: 0x03, type: "", description: "Param 5" },
            { bits: 6, default: 0x7f, type: "", description: "Param 6" },
            { bits: 6, default: 0x23, type: "", description: "Param 7"},
            { bits: 6, default: 0x7f, type: "", description: "Param 8"},
            { bits: 6, default: 0x7f, type: "", description: "Param 9"},
            { bits: 6, default: 0x21, type: "", description: "Param 10"},
            { bits: 6, default: 0x7f, type: "", description: "Param 11"},
            { bits: 6, default: 0x1b, type: "", description: "Param 12"},
            { bits: 6, default: 0x7f, type: "", description: "Param 13"},
            { bits: 6, default: 0x14, type: "", description: "Param 14"},
            { bits: 6, default: 0x0f, type: "", description: "Param 15"},
            { bits: 6, default: 0x7f, type: "", description: "Param 16"},
            { bits: 6, default: 0x02, type: "", description: "Param 17"},
            { bits: 6, default: 0x7f, type: "", description: "Param 18"},
            { bits: 6, default: 0x0d, type: "", description: "Param 19"},
            { bits: 6, default: 0x13, type: "", description: "Param 20"},
            { bits: 6, default: 0x7f, type: "", description: "Param 21"},
            { bits: 6, default: 0x00, type: "", description: "Param 22"},
            { bits: 6, default: 0x7f, type: "", description: "Param 23"},
            { bits: 6, default: 0x0e, type: "", description: "Param 24"},
            { bits: 6, default: 0x7f, type: "", description: "Param 25"},
            { bits: 6, default: 0x08, type: "", description: "Param 26"},
            { bits: 6, default: 0x7f, type: "", description: "Param 27"},
            { bits: 6, default: 0x0b, type: "", description: "Param 28"},
            { bits: 6, default: 0x04, type: "", description: "Param 29"},
            { bits: 6, default: 0x12, type: "", description: "Param 30"},
            { bits: 6, default: 0x1e, type: "", description: "Param 31"},
            { bits: 6, default: 0x7f, type: "", description: "Param 32"},
            { bits: 6, default: 0x7f, type: "", description: "Param 33"},
            { bits: 6, default: 0x7f, type: "", description: "Param 34"}
        ]
    },
    /**
    International cup Final
    B(spades)BKB 2B5(arrowup)~ (heart)*(heart)0* (heart)(downarrow)T!"
    >~(heart)0" ?T~>" T:(heart)T2 ?(heart)3K
    08 1c
    08 40
    04 08
    07 00
    03 02
    06 1e
    06 03
    06 7f
    06 23
    06 7f
    06 7f
    06 21
    06 7f
    06 1b
    06 7f
    06 14
    06 0f
    06 7f
    06 02
    06 7f
    06 7f
    06 0d
    06 13
    06 7f
    06 00
    06 7f
    06 0e
    06 7f
    06 08
    06 7f
    06 7f
    06 04
    06 12
    06 7f
    06 0b
    06 1e
    */
    {
        passwordFor: "International cup Final",
        values: [
            { bits: 8, default: 0x1c, type: "", description: "Header 1" },
            { bits: 8, default: 0x40, type: "", description: "Header 2" },
            { bits: 4, default: 0x08, type: "", description: "Param 1" },
            { bits: 7, default: 0x00, type: "", description: "Param 2" },
            { bits: 3, default: 0x02, type: "", description: "Param 3" },
            { bits: 6, default: 0x1e, type: "", description: "Param 4" },
            { bits: 6, default: 0x03, type: "", description: "Param 5" },
            { bits: 6, default: 0x7f, type: "", description: "Param 6" },
            { bits: 6, default: 0x23, type: "", description: "Param 7"},
            { bits: 6, default: 0x7f, type: "", description: "Param 8"},
            { bits: 6, default: 0x7f, type: "", description: "Param 9"},
            { bits: 6, default: 0x21, type: "", description: "Param 10"},
            { bits: 6, default: 0x7f, type: "", description: "Param 11"},
            { bits: 6, default: 0x1b, type: "", description: "Param 12"},
            { bits: 6, default: 0x7f, type: "", description: "Param 13"},
            { bits: 6, default: 0x14, type: "", description: "Param 14"},
            { bits: 6, default: 0x0f, type: "", description: "Param 15"},
            { bits: 6, default: 0x7f, type: "", description: "Param 16"},
            { bits: 6, default :0x02, type: "", description: "Param 17"},   
            { bits: 6, default :0x7f, type: "", description: "Param 18"},
            { bits: 6, default :0x7f, type: "", description: "Param 19"},
            { bits: 6, default :0x0d, type: "", description: "Param 20"},
            { bits: 6, default :0x13, type: "", description: "Param 21"},
            { bits: 6, default :0x7f, type: "", description: "Param 22"},
            { bits: 6, default :0x00, type: "", description: "Param 23"},
            { bits: 6, default :0x7f, type: "", description: "Param 24"},
            { bits: 6, default :0x0e, type: "", description: "Param 25"},
            { bits: 6, default :0x7f, type: "", description: "Param 26"},
            { bits: 6, default :0x08, type: "", description: "Param 27"},
            { bits: 6, default :0x7f, type: "", description: "Param 28"},
            { bits: 6, default :0x7f, type: "", description: "Param 29"},
            { bits: 6, default :0x04, type: "", description: "Param 30"},
            { bits: 6, default :0x12, type: "", description: "Param 31"},
            { bits: 6, default :0x7f, type: "", description: "Param 32"},
            { bits: 6, default :0x0b, type: "team", description: "Other finalist team"},
            { bits: 6, default :0x1e, type: "team", description: "Player team" }
        ]
    },
    /*
    Scenarios
    BZMBV GB1CB BBBBB BBBBB
    BBBBF BB
    08 00
    08 10
    08 01
    08 80
    08 01
    08 00
    08 00
    08 00
    08 00
    08 00
    08 00
    08 00
    08 00
    08 00
    08 00
    08 00
    08 03
    08 00
    */
    {
        passwordFor: "Scenarios",
        values: [
            { bits: 8, default: 0x00, type: "", description: "Header 1" },
            { bits: 8, default: 0x10, type: "", description: "Header 2" },
            { bits: 8, default: 0x01, type: "", description: "Param 1" },
            { bits: 8, default: 0x80, type: "", description: "Param 2" },
            { bits: 8, default: 0x01, type: "", description: "Param 3" },
            { bits: 8, default: 0x00, type: "", description: "Param 4" },
            { bits: 8, default: 0x00, type: "", description: "Param 5" },
            { bits: 8, default: 0x00, type: "", description: "Param 6" },
            { bits: 8, default: 0x00, type: "", description: "Param 7" },
            { bits: 8, default: 0x00, type: "", description: "Param 8" },
            { bits: 8, default: 0x00, type: "", description: "Param 9" },
            { bits: 8, default: 0x00, type: "", description: "Param 10" },
            { bits: 8, default: 0x00, type: "", description: "Param 11" },
            { bits: 8, default: 0x00, type: "", description: "Param 12" },
            { bits: 8, default: 0x00, type: "", description: "Param 13" },
            { bits: 8, default: 0x03, type: "", description: "Param 14" },
            { bits: 8, default: 0x00, type: "", description: "Param 15" }
        ]
    },
    /*
    World series 6th game
    B-LLB GB$(pi)V FB1ML BQVZV
    VGBLG VLLGZ ZGQLL LQVLG
    QZQBQ ZGQBB
    08 20
    08 00
    04 01
    04 00
    04 04
    07 3c
    06 05
    03 02
    03 03
    07 00
    07 00
    03 03
    06 02
    06 02
    06 00
    06 03
    06 04
    06 05
    06 04
    06 04
    06 01
    06 00
    06 02
    06 01
    06 04
    06 02
    06 02
    06 01
    06 05
    06 05
    06 01
    06 03
    06 02
    06 02
    06 02
    06 03
    06 04
    06 02
    06 01
    06 03
    06 05
    06 03
    06 00
    06 03
    06 05
    06 01
    06 03
    06 00
    */
    {
        passwordFor: "World series",
        values: [
            { bits: 8, default: 0x20, type: "", description: "Header 1" },
            { bits: 8, default: 0x00, type: "", description: "Header 2" },
            { bits: 4, default: 0x01, type: "", description: "Param 1" },
            { bits: 4, default: 0x00, type: "", description: "Param 2" },
            { bits: 4, default: 0x04, type: "", description: "Param 3" },
            { bits: 7, default: 0x3c, type: "", description: "Param 4" },
            { bits: 6, default: 0x05, type: "", description: "Game count" },
            { bits: 3, default: 0x02, type: "", description: "Param 6" },
            { bits: 3, default: 0x03, type: "", description: "Param 7" },
            { bits: 7, default: 0x00, type: "", description: "Param 8" },
            { bits: 7, default: 0x00, type: "", description: "Param 9" },
            { bits: 3, default: 0x03, type: "", description: "Param 10" },
            { bits: 6, default: 0x02, type: "", description: "Param 11" },
            { bits: 6, default: 0x02, type: "", description: "Param 12" },
            { bits: 6, default: 0x00, type: "", description: "Param 13" },
            { bits: 6, default: 0x03, type: "", description: "Param 14" },
            { bits: 6, default: 0x04, type: "", description: "Param 15" },
            { bits: 6, default: 0x05, type: "", description: "Param 16" },
            { bits: 6, default: 0x04, type: "", description: "Param 17" },
            { bits: 6, default: 0x04, type: "", description: "Param 18" },
            { bits: 6, default: 0x01, type: "", description: "Param 19" },
            { bits: 6, default: 0x00, type: "", description: "Param 20" },
            { bits: 6, default: 0x02, type: "", description: "Param 21" },
            { bits: 6, default: 0x01, type: "", description: "Param 22" },
            { bits: 6, default: 0x04, type: "", description: "Param 23" },
            { bits: 6, default: 0x02, type: "", description: "Param 24" },
            { bits: 6, default: 0x02, type: "", description: "Param 25" },
            { bits: 6, default: 0x01, type: "", description: "Param 26" },
            { bits: 6, default: 0x05, type: "", description: "Param 27" },
            { bits: 6, default: 0x05, type: "", description: "Param 28" },
            { bits: 6, default: 0x01, type: "", description: "Param 29" },
            { bits: 6, default: 0x03, type: "", description: "Param 30" },
            { bits: 6, default: 0x02, type: "", description: "Param 31" },
            { bits: 6, default: 0x02, type: "", description: "Param 32" },
            { bits: 6, default: 0x02, type: "", description: "Param 33" },
            { bits: 6, default: 0x03, type: "", description: "Param 34" },
            { bits: 6, default: 0x04, type: "", description: "Param 35" },
            { bits: 6, default: 0x02, type: "", description: "Param 36" },
            { bits: 6, default: 0x01, type: "", description: "Param 37" },
            { bits: 6, default: 0x03, type: "", description: "Param 38" },
            { bits: 6, default: 0x05, type: "", description: "Param 39" },
            { bits: 6, default: 0x03, type: "", description: "Param 40" },
            { bits: 6, default: 0x00, type: "", description: "Param 41" },
            { bits: 6, default: 0x03, type: "", description: "Param 42" },
            { bits: 6, default: 0x05, type: "", description: "Param 43" },
            { bits: 6, default: 0x01, type: "", description: "Param 44" },
            { bits: 6, default: 0x03, type: "", description: "Param 45" },
            { bits: 6, default: 0x00, type: "", description: "Param 46" }
        ]
    }
];